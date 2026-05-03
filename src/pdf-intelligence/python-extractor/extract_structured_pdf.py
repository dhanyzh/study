import argparse
import json
import os
import io
import traceback


def _safe_clean_text(t: str) -> str:
    if t is None:
        return ""
    # Normalize whitespace while keeping line boundaries meaningful.
    t = t.replace("\r\n", "\n").replace("\r", "\n")
    t = "\n".join([line.strip() for line in t.split("\n") if line.strip() != ""])
    return t.strip()


def _cluster_columns(xmids, page_width, max_columns: int = 3):
    # Heuristic split based on large gaps in x-midpoints.
    if not xmids:
        return [[]]
    xs = sorted(xmids)
    gaps = []
    for i in range(len(xs) - 1):
        gaps.append((xs[i + 1] - xs[i], xs[i]))
    gaps_sorted = sorted(gaps, key=lambda x: x[0], reverse=True)
    # Decide splits by biggest gaps above a relative threshold.
    rel_threshold = 0.15 * page_width
    split_points = []
    for gap, x_left in gaps_sorted:
        if gap < rel_threshold:
            break
        split_points.append(x_left)
        if len(split_points) >= (max_columns - 1):
            break
    split_points = sorted(split_points)

    clusters = []
    for xmid in xmids:
        placed = False
        for c_idx in range(len(split_points) + 1):
            left_bound = -float("inf") if c_idx == 0 else split_points[c_idx - 1]
            right_bound = float("inf") if c_idx == len(split_points) else split_points[c_idx]
            if xmid > left_bound and xmid <= right_bound:
                while len(clusters) <= c_idx:
                    clusters.append([])
                clusters[c_idx].append(xmid)
                placed = True
                break
        if not placed:
            clusters[0].append(xmid)
    # clusters are xmid-only; the actual block assignment is done elsewhere.
    return clusters


