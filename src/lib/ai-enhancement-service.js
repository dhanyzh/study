/**
 * AI Enhancement Service - Generate summaries, MCQs, flashcards, etc.
 */

import crypto from 'crypto';
import { chatWithAI } from './ai.js';
import { cachedJsonFromPrompt } from './ai-json-cached.js';
import dbConnect from './db.js';
import ProcessedNote from '@/models/ProcessedNote';
import ProcessedMCQ from '@/models/ProcessedMCQ';
import Flashcard from '@/models/Flashcard';

/**
 * Generate summary for content
 */
export async function generateSummary(content, type = 'paragraph') {
  const prompt = `Provide a CONCISE summary (2-3 sentences max) of this educational content:

Content Type: ${type}
Content: ${content.substring(0, 1000)}

Respond with ONLY the summary, no markdown.`;

  try {
    return await chatWithAI(prompt, {}, [], { strict: true });
  } catch (error) {
    console.error('Summary generation error:', error);
    return content.substring(0, 200) + '...';
  }
}

/**
 * Generate detailed explanation
 */
export async function generateExplanation(content, type = 'notes') {
  const prompt = `Provide a detailed, easy-to-understand explanation of this educational content suitable for students.

Content Type: ${type}
Content: ${content.substring(0, 1500)}

Format your response with:
1. Main Idea
2. Key Points (3-4 bullet points)
3. Real-world Example
4. Common Misconception`;

  try {
    return await chatWithAI(prompt, {}, [], { strict: true });
  } catch (error) {
    console.error('Explanation generation error:', error);
    return content;
  }
}

/**
 * Extract key points from content
 */
export async function extractKeyPoints(content) {
  const contentHash = crypto.createHash('sha256').update(content || '').digest('hex');
  const prompt = `Extract 3-5 KEY POINTS from this educational content. Each point should be concise (one sentence max).

Content: ${content.substring(0, 1000)}

Respond with ONLY a JSON array of strings (no markdown):
["point 1", "point 2", "point 3"]`;

  try {
    return await cachedJsonFromPrompt({
      prompt,
      cacheNamespace: 'pdf-extract-key-points',
      extraKey: contentHash.slice(0, 32),
      schemaHint:
        'Return a JSON array of strings. Expected 3-5 elements, each a concise key point (string).',
      validator: (v) => Array.isArray(v) && v.every((x) => typeof x === 'string'),
      ttlSeconds: 60 * 60 * 24 * 7,
    });
  } catch (error) {
    console.error('Key points extraction error:', error);
    return [];
  }
}

/**
 * Generate MCQs from content
 */
export async function generateMCQsFromContent(content, subject = 'General', count = 3) {
  const contentHash = crypto.createHash('sha256').update(content || '').digest('hex');
  const prompt = `Generate ${count} high-quality multiple-choice questions from this educational content.

Subject: ${subject}
Content: ${content.substring(0, 2000)}

Respond with ONLY a valid JSON array (no markdown):
[
  {
    "question": "question text?",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": 0,
    "explanation": "why this is correct",
    "difficulty": "easy|medium|hard"
  }
]`;

  try {
    const parsed = await cachedJsonFromPrompt({
      prompt,
      cacheNamespace: 'pdf-generate-mcqs-from-content',
      extraKey: `${subject}:${count}:${contentHash.slice(0, 32)}`,
      schemaHint:
        'Return a JSON array of MCQ objects. Each MCQ: question (string), options (array of 4 strings), correctAnswer (0-3 number), explanation (string), difficulty (easy|medium|hard).',
      validator: (v) =>
        Array.isArray(v) &&
        v.every(
          (mcq) =>
            mcq &&
            typeof mcq.question === 'string' &&
            Array.isArray(mcq.options) &&
            mcq.options.length >= 2 &&
            typeof mcq.correctAnswer === 'number' &&
            typeof mcq.explanation === 'string' &&
            ['easy', 'medium', 'hard'].includes(mcq.difficulty),
        ),
    });

    return parsed.map((mcq) => ({
      question: mcq.question,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer ?? 0,
      explanation: mcq.explanation || '',
      difficulty: mcq.difficulty || 'medium',
    }));
  } catch (error) {
    console.error('MCQ generation error:', error);
    return [];
  }
}

