/**
 * Extraction Service - PDF to Text conversion
 * Handles both digital PDFs and OCR for scanned documents
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

async function loadPdfParse() {
  const mod = await import('pdf-parse');
  return mod.default || mod;
}

/**
 * Extract text from PDF (digital)
 * @param {Buffer} fileBuffer - PDF file buffer
 * @returns {Promise<Object>} - Extracted text and metadata
 */
export async function extractTextFromPDF(fileBuffer) {
  try {
    const pdfParse = await loadPdfParse();
    const data = await pdfParse(fileBuffer);

    return {
      success: true,
      method: 'digital',
      text: data.text,
      pageCount: data.numpages,
      metadata: data.info || {},
      pages: extractPageContent(data),
    };
  } catch (error) {
    console.warn('Digital PDF extraction failed:', error.message);
    return {
      success: false,
      method: 'digital',
      error: error.message,
    };
  }
}

/**
 * Extract content page-by-page for better structuring
 */
function extractPageContent(pdfData) {
  const pages = [];

  if (pdfData.version && pdfData.pages) {
    // If pdf-parse provides page-level data
    return pdfData.pages.map((page, idx) => ({
      pageNumber: idx + 1,
      content: page.text || '',
      lines: page.text ? page.text.split('\n') : [],
    }));
  }

  // Fallback: split by estimated page breaks
  const fullText = pdfData.text;
  const estimatedLinesPerPage = 40; // Rough estimate
  const lines = fullText.split('\n');
  let currentPage = 1;
  let currentPageLines = [];

  lines.forEach((line, idx) => {
    currentPageLines.push(line);

    if (currentPageLines.length >= estimatedLinesPerPage) {
      pages.push({
        pageNumber: currentPage,
        content: currentPageLines.join('\n'),
        lines: currentPageLines,
      });
      currentPageLines = [];
      currentPage++;
    }
  });

  if (currentPageLines.length > 0) {
    pages.push({
      pageNumber: currentPage,
      content: currentPageLines.join('\n'),
      lines: currentPageLines,
    });
  }

  return pages;
}

/**
 * Fallback: Extract text without OCR (for testing)
 * Note: Real implementation would use Tesseract.js for scanned PDFs
 */
export async function fallbackExtraction(fileBuffer) {
  try {
    // Attempt simple extraction
    const text = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 1000000));

    return {
      success: true,
      method: 'fallback',
      text: text || '[PDF extraction failed - likely scanned or encrypted]',
      pageCount: 1,
      pages: [
        {
          pageNumber: 1,
          content: text,
          lines: text.split('\n'),
        },
      ],
    };
  } catch (error) {
    return {
      success: false,
      method: 'fallback',
      error: error.message,
    };
  }
}

/**
 * Main extraction orchestrator
 */
export async function extractPDF(fileBuffer, options = {}) {
  console.log('🔍 Starting PDF extraction...');

  const {
    ocrMode = 'auto', // 'auto' | 'force' | 'off'
    minTextCharsForOcr = 2500,
    maxImages = 8,
    ocrDpi = 250,
    includeImageBytes = true,
  } = options;

  // 1) Digital extraction (fast path)
  const digital = await extractTextFromPDF(fileBuffer);
  const digitalTextLen = digital?.success ? (digital.text || '').trim().length : 0;

  const needsOcr =
    ocrMode === 'force'
      ? true
      : ocrMode === 'auto'
        ? !digital?.success || digitalTextLen < minTextCharsForOcr
        : false;

  // 2) Structured extraction (PyMuPDF + optional OCR + tables + images)
  const pythonResult = await extractStructuredWithPython(fileBuffer, {
    doOcr: needsOcr,
    maxImages,
    ocrDpi,
    includeImageBytes,
  });

  if (pythonResult?.success) {
    console.log(`✓ Extraction successful via ${pythonResult.method} method`);
    console.log(`  Pages: ${pythonResult.pageCount}`);
    console.log(`  Text length: ${(pythonResult.text || '').length} characters`);
    return pythonResult;
  }

  // 3) Fallback: if python extraction isn't available, return the digital text if we have it.
  if (digital?.success) {
    console.log('⚠️ Python structured extraction unavailable; using digital extraction output.');
    return digital;
  }

  console.log('⚠️ Digital extraction failed; trying fallback extraction.');
  return await fallbackExtraction(fileBuffer);
}