def extract_structured(input_pdf_path: str, output_images_dir: str, do_ocr: bool, max_images: int = 15, ocr_dpi: int = 250):
    try:
        import fitz  # PyMuPDF
    except Exception as e:
        return {"success": False, "error": f"Missing dependency: PyMuPDF (fitz). {str(e)}"}

    tables = []
    images = []

    # Tables: optional via pdfplumber.
    try:
        import pdfplumber

        with pdfplumber.open(input_pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                page_num = i + 1
                try:
                    extracted = page.extract_tables() or []
                    for t_idx, table in enumerate(extracted):
                        # Normalize table: list of rows.
                        rows = []
                        for row in table:
                            if row is None:
                                continue
                            rows.append([("" if cell is None else str(cell)).strip() for cell in row])
                        tables.append({"pageNumber": page_num, "tableIndex": t_idx, "rows": rows})
                except Exception:
                    continue
    except Exception:
        # Tables are optional; extraction still succeeds without them.
        tables = []

    # Images: via PyMuPDF.
    doc = fitz.open(input_pdf_path)
    page_count = doc.page_count

    os.makedirs(output_images_dir, exist_ok=True)

    all_page_text = []
    pages = []

    # OCR optional dependencies.
    pil_available = False
    try:
        from PIL import Image  # noqa
        import pytesseract  # noqa
        pil_available = True
    except Exception:
        pil_available = False

    full_widths = []
    for page_index in range(page_count):
        page = doc.load_page(page_index)
        page_width = page.rect.width
        full_widths.append(page_width)

    for page_index in range(page_count):
        page_num = page_index + 1
        page = doc.load_page(page_index)

        # --- Text blocks (layout-aware reading order) ---
        blocks = page.get_text("blocks") or []
        # blocks: x0, y0, x1, y1, text, block_no, block_type
        text_blocks = []
        xmids = []
        for b in blocks:
            if len(b) < 5:
                continue
            x0, y0, x1, y1, txt = b[0], b[1], b[2], b[3], b[4]
            txt = _safe_clean_text(txt)
            if not txt:
                continue
            xmid = (x0 + x1) / 2.0
            xmids.append(xmid)
            text_blocks.append((x0, y0, x1, y1, txt, xmid))

        page_width = page.rect.width if page.rect else full_widths[page_index]
        # Assign blocks to columns using the xmid clustering.
        # Instead of clustering xmid values alone, we derive column thresholds.
        if xmids:
            # Determine split thresholds.
            clusters = _cluster_columns(xmids, page_width, max_columns=3)
            # Convert cluster xmid values into approximate thresholds.
            column_mids = []
            for c in clusters:
                if len(c) == 0:
                    continue
                column_mids.append(sum(c) / len(c))
            column_mids = sorted(column_mids)
        else:
            column_mids = []

        # Build columns by nearest midpoint.
        columns = [[] for _ in range(max(1, len(column_mids)))]
        if column_mids:
            for x0, y0, x1, y1, txt, xmid in text_blocks:
                nearest_idx = min(range(len(column_mids)), key=lambda i: abs(xmid - column_mids[i]))
                columns[nearest_idx].append((y0, txt))
        else:
            columns[0] = [(y0, txt) for (_, y0, _, _, txt, _) in text_blocks]

        # Sort each column top-to-bottom; then left-to-right columns.
        ordered_text_parts = []
        for col in columns:
            col_sorted = sorted(col, key=lambda x: x[0])
            ordered_text_parts.extend([t for (_, t) in col_sorted])

        base_text = "\n".join(ordered_text_parts).strip()

        # --- OCR if requested/needed ---
        ocr_text = ""
        method = "python-layout"
        if do_ocr and pil_available:
            try:
                pix = page.get_pixmap(dpi=ocr_dpi, alpha=False)
                img_bytes = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_bytes))
                # Use a conservative OCR config: treat text as sparse.
                ocr_text = pytesseract.image_to_string(img)
                ocr_text = _safe_clean_text(ocr_text)
                if ocr_text:
                    base_text = ocr_text
                    method = "python-ocr"
            except Exception:
                # Keep layout text if OCR fails.
                pass

        pages.append({
            "pageNumber": page_num,
            "content": base_text,
            "lines": base_text.split("\n") if base_text else [],
        })
        all_page_text.append(base_text)

        # --- Images extraction (for diagram intelligence later) ---
        # Images may be large; limit per job.
        image_list = page.get_images(full=True) or []
        for img_idx, img in enumerate(image_list):
            if len(images) >= max_images:
                break
            xref = img[0]
            try:
                pix = fitz.Pixmap(doc, xref)
                if pix.width <= 20 or pix.height <= 20:
                    continue
                # Save as PNG for downstream AI description.
                img_filename = f"upload_page{page_num}_img{img_idx}.png"
                img_path = os.path.join(output_images_dir, img_filename)
                pix.save(img_path)
                images.append({
                    "pageNumber": page_num,
                    "imageIndex": img_idx,
                    "figureId": f"fig_{page_num}_{img_idx}",
                    "path": img_path,
                    "mimeType": "image/png",
                })
            except Exception:
                continue

    text = "\n\n".join(all_page_text).strip()

    return {
        "success": True,
        "method": "python-structured",
        "ocrMethod": method,
        "text": text,
        "pageCount": page_count,
        "pages": pages,
        "tables": tables,
        "images": images,
    }
    # end extract_structured

    # Unreachable; kept for clarity.


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_pdf_path", type=str)
    parser.add_argument("output_images_dir", type=str)
    parser.add_argument("output_json_path", type=str)
    parser.add_argument("--ocr", action="store_true")
    parser.add_argument("--max-images", type=int, default=15)
    parser.add_argument("--ocr-dpi", type=int, default=250)
    args = parser.parse_args()

    try:
        result = extract_structured(
            args.input_pdf_path,
            args.output_images_dir,
            do_ocr=bool(args.ocr),
            max_images=int(args.max_images),
            ocr_dpi=int(args.ocr_dpi),
        )
        with open(args.output_json_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False)
    except Exception as e:
        out = {"success": False, "error": str(e), "trace": traceback.format_exc()}
        try:
            with open(args.output_json_path, "w", encoding="utf-8") as f:
                json.dump(out, f, ensure_ascii=False)
        except Exception:
            pass
        raise


if __name__ == "__main__":
    main()