/**
 * Generate flashcards
 */
export async function generateFlashcards(content, count = 5) {
  const contentHash = crypto.createHash('sha256').update(content || '').digest('hex');
  const prompt = `Create ${count} study flashcards from this content. Each flashcard should have:
- A concise question on the front
- A brief, clear answer on the back

Content: ${content.substring(0, 1500)}

Respond with ONLY a JSON array (no markdown):
[
  {
    "question": "Q?",
    "answer": "A.",
    "explanation": "additional context"
  }
]`;

  try {
    return await cachedJsonFromPrompt({
      prompt,
      cacheNamespace: 'pdf-generate-flashcards',
      extraKey: `${count}:${contentHash.slice(0, 32)}`,
      schemaHint:
        'Return a JSON array of flashcards. Each flashcard: question (string), answer (string), explanation (string).',
      validator: (v) =>
        Array.isArray(v) &&
        v.every(
          (card) =>
            card &&
            typeof card.question === 'string' &&
            typeof card.answer === 'string' &&
            typeof card.explanation === 'string',
        ),
      ttlSeconds: 60 * 60 * 24 * 3,
    });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    return [];
  }
}

/**
 * Generate practice questions
 */
export async function generatePracticeQuestions(content, subject = 'General', count = 2) {
  const prompt = `Generate ${count} practice questions (not MCQ) from this content. Include a sample answer for each.

Subject: ${subject}
Content: ${content.substring(0, 1500)}

Respond with ONLY a JSON array (no markdown):
[
  {
    "question": "question",
    "sampleAnswer": "answer",
    "hints": ["hint 1", "hint 2"],
    "difficulty": "easy|medium|hard"
  }
]`;

  try {
    const response = await chatWithAI(prompt, {}, [], { strict: true });
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Practice question generation error:', error);
    return [];
  }
}

/**
 * Suggest real-world applications
 */
export async function suggestApplications(content, subject = 'General') {
  const prompt = `Suggest 2-3 real-world applications or practical uses of this concept from ${subject}.

Content: ${content.substring(0, 1000)}

Respond with ONLY a JSON array of strings (no markdown):
["application 1", "application 2"]`;

  try {
    const response = await chatWithAI(prompt, {}, [], { strict: true });
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Applications suggestion error:', error);
    return [];
  }
}

/**
 * Create study guide outline
 */
export async function createStudyGuide(blocks, subject = 'General') {
  const combinedContent = blocks.map((b) => b.content).join('\n\n');

  const prompt = `Create a structured study guide outline from this content.

Subject: ${subject}
Content: ${combinedContent.substring(0, 2000)}

Respond with ONLY a JSON object (no markdown):
{
  "title": "guide title",
  "sections": [
    {
      "heading": "section",
      "keyPoints": ["point1", "point2"],
      "studyTips": ["tip1", "tip2"]
    }
  ]
}`;

  try {
    const response = await chatWithAI(prompt, {}, [], { strict: true });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Study guide creation error:', error);
    return null;
  }
}

/**
 * Batch enhance content blocks
 */
