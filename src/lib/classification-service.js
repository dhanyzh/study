/**
 * Classification Service - Categorize content blocks using rules + AI
 */

import crypto from 'crypto';
import { cachedJsonFromPrompt } from './ai-json-cached.js';

/**
 * Rule-based content classification
 */
export function classifyByRules(block) {
  const content = block.content || '';
  const type = block.type || '';
  const confidence = [];
  let primaryCategory = 'notes';

  // MCQ detection
  if (
    type === 'mcq' ||
    (content.match(/^[A-D]\)/gm) || []).length >= 2 ||
    /\?$/.test(content.trim())
  ) {
    primaryCategory = 'mcq';
    confidence.push({ category: 'mcq', score: 0.9 });
  }

  // Question detection
  if (/^(What|Why|How|When|Where|Which|Who|Explain|Describe|Compare|Discuss)\b/i.test(content)) {
    primaryCategory = 'question';
    confidence.push({ category: 'question', score: 0.85 });
  }

  // Definition detection
  if (/^[A-Z][a-z]+\s+(is\s+defined\s+as|means|refers\s+to)/i.test(content) || content.length < 200) {
    primaryCategory = 'definition';
    confidence.push({ category: 'definition', score: 0.8 });
  }

  // Formula detection
  if (type === 'formula' || /[\$\\{}\(\)^_]/.test(content)) {
    primaryCategory = 'formula';
    confidence.push({ category: 'formula', score: 0.85 });
  }

  // Code detection
  if (type === 'code' || /^[\s]*(function|class|def|SELECT|const|var)\b/m.test(content)) {
    primaryCategory = 'code';
    confidence.push({ category: 'code', score: 0.9 });
  }

  // Table detection
  if (type === 'table' || (block.parsedTable && block.parsedTable.rows.length > 2)) {
    primaryCategory = 'table';
    confidence.push({ category: 'table', score: 0.9 });
  }

  // Example/Note detection
  if (/^(Example|Note|Important|Key Point|Remember)[\s:]*/i.test(content)) {
    primaryCategory = 'notes';
    confidence.push({ category: 'notes', score: 0.8 });
  }

  if (confidence.length === 0) {
    confidence.push({ category: 'notes', score: 0.6 });
  }

  return {
    primaryCategory,
    confidence: confidence.sort((a, b) => b.score - a.score),
    method: 'rule-based',
  };
}

/**
 * AI-based classification for ambiguous blocks
 */
