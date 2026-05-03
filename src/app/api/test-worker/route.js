import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import dbConnect from '@/lib/db';
import PdfUpload from '@/models/PdfUpload';
import { extractPDF, normalizeText } from '@/lib/extraction-service';
import { parseIntoBlocks, buildBlockHierarchy } from '@/lib/parsing-service';
import { classifyBlocks, detectDifficulty } from '@/lib/classification-service';
import { enhanceContentBlocks, createProcessedContent } from '@/lib/ai-enhancement-service';
import { mapContentBlocksToTopics } from '@/lib/topic-mapping-service';

export async function POST(request) {
  try {
    await dbConnect();
    
    const dummyUserId = '65f0a0c9e0a0a00000000001';
    const filePath = path.join(process.cwd(), 'test-upload.pdf');
    
    // 1. Create upload record
    const upload = await PdfUpload.create({
      userId: dummyUserId,
      filename: 'test-upload.pdf',
      originalName: 'dummy.pdf',
      fileSize: 13264,
      status: 'extracting',
      currentStage: 'Extracting text from PDF',
      progress: 10,
    });
    console.log('[Test API] Created upload record:', upload._id);

    // 2. Extraction
    const fileBuffer = await fs.readFile(filePath);
    const extraction = await extractPDF(fileBuffer);
    if (!extraction.success) throw new Error(`Extraction failed: ${extraction.error}`);
    const normalizedText = normalizeText(extraction.text);
    
    upload.rawExtractedText = normalizedText;
    upload.pageCount = extraction.pageCount;
    upload.progress = 30;
    upload.status = 'parsing';
    upload.currentStage = 'Parsing content structure';
    await upload.save();
    console.log('[Test API] Extraction complete. Page count:', extraction.pageCount);

    // 3. Parsing
    const blocks = parseIntoBlocks(normalizedText, 1);
    const hierarchy = buildBlockHierarchy(blocks);
    
    upload.textBlocks = blocks.map((b) => ({
      type: b.type,
      rawContent: b.rawContent || b.content || '',
      content: b.content || '',
      pageNumber: b.pageNumber || 1,
      blockIndex: b.blockIndex || 0,
    }));
    upload.progress = 50;
    upload.status = 'classifying';
    upload.currentStage = 'Classifying content';
    await upload.save();
    console.log('[Test API] Parsing complete. Blocks found:', blocks.length);

    // 4. Classification
    const subject = 'General';
    const classified = await classifyBlocks(blocks, subject, 0.6);
    const withDifficulty = classified.map((block) => ({
      ...block,
      difficulty: detectDifficulty(block.content, block.classification.primaryCategory),
    }));
    
    upload.progress = 70;
    upload.status = 'enhancing';
    upload.currentStage = 'Generating AI enhancements';
    await upload.save();
    console.log('[Test API] Classification complete.');

    // 5. AI Enhancement
    // We limit to 5 blocks to avoid long Gemini API times during testing
    const enhanced = await enhanceContentBlocks(withDifficulty.slice(0, 5), subject);
    
    upload.progress = 90;
    upload.status = 'mapping';
    upload.currentStage = 'Mapping to topics';
    await upload.save();
    console.log('[Test API] AI Enhancement complete. Enhanced blocks:', enhanced.length);

    // 6. Topic Mapping
    const mapped = await mapContentBlocksToTopics(enhanced, subject);
    
    upload.aiProcessedContent = {
      notes: mapped.filter((b) => b.classification?.primaryCategory === 'notes').map((b) => ({
        title: b.content.substring(0, 100),
        content: b.content,
        summary: b.enhancements?.summary || '',
        topicTitle: b.topicMapping?.topic || 'General',
      })),
      mcqs: mapped.filter((b) => b.classification?.primaryCategory === 'mcq').map((b) => b.enhancements?.mcqs || []).flat(),
      flashcards: mapped.filter((b) => b.enhancements?.flashcards).map((b) => b.enhancements.flashcards).flat(),
    };

    const processedContent = await createProcessedContent(mapped, upload._id, upload.userId, { subject });
    
    upload.processedNotes = processedContent.processedNotes.map(note => note._id);
    upload.processedMCQs = processedContent.processedMCQs.map(mcq => mcq._id);
    upload.processedFlashcards = processedContent.processedFlashcards.map(card => card._id);

    upload.status = 'completed';
    upload.currentStage = 'Processing complete';
    upload.progress = 100;
    upload.completedAt = new Date();
    await upload.save();
    console.log('[Test API] Pipeline complete!');

    return NextResponse.json({
      success: true,
      message: 'Pipeline executed successfully',
      stats: {
        pageCount: extraction.pageCount,
        blockCount: blocks.length,
        enhancedCount: enhanced.length,
        notesCount: processedContent.processedNotes.length,
        mcqsCount: processedContent.processedMCQs.length,
        flashcardsCount: processedContent.processedFlashcards.length
      }
    });
  } catch (error) {
    console.error('[Test API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

