/**
 * POST /api/pdf/process — Process uploaded PDF with AI
 */
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PdfUpload from '@/models/PdfUpload';
import { authenticateRequest } from '@/lib/auth';
import { classifyPDFContent, generateMCQs } from '@/lib/ai';

export async function POST(request) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { uploadId, subject, extractedText } = await request.json();

    let upload;
    try {
      await dbConnect();
      upload = await PdfUpload.findById(uploadId);
      if (upload) {
        upload.status = 'classifying';
        await upload.save();
      }
    } catch (err) {
      console.warn('Database not connected. Processing PDF without saving to DB.');
    }

    if (!upload && !extractedText) {
      return NextResponse.json({ error: 'Upload not found and no text provided.' }, { status: 404 });
    }

    // Use extractedText from DB or fallback to request
    const text = upload ? upload.extractedText : extractedText;
    
    // Create a mock upload object if DB is not used
    if (!upload) {
      upload = {
        _id: uploadId,
        originalName: 'Mock_Upload.pdf',
        pageCount: Math.ceil(text.length / 2000),
      };
    }
    const chunks = [];
    for (let i = 0; i < text.length; i += 2000) {
      chunks.push(text.substring(i, i + 2000));
    }

    // Classify each chunk with AI
    const classifiedResults = [];
    try {
      for (const chunk of chunks.slice(0, 10)) { // Limit to 10 chunks for performance
        try {
          const result = await classifyPDFContent(chunk, subject || 'General');
          classifiedResults.push(result);
        } catch (chunkError) {
          console.warn('Failed to classify chunk, using fallback:', chunkError.message);
          // Fallback: create a basic note from the chunk
          classifiedResults.push({
            type: 'notes',
            chapter: 'Extracted Content',
            topic: `Section ${classifiedResults.length + 1}`,
            content: chunk,
            summary: chunk.substring(0, 200)
          });
        }
      }
    } catch (classifyError) {
      console.warn('Failed to classify content:', classifyError.message);
    }

    // Generate additional MCQs
    if (typeof upload.save === 'function') {
      try {
        upload.status = 'processing';
        await upload.save();
      } catch(e) {}
    }

    let mcqs = [];
    try {
      mcqs = await generateMCQs(text.substring(0, 5000), subject || 'General', 20);
    } catch (mcqError) {
      console.warn('Failed to generate MCQs:', mcqError.message);
      // Fallback: create basic MCQ structure
      mcqs = [
        {
          question: 'What is the main topic of this document?',
          options: [
            'Topic from the document',
            'General knowledge',
            'Related concept',
            'Unrelated concept'
          ],
          correctAnswer: 0,
          explanation: 'This is a fallback MCQ generated because AI processing was unavailable.',
          difficulty: 'easy'
        }
      ];
    }

    // Store processed content
    upload.aiProcessedContent = {
      notes: classifiedResults.filter(r => r.type === 'notes').map(r => ({
        topicTitle: r.topic, content: r.content
      })),
      mcqs: mcqs,
      descriptiveQuestions: classifiedResults.filter(r => r.type === 'descriptive_question').map(r => ({
        question: r.content, sampleAnswer: r.summary || ''
      })),
      summaries: classifiedResults.map(r => ({ chapter: r.chapter, summary: r.summary || '' })),
    };
    upload.status = 'completed';
    upload.processedAt = new Date();
    if (typeof upload.save === 'function') {
      try {
        await upload.save();
      } catch(e) {}
    }

    return NextResponse.json({ upload, message: 'PDF processed successfully!' });
  } catch (error) {
    console.error('PDF process error:', error);
    return NextResponse.json({ error: 'PDF processing failed.' }, { status: 500 });
  }
}
