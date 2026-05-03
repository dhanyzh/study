/**
 * Topic Mapping Service - Map content to Subject → Chapter → Topic hierarchy
 */

import crypto from 'crypto';
import { cachedJsonFromPrompt } from './ai-json-cached.js';
import { chatWithAI } from './ai.js';
import { SUBJECTS } from './constants.js';

/**
 * Extract keywords from content for topic matching
 */
export function extractKeywords(content, limit = 10) {
  const words = content.toLowerCase().split(/\s+/);

  // Remove common words
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'is',
    'are',
    'was',
    'be',
    'have',
    'has',
    'do',
    'does',
    'will',
    'would',
  ]);

  const keywords = words
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, limit);

  return [...new Set(keywords)];
}

/**
 * Rule-based topic matching
 */
export function matchTopicsByRules(content, subject = 'General') {
  const keywords = extractKeywords(content);
  const subject_obj = SUBJECTS.find((s) => s.slug === subject);

  if (!subject_obj) {
    return {
      subject: 'General',
      chapter: 'Miscellaneous',
      topic: 'Other',
      confidence: 0.3,
    };
  }

  // Find best matching chapter
  let bestChapter = subject_obj.chapters ? subject_obj.chapters[0] : { name: 'Introduction', slug: 'intro' };
  let chapterMatches = 0;

  if (subject_obj.chapters) {
    subject_obj.chapters.forEach((chapter) => {
      const chapterKeywords = chapter.name.toLowerCase().split(/\s+/);
      const matches = keywords.filter((k) => chapterKeywords.some((ck) => ck.includes(k) || k.includes(ck)));

      if (matches.length > chapterMatches) {
        chapterMatches = matches.length;
        bestChapter = chapter;
      }
    });
  }

  // Find best matching topic
  let bestTopic = bestChapter.topics ? bestChapter.topics[0] : { name: 'General', slug: 'general' };
  let topicMatches = 0;

  if (bestChapter.topics) {
    bestChapter.topics.forEach((topic) => {
      const topicKeywords = topic.name.toLowerCase().split(/\s+/);
      const matches = keywords.filter((k) => topicKeywords.some((tk) => tk.includes(k) || k.includes(tk)));

      if (matches.length > topicMatches) {
        topicMatches = matches.length;
        bestTopic = topic;
      }
    });
  }

  const confidence = Math.min((chapterMatches + topicMatches) / keywords.length, 1);

  return {
    subject: subject_obj.name,
    chapter: bestChapter.name,
    topic: bestTopic.name,
    confidence,
    keywordMatches: chapterMatches + topicMatches,
  };
}

/**
 * AI-based topic classification
 */
export async function classifyTopicByAI(content, subject = 'General') {
  const allTopics = SUBJECTS.flatMap((s) =>
    (s.chapters || []).flatMap((c) =>
      (c.topics || []).map((t) => ({ subject: s.name, chapter: c.name, topic: t.name }))
    )
  );

  const topicList = allTopics.map((t) => `${t.subject} → ${t.chapter} → ${t.topic}`).join(', ');

  const prompt = `Classify this educational content into the most relevant topic from this hierarchy:

${topicList}

Content: ${content.substring(0, 1500)}

Respond with ONLY this JSON (no markdown):
{
  "subject": "subject name",
  "chapter": "chapter name",
  "topic": "topic name",
  "confidence": 0.0-1.0,
  "reasoning": "brief reason"
}`;

  try {
    const contentHash = crypto.createHash('sha256').update(content || '').digest('hex');
    const classified = await cachedJsonFromPrompt({
      prompt,
      cacheNamespace: 'pdf-topic-classify-by-ai',
      extraKey: contentHash,
      validator: (v) =>
        v !== null &&
        typeof v === 'object' &&
        typeof v.subject === 'string' &&
        typeof v.chapter === 'string' &&
        typeof v.topic === 'string' &&
        typeof v.confidence === 'number' &&
        v.confidence >= 0 &&
        v.confidence <= 1 &&
        typeof v.reasoning === 'string',
      schemaHint:
        'Return { subject: string, chapter: string, topic: string, confidence: number 0-1, reasoning: string }',
    });

    return {
      subject: classified.subject,
      chapter: classified.chapter,
      topic: classified.topic,
      confidence: classified.confidence || 0.7,
      method: 'ai-based',
    };
  } catch (error) {
    console.error('AI topic classification error:', error);
  }

  return null;
}

