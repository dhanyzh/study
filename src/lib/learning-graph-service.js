import crypto from 'crypto';

function sha1Short(value) {
  return crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 12);
}

function makeId(prefix, value) {
  return `${prefix}_${sha1Short(value)}`;
}

function safeTopicMapping(block, subjectFallback) {
  const m = block?.topicMapping || {};
  return {
    subject: m.subject || subjectFallback,
    chapter: m.chapter || 'General',
    topic: m.topic || 'General',
  };
}

/**
 * Convert mapped/enhanced blocks into a canonical Learning Graph JSON.
 * This powers the UI and downstream routing/moderation.
 */
export function buildLearningGraphFromMappedBlocks(mappedBlocks, subjectFallback = 'General') {
  const schemaVersion = '1.0';
  const subject = mappedBlocks?.[0]?.topicMapping?.subject || subjectFallback || 'General';

  const chaptersByKey = new Map(); // key = chapterTitle
  const topicsByKey = new Map(); // key = chapterTitle|topicTitle

  function ensureTopic(chapterTitle, topicTitle) {
    const topicKey = `${chapterTitle}||${topicTitle}`;
    if (topicsByKey.has(topicKey)) return topicsByKey.get(topicKey);

    const chapterKey = chapterTitle;
    if (!chaptersByKey.has(chapterKey)) {
      chaptersByKey.set(chapterKey, {
        id: makeId('chapter', `${subject}||${chapterTitle}`),
        title: chapterTitle,
        topics: [],
      });
    }

    const chapter = chaptersByKey.get(chapterKey);
    const topic = {
      id: makeId('topic', `${subject}||${chapterTitle}||${topicTitle}`),
      title: topicTitle,
      notes: { proposalId: null, items: [] },
      mcqs: { proposalId: null, items: [] },
      descriptive_questions: { proposalId: null, items: [] },
      formulas: { proposalId: null, items: [] },
      code_snippets: { proposalId: null, items: [] },
      tables: { proposalId: null, items: [] },
    };

    chapter.topics.push(topic);
    topicsByKey.set(topicKey, topic);
    return topic;
  }

  for (const block of mappedBlocks || []) {
    const { chapter, topic } = safeTopicMapping(block, subject);
    const leafTopic = ensureTopic(chapter, topic);

    const primary = block?.classification?.primaryCategory;
    const enhancements = block?.enhancements || {};
    const difficulty = block?.difficulty || 'medium';
    const summary = enhancements?.summary || '';

    if (primary === 'notes' || primary === 'definition' || primary === 'example') {
      leafTopic.notes.items.push({
        id: makeId('note', `${block.blockIndex || ''}||${block.pageNumber || ''}||${block.content || ''}`),
        title: (block.content || '').slice(0, 80) || 'Note',
        content: block.content || '',
        summary,
        difficulty,
        source: 'ai-generated',
        pageNumber: block.pageNumber,
      });
      continue;
    }

    if (primary === 'mcq') {
      const mcqs = enhancements?.mcqs || [];
      for (const mcq of mcqs) {
        leafTopic.mcqs.items.push({
          id: makeId('mcq', `${mcq.question}||${chapter}||${topic}`),
          question: mcq.question,
          options: mcq.options,
          correctAnswer: mcq.correctAnswer,
          explanation: mcq.explanation,
          difficulty: mcq.difficulty || difficulty,
          source: 'ai-generated',
          tags: [],
        });
      }
      continue;
    }

    if (primary === 'formula') {
      leafTopic.formulas.items.push({
        id: makeId('formula', `${block.blockIndex || ''}||${block.content || ''}`),
        expression: block.content || '',
        summary,
        difficulty,
        source: 'ai-generated',
        pageNumber: block.pageNumber,
      });
      continue;
    }

    if (primary === 'code') {
      leafTopic.code_snippets.items.push({
        id: makeId('code', `${block.blockIndex || ''}||${block.content || ''}`),
        language: block.language || 'unknown',
        code: block.content || '',
        summary,
        difficulty,
        source: 'ai-generated',
        pageNumber: block.pageNumber,
      });
      continue;
    }

    if (primary === 'table') {
      leafTopic.tables.items.push({
        id: makeId('table', `${block.blockIndex || ''}||${block.pageNumber || ''}`),
        table: block.parsedTable || null,
        summary,
        difficulty,
        source: 'ai-generated',
        pageNumber: block.pageNumber,
      });
      continue;
    }

    if (primary === 'question') {
      // Descriptive questions are generated in the later question-generation stage.
      // For now, we keep an empty placeholder.
      // (This field will be populated after `pdf-question-generation` is wired in.)
      continue;
    }
  }

  return {
    schemaVersion,
    subject,
    chapters: Array.from(chaptersByKey.values()),
  };
}