async function extractStructuredWithPython(fileBuffer, options) {
  const {
    doOcr,
    maxImages,
    ocrDpi,
    includeImageBytes,
  } = options || {};

  const pythonBin = process.env.PYTHON_BIN || 'python';
  const scriptPath = fileURLToPath(new URL('../pdf-intelligence/python-extractor/extract_structured_pdf.py', import.meta.url));

  // Create isolated temp workspace for input + JSON output + images.
  const runId = crypto.randomBytes(8).toString('hex');
  const workDir = path.join(os.tmpdir(), `studyos-pdf-${runId}`);
  const imagesDir = path.join(workDir, 'images');
  const inputPath = path.join(workDir, 'input.pdf');
  const outputJsonPath = path.join(workDir, 'out.json');

  try {
    await fs.mkdir(workDir, { recursive: true });
    await fs.writeFile(inputPath, fileBuffer);

    const args = [
      scriptPath,
      inputPath,
      imagesDir,
      outputJsonPath,
    ];

    if (doOcr) args.push('--ocr');
    if (typeof maxImages === 'number') {
      args.push('--max-images', String(maxImages));
    }
    if (typeof ocrDpi === 'number') {
      args.push('--ocr-dpi', String(ocrDpi));
    }

    const child = spawn(pythonBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString('utf-8'); });

    const exitCode = await new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('close', (code) => resolve(code ?? 1));
    });

    if (exitCode !== 0) {
      return {
        success: false,
        method: 'python-structured',
        error: `Python extractor exited with code ${exitCode}: ${stderr.slice(0, 1200)}`,
      };
    }

    const outRaw = await fs.readFile(outputJsonPath, 'utf-8');
    const parsed = JSON.parse(outRaw);

    if (!parsed || !parsed.success) {
      return {
        success: false,
        method: 'python-structured',
        error: parsed?.error || 'Python extractor returned no success payload.',
      };
    }

    // Convert extracted images into base64 so downstream workers can operate
    // even if we clean temp directories later.
    if (Array.isArray(parsed.images) && includeImageBytes) {
      const images = [];
      for (const img of parsed.images) {
        if (!img?.path) continue;
        try {
          const bytes = await fs.readFile(img.path);
          images.push({
            pageNumber: img.pageNumber,
            imageIndex: img.imageIndex,
            figureId: img.figureId,
            mimeType: img.mimeType,
            imageBase64: bytes.toString('base64'),
          });
        } catch {
          images.push({
            pageNumber: img.pageNumber,
            imageIndex: img.imageIndex,
            figureId: img.figureId,
            mimeType: img.mimeType,
          });
        }
      }
      parsed.images = images;
    }

    return parsed;
  } catch (error) {
    // If python isn't installed, fail gracefully (caller already decides fallback).
    const message = error?.message || String(error);
    if (message.includes('not found') || message.includes('ENOENT')) {
      return {
        success: false,
        method: 'python-structured',
        error: `Python runtime not available ('${pythonBin}'). Install Python + OCR deps in production to enable OCR.`,
      };
    }
    return {
      success: false,
      method: 'python-structured',
      error: message,
    };
  } finally {
    // Best-effort cleanup; if downstream needs image bytes, we already converted to base64 above.
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

/**
 * Clean and normalize extracted text
 */
export function normalizeText(text) {
  if (!text) return '';

  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, '  ') // Convert tabs to spaces
    .replace(/â€“/g, '–') // Fix en-dash artifact
    .replace(/â€”/g, '—') // Fix em-dash artifact
    .replace(/â€™/g, "'") // Fix apostrophe artifact
    .replace(/â€˜/g, "'") // Fix apostrophe artifact
    .replace(/â€œ/g, '"') // Fix quote artifact
    .replace(/â€ /g, '"') // Fix quote artifact
    .replace(/â€¢/g, '•') // Fix bullet artifact
    .replace(/ï¸ /g, '')   // Fix variation selector artifact
    .replace(/Â/g, '')     // Fix non-breaking space artifact
    .replace(/  +/g, ' ')  // Multiple spaces to single space
    .replace(/\n\n\n+/g, '\n\n') // Multiple newlines to double
    .trim();
}

/**
 * Split text into manageable chunks for processing
 */
export function chunkText(text, chunkSize = 5000, overlap = 500) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({
      content: text.substring(start, end),
      startIndex: start,
      endIndex: end,
      chunkIndex: chunks.length,
    });
    start = end - overlap; // Create overlap for context
  }

  return chunks;
}

/**
 * Extract metadata from PDF
 */
export function extractMetadata(pdfData) {
  return {
    title: pdfData.info?.Title || 'Unknown',
    author: pdfData.info?.Author || 'Unknown',
    subject: pdfData.info?.Subject || '',
    creator: pdfData.info?.Creator || '',
    producer: pdfData.info?.Producer || '',
    creationDate: pdfData.info?.CreationDate || null,
    modificationDate: pdfData.info?.ModDate || null,
    pageCount: pdfData.numpages || 0,
  };
}

const extractionService = {
  extractTextFromPDF,
  extractPDF,
  normalizeText,
  chunkText,
  extractMetadata,
};

export default extractionService;
