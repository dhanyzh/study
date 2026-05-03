/**
 * PDF Processing Workers - Background job processors
 * These run independently and process jobs from the queue
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import PdfUpload from '@/models/PdfUpload';
import PdfLearningGraph from '@/models/PdfLearningGraph';
import PdfExtraction from '@/models/PdfExtraction';
import PdfProposal from '@/models/PdfProposal';
import Subject from '@/models/Subject';
import Chapter from '@/models/Chapter';
import Topic from '@/models/Topic';
import Note from '@/models/Note';
import Quiz from '@/models/Quiz';
import Exam from '@/models/Exam';
import { extractPDF, normalizeText, chunkText } from '@/lib/extraction-service';
import { parseIntoBlocks, buildBlockHierarchy } from '@/lib/parsing-service';
import { classifyBlocks, detectDifficulty } from '@/lib/classification-service';
import { enhanceContentBlocks, createProcessedContent, generateMCQsFromContent, generatePracticeQuestions } from '@/lib/ai-enhancement-service';
import { mapContentBlocksToTopics, suggestSubject } from '@/lib/topic-mapping-service';
import { buildLearningGraphFromMappedBlocks } from '@/lib/learning-graph-service';
import { describeImageWithAI } from '@/lib/ai';
import { cachedJsonFromPrompt } from '@/lib/ai-json-cached';
import {
  pdfQueue,
  parsingQueue,
  classificationQueue,
  aiEnhancementQueue,
  topicMappingQueue,
  chunkClassificationQueue,
  chunkEnhancementQueue,
  questionGenerationQueue,
  diagramIntelligenceQueue,
  routingQueue,
  chainParsingJob,
  chainClassificationJob,
  chainAIEnhancementJob,
  chainTopicMappingJob,
  enqueueDiagramIntelligenceJob,
  enqueueQuestionGenerationJob,
  enqueueRoutingJob,
  initQueues,
} from '@/lib/queue';

// Bull (v4) uses `job.progress(number)` (setter) instead of BullMQ's `job.updateProgress`.
// Keep a small helper so the worker code stays readable.
async function setJobProgress(job, value) {
  if (!job) return;
  const n = Number(value);
  if (!Number.isFinite(n)) return;
  try {
    if (typeof job.progress === 'function') {
      // Bull: calling with a number sets progress
      await job.progress(n);
    }
  } catch {}
}

function appendUploadError(upload, { message, stage }) {
  if (!upload) return;
  upload.errorLog = Array.isArray(upload.errorLog) ? upload.errorLog : [];
  upload.errorLog.push({
    message: String(message || 'Unknown error'),
    stage: String(stage || 'unknown'),
    timestamp: new Date(),
  });
}

// =====================================================
// EXTRACTION WORKER - Extracts text from PDF
// =====================================================
export function setupExtractionWorker() {
  pdfQueue.process(async (job) => {
    const { pdfUploadId, userId, filePath } = job.data;

    console.log(`🔍 [Extraction] Starting job ${job.id}`);

    try {
      await dbConnect();

      // Update status
      let upload = await PdfUpload.findById(pdfUploadId);
      if (upload) {
        upload.status = 'extracting';
        upload.currentStage = 'Extracting text from PDF';
        upload.progress = 10;
        await upload.save();
      }

      // Read file
      const fileBuffer = await fs.readFile(filePath);
      await setJobProgress(job, 20);

      // Extract text
      const extraction = await extractPDF(fileBuffer);
      await setJobProgress(job, 50);

      if (!extraction.success) {
        throw new Error(`Extraction failed: ${extraction.error}`);
      }

      // Normalize text
      const normalizedText = normalizeText(extraction.text);
      await setJobProgress(job, 70);

      // Update upload record
      upload = await PdfUpload.findById(pdfUploadId);
      if (upload) {
        upload.rawExtractedText = normalizedText;
        upload.pageCount = extraction.pageCount;
        upload.extractedTables = extraction.tables || [];
        upload.extractedImages = extraction.images || [];
        if (!upload.pdfExtractionId) {
          const extractionDoc = await PdfExtraction.create({
            pdfUploadId,
            userId,
            schemaVersion: '1.0',
            payload: extraction,
          });
          upload.pdfExtractionId = extractionDoc._id;
        }
        upload.progress = 80;
        await upload.save();
      }

      await setJobProgress(job, 90);

      // Chain to parsing
      const parsingData = {
        pdfUploadId,
        userId,
        filePath,
        extractedText: normalizedText,
        pageCount: extraction.pageCount,
      };

      await chainParsingJob(parsingData);
      await setJobProgress(job, 100);

      console.log(`✓ [Extraction] Job ${job.id} completed`);
      return { success: true, pageCount: extraction.pageCount };
    } catch (error) {
      console.error(`✗ [Extraction] Job ${job.id} failed:`, error);

      // Update error
      try {
        const upload = await PdfUpload.findById(pdfUploadId);
        if (upload) {
          upload.status = 'failed';
          upload.currentStage = 'Extracting text from PDF (failed)';
          appendUploadError(upload, {
            message: `Extraction error: ${error?.message || String(error)}`,
            stage: 'extraction',
          });
          await upload.save();
        }
      } catch (dbError) {
        console.error('Failed to update error status:', dbError);
      }

      throw error;
    }
  });
  return pdfQueue;
}

// =====================================================
// PARSING WORKER - Converts text into blocks
// =====================================================
export function setupParsingWorker() {
  parsingQueue.process(async (job) => {
    const { pdfUploadId, extractedText } = job.data;

    console.log(`📖 [Parsing] Starting job ${job.id}`);

    try {
      await dbConnect();

      let upload = await PdfUpload.findById(pdfUploadId);
      if (upload) {
        upload.status = 'parsing';
        upload.currentStage = 'Parsing content structure';
        upload.progress = 15;
        await upload.save();
      }

      await setJobProgress(job, 20);

      // Parse into blocks
      const blocks = parseIntoBlocks(extractedText, 1);
      console.log(`📍 Detected ${blocks.length} content blocks`);

      await setJobProgress(job, 50);

      // Build hierarchy
      const hierarchy = buildBlockHierarchy(blocks);
      await setJobProgress(job, 70);
      upload = await PdfUpload.findById(pdfUploadId);
      if (upload) {
        upload.textBlocks = (blocks || []).map((b, idx) => {
          // PdfUpload.textBlocks requires: type, rawContent, content, pageNumber, blockIndex
          // Some parsers only provide `content`, so default rawContent to content.
          const safeType = String(b?.type || 'paragraph');
          const safeContent = String(b?.content ?? b?.rawContent ?? '').trim();
          return {
            type: safeType,
            rawContent: String(b?.rawContent ?? safeContent),
            content: safeContent,
            pageNumber: Number.isFinite(Number(b?.pageNumber)) ? Number(b.pageNumber) : 1,
            blockIndex: Number.isFinite(Number(b?.blockIndex)) ? Number(b.blockIndex) : idx,
          };
        });
        upload.progress = 85;
        await upload.save();
      }

      await setJobProgress(job, 90);

      // Chain to classification
      const classificationData = {
        pdfUploadId,
        extractedText,
        blocks,
      };

      await chainClassificationJob(classificationData);
      await setJobProgress(job, 100);

      console.log(`✓ [Parsing] Job ${job.id} completed - ${blocks.length} blocks`);
      return { success: true, blockCount: blocks.length };
    } catch (error) {
      console.error(`✗ [Parsing] Job ${job.id} failed:`, error);

      try {
        const upload = await PdfUpload.findById(pdfUploadId);
        if (upload) {
          upload.status = 'failed';
          upload.currentStage = 'Parsing content structure (failed)';
          appendUploadError(upload, {
            message: `Parsing error: ${error?.message || String(error)}`,
            stage: 'parsing',
          });
          await upload.save();
        }
      } catch (dbError) {
        console.error('Failed to update error:', dbError);
      }

      throw error;
    }
  });
  return parsingQueue;
}

// =====================================================
// CLASSIFICATION WORKER - Categorizes blocks
// =====================================================
export function setupClassificationWorker() {
  classificationQueue.process(async (job) => {
    const { pdfUploadId, blocks } = job.data;

    console.log(`🏷️ [Classification] Starting job ${job.id}`);

    try {
      await dbConnect();

      let upload = await PdfUpload.findById(pdfUploadId);
      const subject = upload?.suggestedSubject || 'General';

      if (upload) {
        upload.status = 'classifying';
        upload.currentStage = 'Classifying content';
        upload.progress = 20;
        await upload.save();
      }

      await setJobProgress(job, 30);

      // Classify blocks
      const classified = await classifyBlocks(blocks, subject, 0.6);
      console.log(`🏷️ Classified ${classified.length} blocks`);

      await setJobProgress(job, 70);

      // Detect difficulty for each
      const withDifficulty = classified.map((block) => ({
        ...block,
        difficulty: detectDifficulty(block.content, block.classification.primaryCategory),
      }));

      await setJobProgress(job, 85);

      // Update upload
      upload = await PdfUpload.findById(pdfUploadId);
      if (upload) {
        upload.progress = 90;
        await upload.save();
      }

      // Chain to AI enhancement
      const aiData = {
        pdfUploadId,
        blocks: withDifficulty,
        subject,
      };

      await chainAIEnhancementJob(aiData);
      await setJobProgress(job, 100);

      console.log(`✓ [Classification] Job ${job.id} completed`);
      return { success: true, classified: classified.length };
    } catch (error) {
      console.error(`✗ [Classification] Job ${job.id} failed:`, error);

      try {
        const upload = await PdfUpload.findById(pdfUploadId);
        if (upload) {
          upload.status = 'failed';
          upload.currentStage = 'Classifying content (failed)';
          appendUploadError(upload, {
            message: `Classification error: ${error?.message || String(error)}`,
            stage: 'classification',
          });
          await upload.save();
        }
      } catch (dbError) {
        console.error('Failed to update error:', dbError);
      }

      throw error;
    }
  });
  return classificationQueue;
}

// =====================================================
// AI ENHANCEMENT WORKER - Generates summaries, MCQs, etc.
// =====================================================
export function setupAIEnhancementWorker() {
  aiEnhancementQueue.process(async (job) => {
    const { pdfUploadId, blocks, subject } = job.data;

    console.log(`✨ [AI Enhancement] Starting job ${job.id}`);

    try {
      await dbConnect();

      let upload = await PdfUpload.findById(pdfUploadId);
      if (upload) {
        upload.status = 'enhancing';
        upload.currentStage = 'Generating AI enhancements';
        upload.progress = 25;
        await upload.save();
      }

      await setJobProgress(job, 30);

      // Enhance blocks in bounded batches (protects against long-running jobs / provider overload).
      const batchSize = 25;
      const enhanced = [];
      for (let i = 0; i < blocks.length; i += batchSize) {
        const batch = blocks.slice(i, i + batchSize);
        const enhancedBatch = await enhanceContentBlocks(batch, subject);
        enhanced.push(...enhancedBatch);

        const ratio = (i + batch.length) / Math.max(1, blocks.length);
        await setJobProgress(job, 30 + Math.round(ratio * 50));
      }
      console.log(`✨ Enhanced ${enhanced.length} blocks`);

      await setJobProgress(job, 80);

      // Update upload
      upload = await PdfUpload.findById(pdfUploadId);
      if (upload) {
        upload.progress = 90;
        await upload.save();
      }

      // Chain to topic mapping
      const topicData = {
        pdfUploadId,
        blocks: enhanced,
        subject,
      };

      await chainTopicMappingJob(topicData);
      await setJobProgress(job, 100);

      console.log(`✓ [AI Enhancement] Job ${job.id} completed`);
      return { success: true, enhanced: enhanced.length };
    } catch (error) {
      console.error(`✗ [AI Enhancement] Job ${job.id} failed:`, error);

      try {
        const upload = await PdfUpload.findById(pdfUploadId);
        if (upload) {
          upload.status = 'failed';
          upload.currentStage = 'Generating AI enhancements (failed)';
          appendUploadError(upload, {
            message: `AI Enhancement error: ${error?.message || String(error)}`,
            stage: 'ai-enhancement',
          });
          await upload.save();
        }
      } catch (dbError) {
        console.error('Failed to update error:', dbError);
      }

      // Don't throw - continue to topic mapping anyway
      const topicData = {
        pdfUploadId,
        blocks,
        subject,
      };

      await chainTopicMappingJob(topicData);
    }
  });
  return aiEnhancementQueue;
}

// =====================================================
// TOPIC MAPPING WORKER - Maps content to hierarchy
// =====================================================
export function setupTopicMappingWorker() {
  topicMappingQueue.process(async (job) => {
    const { pdfUploadId, blocks, subject } = job.data;

    console.log(`🗺️ [Topic Mapping] Starting job ${job.id}`);

    try {
      await dbConnect();

      let upload = await PdfUpload.findById(pdfUploadId);
      if (upload) {
        upload.status = 'mapping';
        upload.currentStage = 'Mapping to topics';
        upload.progress = 30;
        await upload.save();
      }

      await setJobProgress(job, 40);

      // Map blocks to topics
      const mapped = await mapContentBlocksToTopics(blocks, subject);
      console.log(`🗺️ Mapped ${mapped.length} blocks to topics`);

      await setJobProgress(job, 75);

      // Update upload with final processed content
      upload = await PdfUpload.findById(pdfUploadId);
      if (upload) {
        // Build and persist the canonical Learning Graph JSON for the UI.
        const learningGraph = buildLearningGraphFromMappedBlocks(mapped, subject);
        const learningGraphDoc = await PdfLearningGraph.create({
          pdfUploadId,
          userId: upload.userId,
          status: 'approved',
          schemaVersion: '1.0',
          graph: learningGraph,
        });
        upload.learningGraphId = learningGraphDoc._id;

        // Question generation stage: generate 50-100 MCQs per chapter (distributed across its topics),
        // plus descriptive questions and best-effort formulas/code/tables.
        upload.status = 'question-generation';
        upload.currentStage = 'Generating questions';
        upload.progress = 60;
        await upload.save();

        const graphChapters = learningGraph?.chapters || [];
        const chapterMcqTarget = 80;
        const maxTopicsPerUpload = Number(process.env.PDF_QGEN_MAX_TOPICS_PER_UPLOAD || 50);
        const allTopics = graphChapters.flatMap((ch) => (ch.topics || []).map((t) => ({ chapter: ch, topic: t })));
        const limitedTopics = allTopics.slice(0, maxTopicsPerUpload);

        try {
          let done = 0;
          const total = Math.max(1, limitedTopics.length);

          for (const { chapter, topic } of limitedTopics) {
            const topicCount = Math.max(1, (chapter.topics || []).length);
            const targetPerTopic = Math.ceil(chapterMcqTarget / topicCount);

            const qJob = await enqueueQuestionGenerationJob({
              pdfUploadId,
              userId: upload.userId,
              subject,
              chapterId: topic.id, // legacy field name: used as topicId in v2 worker
              chapterContent: '', // let the worker build content from the current Learning Graph
              targetCount: targetPerTopic,
            });

            // Wait for completion so the Learning Graph is ready before we proceed.
            await qJob.finished();

            done += 1;
            upload.progress = 60 + Math.round((done / total) * 25);
            upload.currentStage = `Generating questions (${done}/${total})`;
            await upload.save();
          }
        } finally {}

        upload.aiProcessedContent = {
          notes: mapped
            .filter((b) => b.classification?.primaryCategory === 'notes')
            .map((b) => ({
              title: b.content.substring(0, 100),
              content: b.content,
              summary: b.enhancements?.summary || '',
              topicTitle: b.topicMapping?.topic || 'General',
            })),
          mcqs: mapped
            .filter((b) => b.classification?.primaryCategory === 'mcq')
            .map((b) => b.enhancements?.mcqs || [])
            .flat(),
          flashcards: mapped
            .filter((b) => b.enhancements?.flashcards)
            .map((b) => b.enhancements.flashcards)
            .flat(),
        };

        // Create processed content documents
        const processedContent = await createProcessedContent(
          mapped,
          pdfUploadId,
          upload.userId,
          { subject, chapter: upload.suggestedChapter }
        );

        upload.processedNotes = processedContent.processedNotes.map(note => note._id);
        upload.processedMCQs = processedContent.processedMCQs.map(mcq => mcq._id);
        upload.processedFlashcards = processedContent.processedFlashcards.map(card => card._id);

        // Enqueue diagram intelligence jobs for extracted figures/images.
        // Diagram descriptions are persisted as `PdfProposal` records (pending moderation).
        const extractedImages = upload.extractedImages || [];
        const imagesWithBytes = extractedImages.filter((img) => img?.imageBase64);
        if (imagesWithBytes.length > 0) {
          upload.status = 'diagram-intelligence';
          upload.currentStage = 'Describing diagrams';
          upload.progress = 95;
          await upload.save();

          const jobs = imagesWithBytes
            .slice(0, 10)
            .map((img) =>
              enqueueDiagramIntelligenceJob({
                pdfUploadId,
                userId: upload.userId,
                subject,
                figureId: img.figureId,
                imageBase64: img.imageBase64,
                mimeType: img.mimeType || 'image/png',
              })
            );

          // Fire-and-forget (jobs run in the background workers).
          await Promise.allSettled(jobs);
        }

        // Routing stage: convert Learning Graph nodes into module-ready records.
        // Wait for completion so the UI/modules have data when upload becomes `completed`.
        const routingJob = await enqueueRoutingJob({
          pdfUploadId,
          userId: upload.userId,
          subject,
        });
        try {
          await routingJob.finished();
        } finally {}

        upload.status = 'completed';
        upload.currentStage = 'Processing complete';
        upload.progress = 100;
        upload.completedAt = new Date();
        await upload.save();
      }

      await setJobProgress(job, 95);

      console.log(`✓ [Topic Mapping] Job ${job.id} completed`);
      console.log(`✓ PDF Processing COMPLETE for ${pdfUploadId}`);

      return {
        success: true,
        mapped: mapped.length,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`✗ [Topic Mapping] Job ${job.id} failed:`, error);

      try {
        const upload = await PdfUpload.findById(pdfUploadId);
        if (upload) {
          upload.status = 'failed';
          upload.currentStage = 'Mapping to topics (failed)';
          appendUploadError(upload, {
            message: `Topic Mapping error: ${error?.message || String(error)}`,
            stage: 'topic-mapping',
          });
          await upload.save();
        }
      } catch (dbError) {
        console.error('Failed to update error:', dbError);
      }

      throw error;
    }
  });
  return topicMappingQueue;
}

// =====================================================
// CHUNK CLASSIFICATION WORKER - parallelizable units
// =====================================================
export function setupChunkClassificationWorker() {
  chunkClassificationQueue.process(async (job) => {
    const { pdfUploadId, userId, subject, chunkIndex, chunkText } = job.data;
    try {
      await dbConnect();

      // Convert chunk text into smaller blocks for hybrid classification.
      const blocks = parseIntoBlocks(chunkText || '', 1);
      const classified = await classifyBlocks(blocks, subject || 'General', 0.6);

      return { pdfUploadId, userId, subject, chunkIndex, classifiedBlocks: classified };
    } catch (error) {
      console.error(`✗ [ChunkClassification] Job ${job.id} failed:`, error);
      throw error;
    }
  });
  return chunkClassificationQueue;
}

// =====================================================
// CHUNK ENHANCEMENT WORKER - summaries/questions/flashcards
// =====================================================
export function setupChunkEnhancementWorker() {
  chunkEnhancementQueue.process(async (job) => {
    const { pdfUploadId, userId, subject, chunkIndex, classifiedBlocks } = job.data;
    try {
      await dbConnect();

      const enhanced = await enhanceContentBlocks(classifiedBlocks || [], subject || 'General');
      return { pdfUploadId, userId, subject, chunkIndex, enhancedBlocks: enhanced };
    } catch (error) {
      console.error(`✗ [ChunkEnhancement] Job ${job.id} failed:`, error);
      throw error;
    }
  });
  return chunkEnhancementQueue;
}

// =====================================================
// QUESTION GENERATION WORKER - per chapter/topic
// =====================================================
export function setupQuestionGenerationWorker() {
  questionGenerationQueue.process(async (job) => {
    const {
      pdfUploadId,
      userId,
      subject,
      chapterId, // legacy name: used as topicId in v2
      chapterContent, // legacy name: used as topicContent in v2
      targetCount = 80,
    } = job.data;
    try {
      await dbConnect();

      const learningGraphDoc = await PdfLearningGraph.findOne({
        pdfUploadId,
        userId,
      }).sort({ createdAt: -1 });

      if (!learningGraphDoc) {
        throw new Error(`LearningGraph not found for uploadId=${pdfUploadId}`);
      }

      const graph = learningGraphDoc.graph || {};
      const chapters = Array.isArray(graph.chapters) ? graph.chapters : [];

      const targetTopicId = chapterId;
      const targetTopic = chapters
        .flatMap((ch) => ch.topics || [])
        .find((t) => t && t.id === targetTopicId);

      if (!targetTopic) {
        throw new Error(`Topic not found in learningGraph: ${targetTopicId}`);
      }

      // If topic content isn't provided, build it from current learningGraph nodes.
      const buildTopicContentFromGraph = () => {
        const contentParts = [];
        const notes = targetTopic?.notes?.items || [];
        const mcqs = targetTopic?.mcqs?.items || [];

        for (const n of notes) {
          if (n?.content) contentParts.push(String(n.content));
        }
        for (const m of mcqs) {
          if (m?.question) contentParts.push(`Q: ${m.question}`);
          if (m?.explanation) contentParts.push(`Explanation: ${m.explanation}`);
        }
        return contentParts.join('\n\n');
      };

      const topicContent = chapterContent || buildTopicContentFromGraph();
      const safeSubject = subject || graph.subject || 'General';

      const targetMcqCount = Math.max(10, Math.min(100, targetCount));
      const targetDescriptiveCount = Math.max(3, Math.min(20, Math.round(targetMcqCount / 8)));

      // 1) Generate MCQs
      const mcqs = await generateMCQsFromContent(topicContent || '', safeSubject, targetMcqCount);

      const sha1Short = (value) => crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 12);

      const mcqItems = mcqs.map((mcq) => ({
        id: `mcq_${sha1Short(mcq.question)}`,
        question: mcq.question,
        options: mcq.options,
        correctAnswer: mcq.correctAnswer,
        explanation: mcq.explanation,
        difficulty: mcq.difficulty || 'medium',
        source: 'ai-generated',
      }));

      // 2) Generate descriptive questions (not MCQ)
      const descriptive = await generatePracticeQuestions(topicContent || '', safeSubject, targetDescriptiveCount);
      const descriptiveItems = (descriptive || []).map((q) => ({
        id: `desc_${sha1Short(q.question)}`,
        question: q.question,
        sampleAnswer: q.sampleAnswer || '',
        hints: q.hints || [],
        difficulty: q.difficulty || 'medium',
        source: 'ai-generated',
      }));

      // 3) Best-effort formula/code/table extraction as structured JSON
      // If these are empty, routing can simply skip those module types.
      const formulas = await (async () => {
        try {
          const extracted = await cachedJsonFromPrompt({
            prompt: `Extract any mathematical formulas (expressions) from the following educational content.
Return ONLY a JSON array (no markdown). Each array element must have:
{ "expression": string, "summary": string, "difficulty": "easy"|"medium"|"hard" }.
Content:
${topicContent.substring(0, 2500)}`,
            cacheNamespace: 'pdf-extract-formulas',
            extraKey: `${targetTopicId}:${targetMcqCount}`,
            schemaHint:
              'Return a JSON array of {expression:string, summary:string, difficulty: easy|medium|hard}. Can be empty array.',
            validator: (v) =>
              Array.isArray(v) &&
              v.every(
                (x) =>
                  x &&
                  typeof x.expression === 'string' &&
                  typeof x.summary === 'string' &&
                  ['easy', 'medium', 'hard'].includes(x.difficulty),
              ),
            ttlSeconds: 60 * 60 * 24 * 7,
          });
          return extracted;
        } catch {
          return [];
        }
      })();

      const codeSnippets = await (async () => {
        try {
          const extracted = await cachedJsonFromPrompt({
            prompt: `Extract code snippets and related details from the following educational content.
Return ONLY a JSON array (no markdown). Each element must have:
{ "language": string, "code": string, "explanation": string, "difficulty": "easy"|"medium"|"hard" }.
Content:
${topicContent.substring(0, 2500)}`,
            cacheNamespace: 'pdf-extract-code-snippets',
            extraKey: `${targetTopicId}:${targetMcqCount}`,
            schemaHint:
              'Return a JSON array of {language:string, code:string, explanation:string, difficulty: easy|medium|hard}. Can be empty array.',
            validator: (v) =>
              Array.isArray(v) &&
              v.every(
                (x) =>
                  x &&
                  typeof x.language === 'string' &&
                  typeof x.code === 'string' &&
                  typeof x.explanation === 'string' &&
                  ['easy', 'medium', 'hard'].includes(x.difficulty),
              ),
            ttlSeconds: 60 * 60 * 24 * 7,
          });
          return extracted;
        } catch {
          return [];
        }
      })();

      const tables = await (async () => {
        try {
          const extracted = await cachedJsonFromPrompt({
            prompt: `Extract tabular data from the following educational content.
Return ONLY a JSON array (no markdown). Each element must have:
{ "rows": [[string]], "cols": number, "summary": string }.
Content:
${topicContent.substring(0, 2500)}`,
            cacheNamespace: 'pdf-extract-tables',
            extraKey: `${targetTopicId}:${targetMcqCount}`,
            schemaHint:
              'Return a JSON array of {rows: string[][], cols: number, summary: string}. Can be empty array.',
            validator: (v) =>
              Array.isArray(v) &&
              v.every(
                (x) =>
                  x &&
                  Array.isArray(x.rows) &&
                  typeof x.cols === 'number' &&
                  typeof x.summary === 'string',
              ),
            ttlSeconds: 60 * 60 * 24 * 7,
          });
          return extracted;
        } catch {
          return [];
        }
      })();

      // 4) Update learning graph
      targetTopic.mcqs = targetTopic.mcqs || { proposalId: null, items: [] };
      targetTopic.descriptive_questions =
        targetTopic.descriptive_questions || { proposalId: null, items: [] };
      targetTopic.formulas = targetTopic.formulas || { proposalId: null, items: [] };
      targetTopic.code_snippets = targetTopic.code_snippets || { proposalId: null, items: [] };
      targetTopic.tables = targetTopic.tables || { proposalId: null, items: [] };

      // Replace existing generated items so we keep stable per-topic counts.
      targetTopic.mcqs.items = mcqItems;
      targetTopic.descriptive_questions.items = descriptiveItems;
      targetTopic.formulas.items = [];
      targetTopic.code_snippets.items = [];
      targetTopic.tables.items = [];

      for (const f of formulas || []) {
        targetTopic.formulas.items.push({
          id: `formula_${sha1Short(f.expression)}`,
          expression: f.expression,
          summary: f.summary,
          difficulty: f.difficulty,
          source: 'ai-generated',
        });
      }

      for (const c of codeSnippets || []) {
        targetTopic.code_snippets.items.push({
          id: `code_${sha1Short(c.code)}`,
          language: c.language,
          code: c.code,
          summary: c.explanation,
          difficulty: c.difficulty,
          source: 'ai-generated',
        });
      }

      for (const t of tables || []) {
        targetTopic.tables.items.push({
          id: `table_${sha1Short(JSON.stringify(t.rows).slice(0, 800))}`,
          table: { rows: t.rows, cols: t.cols },
          summary: t.summary,
          difficulty: 'medium',
          source: 'ai-generated',
        });
      }

      learningGraphDoc.graph = graph;
      await learningGraphDoc.save();

      // 5) Persist proposals (auto-approved for now)
      const proposals = await PdfProposal.insertMany([
        {
          pdfUploadId,
          userId,
          schemaVersion: '1.0',
          scope: 'topic',
          targetId: targetTopicId,
          contentType: 'mcq',
          status: 'approved',
          modelMeta: { provider: 'gemini', stage: 'question-generation' },
          payload: { items: mcqItems },
        },
        {
          pdfUploadId,
          userId,
          schemaVersion: '1.0',
          scope: 'topic',
          targetId: targetTopicId,
          contentType: 'descriptive_question',
          status: 'approved',
          modelMeta: { provider: 'gemini', stage: 'question-generation' },
          payload: { items: descriptiveItems },
        },
        {
          pdfUploadId,
          userId,
          schemaVersion: '1.0',
          scope: 'topic',
          targetId: targetTopicId,
          contentType: 'formula',
          status: 'approved',
          modelMeta: { provider: 'gemini', stage: 'question-generation' },
          payload: { items: targetTopic.formulas.items },
        },
        {
          pdfUploadId,
          userId,
          schemaVersion: '1.0',
          scope: 'topic',
          targetId: targetTopicId,
          contentType: 'code',
          status: 'approved',
          modelMeta: { provider: 'gemini', stage: 'question-generation' },
          payload: { items: targetTopic.code_snippets.items },
        },
        {
          pdfUploadId,
          userId,
          schemaVersion: '1.0',
          scope: 'topic',
          targetId: targetTopicId,
          contentType: 'table',
          status: 'approved',
          modelMeta: { provider: 'gemini', stage: 'question-generation' },
          payload: { items: targetTopic.tables.items },
        },
      ]);

      return {
        pdfUploadId,
        userId,
        subject: safeSubject,
        topicId: targetTopicId,
        mcqCount: mcqItems.length,
        descriptiveCount: descriptiveItems.length,
        proposals: proposals.map((p) => p._id),
      };
    } catch (error) {
      console.error(`✗ [QuestionGeneration] Job ${job.id} failed:`, error);
      throw error;
    }
  });
  return questionGenerationQueue;
}

// =====================================================
// DIAGRAM INTELLIGENCE WORKER - figures/images -> descriptions
// =====================================================
export function setupDiagramIntelligenceWorker() {
  diagramIntelligenceQueue.process(async (job) => {
    const {
      pdfUploadId,
      userId,
      subject,
      figureId,
      imageBase64,
      mimeType = 'image/png',
    } = job.data;
    try {
      await dbConnect();

      if (!imageBase64) {
        return { pdfUploadId, userId, subject, figureId, ok: false, error: 'Missing imageBase64' };
      }

      const prompt = `You are a study assistant. Describe the following diagram/figure for a student.
Return ONLY valid JSON with this exact structure:
{
  "schemaVersion":"1.0",
  "figureId":"${figureId}",
  "summary":"<short summary>",
  "stepByStepExplanation":"<step-by-step explanation or interpretation>",
  "conceptLinks":[{"topic":"<string>","confidence":0-1}],
  "extractedTextHint":"<if any, otherwise empty string>"
}
Do not include markdown.`;

      const raw = await describeImageWithAI({
        imageBase64,
        mimeType,
        prompt,
        context: { subject },
      });

      const cleaned = String(raw || '')
        .replace(/```json\n?/g, '')
        .replace(/```/g, '')
        .trim();

      let parsed = null;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const objMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objMatch) {
          parsed = JSON.parse(objMatch[0]);
        }
      }

      if (!parsed) {
        return { pdfUploadId, userId, subject, figureId, ok: false, error: 'Could not parse diagram JSON' };
      }

      const proposal = await PdfProposal.create({
        pdfUploadId,
        userId,
        schemaVersion: '1.0',
        scope: 'diagram',
        targetId: figureId,
        contentType: 'notes',
        status: 'pending',
        modelMeta: {
          provider: 'gemini',
          model: 'gemini-2.0-flash',
        },
        payload: parsed,
      });

      return { pdfUploadId, userId, subject, figureId, ok: true, proposalId: proposal._id };
    } catch (error) {
      console.error(`✗ [DiagramIntelligence] Job ${job.id} failed:`, error);
      throw error;
    }
  });
  return diagramIntelligenceQueue;
}

// =====================================================
// ROUTING WORKER - map structured outputs into modules
// =====================================================
export function setupRoutingWorker() {
  routingQueue.process(async (job) => {
    const { pdfUploadId, userId, subject } = job.data;
    try {
      await dbConnect();

      const learningGraphDoc = await PdfLearningGraph.findOne({ pdfUploadId, userId }).sort({ createdAt: -1 });
      if (!learningGraphDoc?.graph) {
        throw new Error(`LearningGraph missing for routing: pdfUploadId=${pdfUploadId}`);
      }

      const graph = learningGraphDoc.graph;
      const subjectName = graph?.subject || subject || 'General';

      const slugify = (s) =>
        String(s || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      // Create/find subject, chapter, topic records.
      const subjectSlug = slugify(subjectName);
      const subjectDoc = await Subject.findOneAndUpdate(
        { slug: subjectSlug },
        { $setOnInsert: { name: subjectName, slug: subjectSlug } },
        { upsert: true, new: true }
      );

      let chapterOrder = 0;
      for (const chapter of graph.chapters || []) {
        chapterOrder += 1;
        const chapterSlug = slugify(chapter.title);
        const chapterDoc = await Chapter.findOneAndUpdate(
          { subjectId: subjectDoc._id, slug: chapterSlug },
          { $setOnInsert: { title: chapter.title, slug: chapterSlug, order: chapterOrder } },
          { upsert: true, new: true }
        );

        for (const topic of chapter.topics || []) {
          const topicSlug = slugify(topic.title);
          const topicDoc = await Topic.findOneAndUpdate(
            { chapterId: chapterDoc._id, subjectId: subjectDoc._id, slug: topicSlug },
            { $setOnInsert: { title: topic.title, slug: topicSlug, order: 0 } },
            { upsert: true, new: true }
          );

          const proposalBase = { pdfUploadId, userId, scope: 'topic', targetId: topic.id };
          const mcqProposal = await PdfProposal.findOne({ ...proposalBase, contentType: 'mcq', status: 'approved' }).sort({ createdAt: -1 });
          const descProposal = await PdfProposal.findOne({ ...proposalBase, contentType: 'descriptive_question', status: 'approved' }).sort({ createdAt: -1 });
          const formulaProposal = await PdfProposal.findOne({ ...proposalBase, contentType: 'formula', status: 'approved' }).sort({ createdAt: -1 });
          const codeProposal = await PdfProposal.findOne({ ...proposalBase, contentType: 'code', status: 'approved' }).sort({ createdAt: -1 });
          const tableProposal = await PdfProposal.findOne({ ...proposalBase, contentType: 'table', status: 'approved' }).sort({ createdAt: -1 });

          // Notes (directly from learning graph node content)
          for (const n of topic.notes?.items || []) {
            if (!n?.content) continue;
            await Note.findOneAndUpdate(
              { topicId: topicDoc._id, userId: null, source: 'ai', proposalId: null, content: n.content },
              {},
              { upsert: true, new: true }
            );
          }

          // MCQs -> Quiz records
          for (const mcq of mcqProposal?.payload?.items || []) {
            if (!mcq?.question || !Array.isArray(mcq?.options)) continue;

            const existing = await Quiz.findOne({ topicId: topicDoc._id, question: mcq.question, proposalId: mcqProposal?._id || null });
            if (existing) continue;

            await Quiz.create({
              topicId: topicDoc._id,
              subjectId: subjectDoc._id,
              proposalId: mcqProposal?._id,
              question: mcq.question,
              options: mcq.options,
              correctAnswer: mcq.correctAnswer ?? 0,
              explanation: mcq.explanation || '',
              difficulty: mcq.difficulty || 'medium',
              source: 'ai',
            });
          }

          // Descriptive questions -> Exam records
          const descItems = descProposal?.payload?.items || [];
          if (descItems.length > 0) {
            const quizDocs = await Quiz.find({ topicId: topicDoc._id, proposalId: mcqProposal?._id || null }).limit(15);

            const examTitle = `Exam: ${topic.title}`;
            const existingExam = await Exam.findOne({ subjectId: subjectDoc._id, title: examTitle });
            if (!existingExam) {
              await Exam.create({
                subjectId: subjectDoc._id,
                title: examTitle,
                proposalIds: descProposal?._id ? [descProposal._id] : [],
                mcqs: quizDocs.map((q) => q._id),
                descriptiveQuestions: descItems.map((d) => ({
                  question: d.question,
                  marks: 5,
                  sampleAnswer: d.sampleAnswer || '',
                })),
                totalMarks: Math.max(30, descItems.length * 5 * 3), // heuristic
              });
            }
          }

          // Formulas/code/tables -> system notes for now
          for (const f of formulaProposal?.payload?.items || []) {
            if (!f?.expression) continue;
            const content = `Formula: ${f.expression}\n\nSummary: ${f.summary || ''}`;
            const exists = await Note.findOne({ topicId: topicDoc._id, userId: null, source: 'ai', proposalId: formulaProposal?._id || null, content });
            if (!exists) {
              await Note.create({ topicId: topicDoc._id, userId: null, source: 'ai', proposalId: formulaProposal?._id, content });
            }
          }

          for (const c of codeProposal?.payload?.items || []) {
            if (!c?.code) continue;
            const content = `Code (${c.language || 'unknown'}):\n\n\`\`\`\n${c.code}\n\`\`\`\n\nExplanation: ${c.summary || ''}`;
            const exists = await Note.findOne({ topicId: topicDoc._id, userId: null, source: 'ai', proposalId: codeProposal?._id || null, content });
            if (!exists) {
              await Note.create({ topicId: topicDoc._id, userId: null, source: 'ai', proposalId: codeProposal?._id, content });
            }
          }

          for (const t of tableProposal?.payload?.items || []) {
            if (!t?.table?.rows?.length) continue;
            const rows = t.table.rows;
            const header = Array.isArray(rows[0]) ? rows[0] : [];
            const bodyRows = rows.slice(1);
            const md = [
              `Table:`,
              '',
              header.length ? `| ${header.join(' | ')} |` : '| |',
              header.length ? `| ${header.map(() => '---').join(' | ')} |` : '| --- |',
              ...bodyRows.map((r) => `| ${Array.isArray(r) ? r.join(' | ') : r} |`),
              '',
              t.summary ? `Summary: ${t.summary}` : '',
            ].join('\n');

            const exists = await Note.findOne({ topicId: topicDoc._id, userId: null, source: 'ai', proposalId: tableProposal?._id || null, content: md });
            if (!exists) {
              await Note.create({ topicId: topicDoc._id, userId: null, source: 'ai', proposalId: tableProposal?._id, content: md });
            }
          }
        }
      }

      return { pdfUploadId, userId, subject, ok: true };
    } catch (error) {
      console.error(`✗ [Routing] Job ${job.id} failed:`, error);
      throw error;
    }
  });
  return routingQueue;
}

// =====================================================
// Initialize all workers
// =====================================================
let workersInitialized = false;

export async function initializeAllWorkers() {
  if (workersInitialized) return;

  console.log('🚀 Initializing all PDF processing workers...');

  await setupExtractionWorker();
  console.log('✓ Extraction worker ready');

  await setupParsingWorker();
  console.log('✓ Parsing worker ready');

  await setupClassificationWorker();
  console.log('✓ Classification worker ready');

  await setupAIEnhancementWorker();
  console.log('✓ AI Enhancement worker ready');

  await setupTopicMappingWorker();
  console.log('✓ Topic Mapping worker ready');

  // v2 stages (not yet wired into the legacy chain)
  await setupChunkClassificationWorker();
  console.log('✓ Chunk Classification worker ready');
  await setupChunkEnhancementWorker();
  console.log('✓ Chunk Enhancement worker ready');
  await setupQuestionGenerationWorker();
  console.log('✓ Question Generation worker ready');
  await setupDiagramIntelligenceWorker();
  console.log('✓ Diagram Intelligence worker ready');
  await setupRoutingWorker();
  console.log('✓ Routing worker ready');

  workersInitialized = true;
  globalThis.__pdfWorkersStarted = true;
  console.log('✅ All workers initialized');
}

export async function ensurePDFWorkers() {
  if (workersInitialized || globalThis.__pdfWorkersStarted) {
    return;
  }
  await initQueues();
  await initializeAllWorkers();
}

const pdfWorkers = {
  setupExtractionWorker,
  setupParsingWorker,
  setupClassificationWorker,
  setupAIEnhancementWorker,
  setupTopicMappingWorker,
  setupChunkClassificationWorker,
  setupChunkEnhancementWorker,
  setupQuestionGenerationWorker,
  setupDiagramIntelligenceWorker,
  setupRoutingWorker,
  initializeAllWorkers,
  ensurePDFWorkers,
};

export default pdfWorkers;
