import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

// Use the project's extraction-service logic
const filePath = process.argv[2] || path.join(process.cwd(), 'asset', 'module 1_merged.pdf');
const outPath = process.argv[3] || path.join(process.cwd(), 'scripts', 'pdf-text-output.txt');

async function extract() {
  // Try pdfjs-dist directly
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  
  console.log(`Pages: ${doc.numPages}`);
  
  let fullText = '';
  
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    const pageText = strings.join(' ');
    fullText += `\n\n--- PAGE ${i} ---\n\n${pageText}`;
  }
  
  fs.writeFileSync(outPath, fullText, 'utf-8');
  console.log(`Extracted ${fullText.length} chars to ${outPath}`);
}

extract().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
