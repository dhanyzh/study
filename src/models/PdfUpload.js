import mongoose from 'mongoose';

const ContentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['heading', 'paragraph', 'list', 'table', 'code', 'formula', 'mcq', 'question', 'definition', 'empty'],
    required: true,
  },
  rawContent: { type: String, required: true },
  content: { type: String, required: true },
  pageNumber: { type: Number, required: true },
  blockIndex: { type: Number, required: true },

  // Classification
  classification: {
    primaryCategory: {
      type: String,
      enum: ['notes', 'mcq', 'question', 'definition', 'formula', 'code', 'table', 'example'],
      default: 'notes',
    },
    confidence: { type: Number, default: 0.5 },
    method: { type: String, enum: ['rule-based', 'ai-based', 'hybrid'], default: 'rule-based' },
  },

  // AI Enhancement
  enhancements: {
    summary: String,
    keyPoints: [String],
    mcqs: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String,
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    }],
    flashcards: [{
      question: String,
      answer: String,
      explanation: String,
    }],
  },

  // Topic Mapping
  topicMapping: {
    subject: String,
    chapter: String,
    topic: String,
    confidence: { type: Number, default: 0 },
    method: { type: String, enum: ['rule-based', 'ai-based'], default: 'rule-based' },
  },

  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
});

const PdfUploadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },

  // File metadata
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, default: 'application/pdf' },
  cloudUrl: String, // For S3 storage

  // Processing status
  status: {
    type: String,
    enum: ['queued', 'extracting', 'parsing', 'classifying', 'enhancing', 'mapping', 'question-generation', 'diagram-intelligence', 'routing', 'processing', 'completed', 'failed'],
    default: 'queued',
  },
  currentStage: { type: String, default: 'Queued for processing' },
  progress: { type: Number, default: 0, min: 0, max: 100 },

  // Extraction data
  pageCount: { type: Number, default: 0 },
  rawExtractedText: { type: String, default: '' },
  // OCR/layout/table/image artifacts for downstream processing.
  // Note: imageBase64 can be large; for production, consider moving images to object storage (S3).
  extractedTables: [{
    pageNumber: { type: Number, required: true },
    tableIndex: { type: Number, required: true },
    rows: [[String]],
  }],
  extractedImages: [{
    pageNumber: { type: Number, required: true },
    imageIndex: { type: Number, required: true },
    figureId: { type: String, required: true },
    mimeType: { type: String, default: 'image/png' },
    imageBase64: { type: String }, // optional, depends on extractor
  }],
  textBlocks: [ContentBlockSchema],

  // New schema objects (v2)
  pdfExtractionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfExtraction' },
  learningGraphId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfLearningGraph' },

  // Processing metadata
  processingStartedAt: { type: Date },
  completedAt: { type: Date },
  errorLog: [{ message: String, stage: String, timestamp: { type: Date, default: Date.now } }],

  // Subject context (suggested by AI)
  suggestedSubject: { type: String, default: 'General' },
  suggestedChapter: { type: String },

  // Final processed content
  aiProcessedContent: {
    notes: [{
      title: String,
      content: String,
      summary: String,
      topicTitle: String,
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
      createdAt: { type: Date, default: Date.now },
    }],
    mcqs: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String,
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
      topicMapping: {
        subject: String,
        chapter: String,
        topic: String,
      },
      source: { type: String, enum: ['rule-based', 'ai-generated', 'extracted'], default: 'ai-generated' },
      createdAt: { type: Date, default: Date.now },
    }],
    flashcards: [{
      question: String,
      answer: String,
      explanation: String,
      topicMapping: {
        subject: String,
        chapter: String,
        topic: String,
      },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
      reviewCount: { type: Number, default: 0 },
      lastReviewedAt: Date,
      createdAt: { type: Date, default: Date.now },
    }],
    descriptiveQuestions: [{
      question: String,
      sampleAnswer: String,
      hints: [String],
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
      topicMapping: {
        subject: String,
        chapter: String,
        topic: String,
      },
      createdAt: { type: Date, default: Date.now },
    }],
  },

  // References to processed content models
  processedNotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProcessedNote' }],
  processedMCQs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProcessedMCQ' }],
  processedFlashcards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard' }],

  // Statistics
  stats: {
    totalBlocks: { type: Number, default: 0 },
    notesCount: { type: Number, default: 0 },
    mcqCount: { type: Number, default: 0 },
    flashcardsCount: { type: Number, default: 0 },
    processingTimeMs: Number,
  },

  // Legacy fields (for backward compatibility)
  extractedText: { type: String, default: '' },
  extractedContent: {
    chapters: [
      {
        title: String,
        topics: [
          {
            title: String,
            content: String,
            type: String,
          },
        ],
      },
    ],
  },

  // Approval and moderation
  approved: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,

  // Timestamps
  uploadedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
}, {
  timestamps: true,
});

// Indexes for performance
PdfUploadSchema.index({ userId: 1, createdAt: -1 });
PdfUploadSchema.index({ status: 1, progress: 1 });
PdfUploadSchema.index({ 'aiProcessedContent.mcqs.topicMapping.subject': 1 });
PdfUploadSchema.index({ 'aiProcessedContent.notes.topicTitle': 1 });

// Virtual for processing time
PdfUploadSchema.virtual('processingTime').get(function() {
  if (this.processingStartedAt && this.completedAt) {
    return this.completedAt - this.processingStartedAt;
  }
  return null;
});

// Instance methods
PdfUploadSchema.methods.updateProgress = function(stage, progress, error = null) {
  this.currentStage = stage;
  this.progress = progress;

  if (error) {
    this.errorLog.push({
      message: error.message || error,
      stage,
      timestamp: new Date(),
    });
  }

  return this.save();
};

PdfUploadSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.currentStage = 'Processing complete';
  this.progress = 100;
  this.completedAt = new Date();

  // Calculate stats
  if (this.aiProcessedContent) {
    this.stats = {
      totalBlocks: this.textBlocks?.length || 0,
      notesCount: this.aiProcessedContent.notes?.length || 0,
      mcqCount: this.aiProcessedContent.mcqs?.length || 0,
      flashcardsCount: this.aiProcessedContent.flashcards?.length || 0,
      processingTimeMs: this.processingTime,
    };
  }

  // Update stats with processed content counts
  this.stats.processedNotesCount = this.processedNotes?.length || 0;
  this.stats.processedMCQsCount = this.processedMCQs?.length || 0;
  this.stats.processedFlashcardsCount = this.processedFlashcards?.length || 0;

  return this.save();
};

PdfUploadSchema.methods.markFailed = function(error, stage = 'unknown') {
  this.status = 'failed';
  this.currentStage = `Failed at ${stage}`;
  this.errorLog.push({
    message: error.message || error,
    stage,
    timestamp: new Date(),
  });

  return this.save();
};

export default mongoose.models.PdfUpload || mongoose.model('PdfUpload', PdfUploadSchema);