/**
 * Hybrid topic mapping - rules first, AI for uncertain
 */
export async function mapContentTopic(content, subject = 'General', aiThreshold = 0.5) {
  // First try rule-based
  const rulesResult = matchTopicsByRules(content, subject);

  // If confidence is low, try AI
  if (rulesResult.confidence < aiThreshold) {
    try {
      const aiResult = await classifyTopicByAI(content, subject);
      if (aiResult && aiResult.confidence > rulesResult.confidence) {
        return {
          ...aiResult,
          rulesScore: rulesResult.confidence,
          hybrid: true,
        };
      }
    } catch (error) {
      console.warn('AI fallback failed:', error);
    }
  }

  return {
    ...rulesResult,
    method: 'rule-based',
  };
}

/**
 * Map multiple content blocks to topics
 */
export async function mapContentBlocksToTopics(blocks, subject = 'General') {
  const mapped = [];

  for (const block of blocks) {
    try {
      const topicMapping = await mapContentTopic(block.content, subject);
      mapped.push({
        ...block,
        topicMapping,
      });
    } catch (error) {
      console.error('Error mapping block to topic:', error);
      mapped.push({
        ...block,
        topicMapping: {
          subject,
          chapter: 'Uncategorized',
          topic: 'General',
          confidence: 0,
          error: error.message,
        },
      });
    }
  }

  return mapped;
}

/**
 * Suggest subject for PDF based on content
 */
export async function suggestSubject(content) {
  const subjects = SUBJECTS.map((s) => s.name).join(', ');

  const prompt = `Which academic subject does this content belong to? Choose from: ${subjects}

Content: ${content.substring(0, 1000)}

Respond with ONLY the subject name.`;

  try {
    const response = await chatWithAI(prompt);
    const subject = response.trim();

    const found = SUBJECTS.find(
      (s) => s.name.toLowerCase() === subject.toLowerCase() || s.slug === subject.toLowerCase()
    );

    return found ? found.name : SUBJECTS[0].name;
  } catch (error) {
    console.error('Subject suggestion error:', error);
    return SUBJECTS[0].name;
  }
}

/**
 * Create topic hierarchy visualization
 */
export function buildTopicHierarchy(mappedBlocks) {
  const hierarchy = {};

  mappedBlocks.forEach((block) => {
    const { subject, chapter, topic } = block.topicMapping;

    if (!hierarchy[subject]) {
      hierarchy[subject] = {};
    }

    if (!hierarchy[subject][chapter]) {
      hierarchy[subject][chapter] = {};
    }

    if (!hierarchy[subject][chapter][topic]) {
      hierarchy[subject][chapter][topic] = [];
    }

    hierarchy[subject][chapter][topic].push({
      blockId: block.blockIndex,
      type: block.type,
      contentPreview: block.content.substring(0, 100),
    });
  });

  return hierarchy;
}

/**
 * Find related blocks across topics
 */
export function findRelatedBlocks(targetBlock, allBlocks) {
  const { subject, chapter, topic } = targetBlock.topicMapping;
  const related = [];

  allBlocks.forEach((block) => {
    if (block.blockIndex === targetBlock.blockIndex) return; // Skip self

    const { subject: s, chapter: c, topic: t } = block.topicMapping;

    // Same topic → high relevance
    if (s === subject && c === chapter && t === topic) {
      related.push({ ...block, relevance: 0.9 });
    } else if (s === subject && c === chapter) {
      // Same chapter → medium relevance
      related.push({ ...block, relevance: 0.6 });
    } else if (s === subject) {
      // Same subject → low relevance
      related.push({ ...block, relevance: 0.3 });
    }
  });

  return related.sort((a, b) => b.relevance - a.relevance);
}

const topicMappingService = {
  extractKeywords,
  matchTopicsByRules,
  classifyTopicByAI,
  mapContentTopic,
  mapContentBlocksToTopics,
  suggestSubject,
  buildTopicHierarchy,
  findRelatedBlocks,
};

export default topicMappingService;