export async function classifyByAI(block, subject = 'General') {
  const allowedCategories = new Set(['notes', 'question', 'mcq', 'definition', 'formula', 'code', 'table', 'example']);

  const prompt = `Classify this educational content into ONE primary category.
Content type hint: ${block.type}
Content: ${block.content.substring(0, 500)}

Respond with ONLY this JSON (no markdown):
{
  "category": "notes|question|mcq|definition|formula|code|table|example",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

  try {
    const contentHash = crypto.createHash('sha256').update(block.content || '').digest('hex');
    const classified = await cachedJsonFromPrompt({
      prompt,
      cacheNamespace: 'pdf-classify-by-ai',
      extraKey: contentHash,
      validator: (v) =>
        v !== null &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        typeof v.category === 'string' &&
        allowedCategories.has(v.category) &&
        typeof v.confidence === 'number' &&
        v.confidence >= 0 &&
        v.confidence <= 1 &&
        typeof v.reasoning === 'string',
      schemaHint: `Return a JSON object with keys: category (one of ${Array.from(allowedCategories).join(', ')}), confidence (0-1 number), reasoning (string).`,
    });

    return {
      primaryCategory: classified.category || 'notes',
      confidence: [{ category: classified.category || 'notes', score: classified.confidence || 0.5 }],
      reasoning: classified.reasoning,
      method: 'ai-based',
    };
  } catch (error) {
    console.error('AI classification error:', error);
    return {
      primaryCategory: 'notes',
      confidence: [{ category: 'notes', score: 0.3 }],
      method: 'ai-fallback',
      error: error.message,
    };
  }
}

/**
 * Hybrid classification - rules first, AI for uncertain cases
 */
export async function classifyContentBlock(block, subject = 'General', aiThreshold = 0.7) {
  // First try rule-based
  const rulesResult = classifyByRules(block);

  // If confidence is low, use AI
  if (rulesResult.confidence[0].score < aiThreshold) {
    const aiResult = await classifyByAI(block, subject);
    return {
      ...aiResult,
      rulesScore: rulesResult.confidence[0].score,
      hybrid: true,
    };
  }

  return rulesResult;
}

/**
 * Classify multiple blocks in batch
 */
export async function classifyBlocks(blocks, subject = 'General', aiThreshold = 0.7) {
  const concurrency = 3; // Keep small to avoid provider rate-limit explosions.

  async function mapWithConcurrency(items, limit, mapper) {
    const results = new Array(items.length);
    let nextIndex = 0;

    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (nextIndex < items.length) {
        const idx = nextIndex++;
        results[idx] = await mapper(items[idx], idx);
      }
    });

    await Promise.all(workers);
    return results;
  }

  return mapWithConcurrency(blocks, concurrency, async (block) => {
    try {
      const classification = await classifyContentBlock(block, subject, aiThreshold);
      return { ...block, classification };
    } catch (error) {
      console.error('Error classifying block:', error);
      return {
        ...block,
        classification: {
          primaryCategory: 'notes',
          confidence: [{ category: 'notes', score: 0 }],
          error: error.message,
        },
      };
    }
  });
}

/**
 * Extract MCQ structure from content
 */
export function extractMCQ(content) {
  const lines = content.split('\n');
  let question = '';
  const options = [];
  let correctAnswer = null;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Question line (ends with ?)
    if (/\?$/.test(trimmed) && !trimmed.match(/^[A-D]\)/)) {
      question = trimmed;
    }

    // Option line
    const optionMatch = trimmed.match(/^([A-D])\)\s+(.+)$/);
    if (optionMatch) {
      const [, letter, optionText] = optionMatch;
      options.push(optionText);

      // Check for correct answer marker
      if (/✓|correct|✓/.test(line)) {
        correctAnswer = options.length - 1;
      }
    }
  });

  return {
    question: question || 'Question not clearly defined',
    options,
    correctAnswer: correctAnswer !== null ? correctAnswer : 0,
    hasCorrectAnswer: correctAnswer !== null,
  };
}

/**
 * Extract question structure
 */
export function extractQuestion(content) {
  const lines = content.split('\n');
  const questionLine = lines[0];
  const explanation = lines.slice(1).join('\n').trim();

  return {
    question: questionLine.trim(),
    explanation,
    suggestedAnswerLength: explanation.length,
  };
}

/**
 * Extract definition
 */
export function extractDefinition(content) {
  const match = content.match(/^([^:]+?):\s*(.+)$/s);
  if (match) {
    return {
      term: match[1].trim(),
      definition: match[2].trim(),
    };
  }

  // Alternative format
  const lines = content.split('\n');
  return {
    term: lines[0]?.trim() || 'Term',
    definition: lines.slice(1).join('\n').trim() || '',
  };
}

/**
 * Detect difficulty level
 */
export function detectDifficulty(content, category = 'notes') {
  let difficulty = 'medium';
  const words = content.toLowerCase();
  const length = content.length;

  // Easy indicators
  if (/^(definition|basic|simple|example)/i.test(content)) {
    difficulty = 'easy';
  }

  // Hard indicators
  if (/complex|advanced|derive|proof|theorem|comprehensive/i.test(words) || length > 500) {
    difficulty = 'hard';
  }

  if (category === 'formula' || category === 'code') {
    difficulty = length < 100 ? 'easy' : length < 300 ? 'medium' : 'hard';
  }

  return difficulty;
}

const classificationService = {
  classifyByRules,
  classifyByAI,
  classifyContentBlock,
  classifyBlocks,
  extractMCQ,
  extractQuestion,
  extractDefinition,
  detectDifficulty,
};

export default classificationService;