export async function enhanceContentBlocks(blocks, subject = 'General') {
  const concurrency = 2; // Keep small to avoid provider rate-limit explosions.
  let aiDown = false; // Global flag: skip AI calls once we know it's down

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

  function makeFallback(block, errorMsg = 'AI unavailable') {
    const fallbackSummary = block.content.substring(0, 250).trim() + (block.content.length > 250 ? '...' : '');
    return {
      ...block,
      enhancements: {
        summary: fallbackSummary,
        keyPoints: [block.content.substring(0, 100)],
        mcqs: block.type === 'paragraph' ? [{
          question: `Which concept is discussed in: "${block.content.substring(0, 50)}..."?`,
          options: ['Main topic', 'Related concept', 'Background detail', 'None of above'],
          correctAnswer: 0,
          explanation: 'This is a fallback MCQ generated during offline mode.',
          difficulty: 'easy'
        }] : [],
        flashcards: [],
        offline: true,
        error: errorMsg,
      },
    };
  }

  return mapWithConcurrency(blocks, concurrency, async (block) => {
    // If AI is already known to be down, skip immediately
    if (aiDown) {
      return makeFallback(block, 'AI unavailable (skipped after previous failure)');
    }

    try {
      const summary = await generateSummary(block.content, block.type);
      // If summary succeeded, AI is working — continue with other enhancements
      const keyPoints = await extractKeyPoints(block.content);
      const mcqs = block.type === 'paragraph' ? await generateMCQsFromContent(block.content, subject, 2) : [];
      const flashcards = block.type !== 'code' ? await generateFlashcards(block.content, 2) : [];

      return {
        ...block,
        enhancements: {
          summary,
          keyPoints,
          mcqs,
          flashcards,
        },
      };
    } catch (error) {
      console.error('Error enhancing block (switching to fallback for all remaining):', error?.message || error);
      // Mark AI as down so subsequent blocks skip immediately
      aiDown = true;
      return makeFallback(block, error?.message || String(error));
    }
  });
}

/**
 * Create processed content documents from enhanced blocks
 */
export async function createProcessedContent(enhancedBlocks, pdfUploadId, userId, subjectMapping = {}) {
  await dbConnect();

  const processedNotes = [];
  const processedMCQs = [];
  const processedFlashcards = [];

  for (const block of enhancedBlocks) {
    const { enhancements, topicMapping } = block;

    // Create processed notes
    if (enhancements.summary && block.type === 'paragraph') {
      const note = new ProcessedNote({
        userId,
        contentBlockId: block._id,
        pdfUploadId,
        title: `Note: ${block.content.substring(0, 50)}...`,
        content: block.content,
        summary: enhancements.summary,
        topicMapping: {
          subject: topicMapping?.subject || subjectMapping.subject || 'General',
          chapter: topicMapping?.chapter || subjectMapping.chapter || 'General',
          topic: topicMapping?.topic || `Topic from page ${block.pageNumber}`,
        },
        difficulty: block.difficulty || 'medium',
        source: 'pdf-upload',
      });
      processedNotes.push(await note.save());
    }

    // Create processed MCQs
    if (enhancements.mcqs && enhancements.mcqs.length > 0) {
      for (const mcq of enhancements.mcqs) {
        const processedMCQ = new ProcessedMCQ({
          userId,
          contentBlockId: block._id,
          pdfUploadId,
          question: mcq.question,
          options: mcq.options,
          correctAnswer: mcq.correctAnswer,
          explanation: mcq.explanation,
          topicMapping: {
            subject: topicMapping?.subject || subjectMapping.subject || 'General',
            chapter: topicMapping?.chapter || subjectMapping.chapter || 'General',
            topic: topicMapping?.topic || `Topic from page ${block.pageNumber}`,
          },
          difficulty: mcq.difficulty || 'medium',
          source: 'ai-generated',
        });
        processedMCQs.push(await processedMCQ.save());
      }
    }

    // Create processed flashcards
    if (enhancements.flashcards && enhancements.flashcards.length > 0) {
      for (const card of enhancements.flashcards) {
        const flashcard = new Flashcard({
          userId,
          contentBlockId: block._id,
          pdfUploadId,
          question: card.question,
          answer: card.answer,
          explanation: card.explanation,
          topicMapping: {
            subject: topicMapping?.subject || subjectMapping.subject || 'General',
            chapter: topicMapping?.chapter || subjectMapping.chapter || 'General',
            topic: topicMapping?.topic || `Topic from page ${block.pageNumber}`,
          },
          difficulty: block.difficulty || 'medium',
          source: 'ai-generated',
        });
        processedFlashcards.push(await flashcard.save());
      }
    }
  }
  return {
    processedNotes,
    processedMCQs,
    processedFlashcards,
  };
}

const aiEnhancementService = {
  generateSummary,
  generateExplanation,
  extractKeyPoints,
  generateMCQsFromContent,
  generateFlashcards,
  generatePracticeQuestions,
  suggestApplications,
  createStudyGuide,
  enhanceContentBlocks,
  createProcessedContent,
};

export default aiEnhancementService;
