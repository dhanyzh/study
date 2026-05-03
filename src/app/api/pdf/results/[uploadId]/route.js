import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import dbConnect from '@/lib/db';
import PdfUpload from '@/models/PdfUpload';
import ProcessedNote from '@/models/ProcessedNote';
import ProcessedMCQ from '@/models/ProcessedMCQ';
import Flashcard from '@/models/Flashcard';
import PdfLearningGraph from '@/models/PdfLearningGraph';

export async function GET(
  request,
  { params }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { uploadId } = params;

    // Find the PDF upload
    const pdfUpload = await PdfUpload.findOne({
      _id: uploadId,
      userId: user._id,
    }).populate('processedNotes processedMCQs processedFlashcards');

    if (!pdfUpload) {
      return NextResponse.json({ error: 'PDF upload not found' }, { status: 404 });
    }

    const learningGraphDoc = await PdfLearningGraph.findOne({
      pdfUploadId: uploadId,
      userId: user._id,
    }).sort({ createdAt: -1 });

    // Get detailed processed content
    const processedNotes = await ProcessedNote.find({
      pdfUploadId: uploadId,
      userId: user._id,
      approved: true,
    }).sort({ createdAt: -1 });

    const processedMCQs = await ProcessedMCQ.find({
      pdfUploadId: uploadId,
      userId: user._id,
      approved: true,
    }).sort({ createdAt: -1 });

    const processedFlashcards = await Flashcard.find({
      pdfUploadId: uploadId,
      userId: user._id,
      approved: true,
    }).sort({ createdAt: -1 });

    // Return comprehensive results
    const results = {
      upload: {
        id: pdfUpload._id,
        filename: pdfUpload.filename,
        originalName: pdfUpload.originalName,
        status: pdfUpload.status,
        progress: pdfUpload.progress,
        currentStage: pdfUpload.currentStage,
        pageCount: pdfUpload.pageCount,
        suggestedSubject: pdfUpload.suggestedSubject,
        suggestedChapter: pdfUpload.suggestedChapter,
        uploadedAt: pdfUpload.uploadedAt,
        completedAt: pdfUpload.completedAt,
        stats: pdfUpload.stats,
      },
      processedContent: {
        notes: processedNotes.map(note => ({
          id: note._id,
          title: note.title,
          content: note.content,
          summary: note.summary,
          topicMapping: note.topicMapping,
          difficulty: note.difficulty,
          tags: note.tags,
          reviewCount: note.reviewCount,
          lastReviewedAt: note.lastReviewedAt,
          nextReviewAt: note.nextReviewAt,
          createdAt: note.createdAt,
        })),
        mcqs: processedMCQs.map(mcq => ({
          id: mcq._id,
          question: mcq.question,
          options: mcq.options,
          correctAnswer: mcq.correctAnswer,
          explanation: mcq.explanation,
          topicMapping: mcq.topicMapping,
          difficulty: mcq.difficulty,
          tags: mcq.tags,
          attempts: mcq.totalAttempts,
          accuracy: mcq.accuracy,
          createdAt: mcq.createdAt,
        })),
        flashcards: processedFlashcards.map(card => ({
          id: card._id,
          question: card.question,
          answer: card.answer,
          explanation: card.explanation,
          topicMapping: card.topicMapping,
          difficulty: card.difficulty,
          tags: card.tags,
          reviewCount: card.reviewCount,
          lastReviewedAt: card.lastReviewedAt,
          nextReviewAt: card.nextReviewAt,
          accuracy: card.accuracy,
          createdAt: card.createdAt,
        })),
      },
      // Legacy content for backward compatibility
      legacyContent: pdfUpload.aiProcessedContent,
      learningGraph: learningGraphDoc?.graph || null,
    };

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error fetching PDF results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}