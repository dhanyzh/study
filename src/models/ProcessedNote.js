import mongoose from 'mongoose';

const ProcessedNoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contentBlockId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentBlock' },
  pdfUploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfUpload', required: true },

  // Note content
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String },

  // Topic mapping
  topicMapping: {
    subject: { type: String, required: true },
    chapter: { type: String, required: true },
    topic: { type: String, required: true },
  },

  // Metadata
  source: { type: String, enum: ['pdf-upload', 'manual'], default: 'pdf-upload' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [String],

  // Study tracking
  reviewCount: { type: Number, default: 0 },
  lastReviewedAt: Date,
  nextReviewAt: Date,
  easeFactor: { type: Number, default: 2.5 }, // For spaced repetition

  // Approval status
  approved: { type: Boolean, default: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
ProcessedNoteSchema.index({ userId: 1, createdAt: -1 });
ProcessedNoteSchema.index({ 'topicMapping.subject': 1, 'topicMapping.chapter': 1, 'topicMapping.topic': 1 });
ProcessedNoteSchema.index({ pdfUploadId: 1 });
ProcessedNoteSchema.index({ approved: 1, createdAt: -1 });

// Instance methods
ProcessedNoteSchema.methods.markReviewed = function(quality = 3) {
  // Spaced repetition algorithm (simplified SM-2)
  this.reviewCount += 1;
  this.lastReviewedAt = new Date();

  // Adjust ease factor based on quality (0-5)
  if (quality >= 3) {
    this.easeFactor = Math.max(1.3, this.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  } else {
    this.easeFactor = Math.max(1.3, this.easeFactor - 0.2);
  }

  // Calculate next review interval
  let interval;
  if (this.reviewCount === 1) {
    interval = 1; // 1 day
  } else if (this.reviewCount === 2) {
    interval = 6; // 6 days
  } else {
    interval = Math.round((this.reviewCount - 1) * this.easeFactor);
  }

  this.nextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

  return this.save();
};

ProcessedNoteSchema.methods.getReviewStatus = function() {
  const now = new Date();

  if (!this.nextReviewAt) return 'new';
  if (now > this.nextReviewAt) return 'due';
  if (now.getTime() + 24 * 60 * 60 * 1000 > this.nextReviewAt.getTime()) return 'soon';
  return 'later';
};

export default mongoose.models.ProcessedNote || mongoose.model('ProcessedNote', ProcessedNoteSchema);