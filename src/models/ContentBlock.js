import mongoose from 'mongoose';

const ContentBlockSchema = new mongoose.Schema({
  pdfUploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfUpload', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Block structure
  type: {
    type: String,
    enum: ['heading', 'paragraph', 'list', 'table', 'code', 'formula', 'mcq', 'question', 'definition', 'empty'],
    required: true,
  },
  rawContent: { type: String, required: true },
  content: { type: String, required: true },
  hierarchy: {
    level: { type: Number, default: 1 }, // For headings (1-6)
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentBlock' },
  },

  // Location in PDF
  pageNumber: { type: Number, required: true },
  blockIndex: { type: Number, required: true },

  // Classification
  classification: {
    primaryCategory: {
      type: String,
      enum: ['notes', 'mcq', 'question', 'definition', 'formula', 'code', 'table', 'example'],
      default: 'notes',
    },
    confidence: { type: Number, default: 0.5, min: 0, max: 1 },
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
    confidence: { type: Number, default: 0, min: 0, max: 1 },
    method: { type: String, enum: ['rule-based', 'ai-based'], default: 'rule-based' },
  },

  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
});

// Indexes
ContentBlockSchema.index({ pdfUploadId: 1, blockIndex: 1 });
ContentBlockSchema.index({ userId: 1, createdAt: -1 });
ContentBlockSchema.index({ 'classification.primaryCategory': 1 });
ContentBlockSchema.index({ 'topicMapping.subject': 1, 'topicMapping.chapter': 1 });

export default mongoose.models.ContentBlock || mongoose.model('ContentBlock', ContentBlockSchema);