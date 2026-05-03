/**
 * Parsing Service - Convert raw text into structured content blocks
 */

/**
 * Detect content type based on patterns
 */
function detectBlockType(text, prevText = '', nextText = '') {
  const trimmed = text.trim();
  const lines = trimmed.split('\n');

  // Empty block
  if (!trimmed) return 'empty';

  // Heading detection
  if (/^#{1,6}\s/.test(trimmed)) return 'markdown-heading';
  if (/^\d{1,3}\.?\s+[A-Z][^.]*$/.test(trimmed)) return 'heading';
  if (/^[A-Z]{2,}(\s+[A-Z]{2,})*\s*$/.test(trimmed) && trimmed.length < 80) return 'heading';

  // MCQ detection
  if (/^[A-D]\)\s/.test(trimmed) && lines.length <= 5) return 'mcq-option';
  if (/^(?:Q:|Question:)\s/.test(trimmed)) return 'question';
  if (/^[a-zA-Z0-9]+\.\s+[A-Z].*\?/.test(trimmed)) return 'question';

  // List detection
  if (/^[\s]*[-•*]\s+/.test(trimmed)) return 'list';
  if (/^[\s]*\d+\.\s+/.test(trimmed)) return 'numbered-list';

  // Code detection
  if (/```/.test(trimmed)) return 'code-block';
  if (/^[\s]{4,}[a-zA-Z_$][\w$]*\s*=/.test(trimmed)) return 'code';

  // Table detection
  if (/\|[\s\w\-]+\|/.test(trimmed)) return 'table';

  // Formula detection
  if (/\$[\s\S]*?\$|\\[a-zA-Z]+\{/.test(trimmed)) return 'formula';

  // Definition detection
  if (/^[A-Z][a-z]+\s+is\s+|^Definition:|^Meaning:/.test(trimmed)) return 'definition';

  // Default: paragraph
  return 'paragraph';
}

/**
 * Parse text into structured blocks
 */
export function parseIntoBlocks(text, pageNumber = 1) {
  if (!text || typeof text !== 'string') return [];

  const blocks = [];
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());

  let blockIndex = 0;

  paragraphs.forEach((paragraph, idx) => {
    const type = detectBlockType(
      paragraph,
      idx > 0 ? paragraphs[idx - 1] : '',
      idx < paragraphs.length - 1 ? paragraphs[idx + 1] : ''
    );

    if (type === 'empty') return;

    // Handle MCQ specially - group consecutive MCQ options
    if (type === 'mcq-option' || (type === 'question' && paragraph.includes(')'))) {
      const lines = paragraph.split('\n').filter((l) => l.trim());
      const mcqBlock = {
        type: 'mcq',
        rawContent: paragraph,
        content: lines.join('\n'),
        pageNumber,
        blockIndex: blockIndex++,
      };
      blocks.push(mcqBlock);
    } else if (type === 'code') {
      const codeBlock = {
        type: 'code',
        rawContent: paragraph,
        content: paragraph.trim(),
        language: detectCodeLanguage(paragraph),
        pageNumber,
        blockIndex: blockIndex++,
      };
      blocks.push(codeBlock);
    } else if (type === 'table') {
      const tableData = parseTable(paragraph);
      const tableBlock = {
        type: 'table',
        rawContent: paragraph,
        content: paragraph,
        parsedTable: tableData,
        pageNumber,
        blockIndex: blockIndex++,
      };
      blocks.push(tableBlock);
    } else if (type === 'heading' || type === 'markdown-heading') {
      const level = getHeadingLevel(paragraph);
      const headingBlock = {
        type: 'heading',
        level,
        rawContent: paragraph,
        content: paragraph.replace(/^#+\s*/, '').trim(),
        pageNumber,
        blockIndex: blockIndex++,
      };
      blocks.push(headingBlock);
    } else if (type === 'list' || type === 'numbered-list') {
      const items = parseList(paragraph);
      const listBlock = {
        type: 'list',
        rawContent: paragraph,
        content: paragraph,
        items,
        ordered: type === 'numbered-list',
        pageNumber,
        blockIndex: blockIndex++,
      };
      blocks.push(listBlock);
    } else if (type === 'formula') {
      const formulaBlock = {
        type: 'formula',
        rawContent: paragraph,
        content: paragraph,
        pageNumber,
        blockIndex: blockIndex++,
      };
      blocks.push(formulaBlock);
    } else if (type === 'definition') {
      const defBlock = {
        type: 'definition',
        rawContent: paragraph,
        content: paragraph,
        pageNumber,
        blockIndex: blockIndex++,
      };
      blocks.push(defBlock);
    } else {
      // Paragraph
      const paraBlock = {
        type: 'paragraph',
        rawContent: paragraph,
        content: paragraph.trim(),
        pageNumber,
        blockIndex: blockIndex++,
      };
      blocks.push(paraBlock);
    }
  });

  return blocks;
}

/**
 * Build block hierarchy (connect headings with content)
 */
export function buildBlockHierarchy(blocks) {
  const hierarchy = [];
  let currentSection = null;
  let currentSubsection = null;

  blocks.forEach((block, idx) => {
    if (block.type === 'heading') {
      if (block.level === 1) {
        currentSection = {
          ...block,
          children: [],
        };
        hierarchy.push(currentSection);
        currentSubsection = null;
      } else if (block.level === 2 && currentSection) {
        currentSubsection = {
          ...block,
          children: [],
        };
        currentSection.children.push(currentSubsection);
      } else if (currentSubsection && currentSection) {
        currentSubsection.children.push(block);
      } else if (currentSection) {
        currentSection.children.push(block);
      }
    } else {
      // Regular block
      if (currentSubsection) {
        currentSubsection.children.push(block);
      } else if (currentSection) {
        currentSection.children.push(block);
      } else {
        hierarchy.push(block);
      }
    }
  });

  return hierarchy;
}

/**
 * Detect code language
 */
function detectCodeLanguage(code) {
  if (/\b(function|const|let|var|async|await)\b/.test(code)) return 'javascript';
  if (/\b(def|import|class|async)\b/.test(code)) return 'python';
  if (/\b(public|private|class|interface)\b/.test(code)) return 'java';
  if (/\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(code)) return 'sql';
  if (/#include|using namespace/.test(code)) return 'cpp';
  if (/^#!\/bin\//.test(code)) return 'bash';
  return 'unknown';
}

/**
 * Get heading level (1-6)
 */
function getHeadingLevel(text) {
  const match = text.match(/^#+/);
  return match ? match[0].length : 1;
}

/**
 * Parse list items
 */
function parseList(text) {
  const lines = text.split('\n');
  const items = [];

  lines.forEach((line) => {
    const match = line.match(/^[\s]*[-•*]\s+(.+)$|^[\s]*\d+\.\s+(.+)$/);
    if (match) {
      items.push((match[1] || match[2]).trim());
    }
  });

  return items;
}

/**
 * Parse table
 */
function parseTable(text) {
  const lines = text.split('\n').filter((l) => l.includes('|'));
  const rows = [];

  lines.forEach((line) => {
    const cells = line
      .split('|')
      .filter((c) => c.trim())
      .map((c) => c.trim());
    if (cells.length > 0) {
      rows.push(cells);
    }
  });

  return {
    rows,
    cols: rows.length > 0 ? rows[0].length : 0,
  };
}

/**
 * Extract key phrases from block
 */
export function extractKeyPhrases(text) {
  const phrases = [];

  // Extract all capitalized phrases
  const capitalizedPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const capitalized = text.match(capitalizedPattern) || [];
  phrases.push(...capitalized);

  // Extract quoted phrases
  const quotedPattern = /"([^"]+)"|'([^']+)'/g;
  let match;
  while ((match = quotedPattern.exec(text)) !== null) {
    phrases.push(match[1] || match[2]);
  }

  return [...new Set(phrases)]; // Remove duplicates
}

/**
 * Split into sentences
 */
export function splitIntoSentences(text) {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const parsingService = {
  parseIntoBlocks,
  buildBlockHierarchy,
  detectBlockType,
  extractKeyPhrases,
  splitIntoSentences,
};

export default parsingService;
