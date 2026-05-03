import mongoose from 'mongoose';

const FlashcardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contentBlockId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentBlock' },
  pdfUploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfUpload', required: true },

  // Flashcard content
  question: { type: String, required: true },
  answer: { type: String, required: true },
  explanation: { type: String },

  // Topic mapping
  topicMapping: {
    subject: { type: String, required: true },
    chapter: { type: String, required: true },
    topic: { type: String, required: true },
  },

  // Metadata
  source: { type: String, enum: ['pdf-upload', 'ai-generated', 'manual'], default: 'pdf-upload' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [String],

  // Study tracking (Spaced Repetition System)
  reviewCount: { type: Number, default: 0 },
  lastReviewedAt: Date,
  nextReviewAt: Date,
  easeFactor: { type: Number, default: 2.5, min: 1.3 }, // SM-2 algorithm ease factor
  interval: { type: Number, default: 0 }, // Days between reviews

  // Performance tracking
  correctStreak: { type: Number, default: 0 },
  totalCorrect: { type: Number, default: 0 },
  totalIncorrect: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0, min: 0, max: 1 },

  // Review history
  reviewHistory: [{
    quality: { type: Number, min: 0, max: 5 }, // SM-2 quality rating
    reviewedAt: { type: Date, default: Date.now },
    timeSpent: Number, // in seconds
    isCorrect: Boolean,
  }],

  // Approval status
  approved: { type: Boolean, default: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
FlashcardSchema.index({ userId: 1, createdAt: -1 });
FlashcardSchema.index({ 'topicMapping.subject': 1, 'topicMapping.chapter': 1, 'topicMapping.topic': 1 });
FlashcardSchema.index({ pdfUploadId: 1 });
FlashcardSchema.index({ approved: 1, nextReviewAt: 1 });
FlashcardSchema.index({ difficulty: 1, accuracy: 1 });

// Instance methods
FlashcardSchema.methods.review = function(quality = 3, timeSpent = 0) {
  // SM-2 Spaced Repetition Algorithm
  const now = new Date();
  const isCorrect = quality >= 3;

  // Record the review
  this.reviewHistory.push({
    quality,
    reviewedAt: now,
    timeSpent,
    isCorrect,
  });

  this.reviewCount += 1;
  this.lastReviewedAt = now;

  // Update performance stats
  if (isCorrect) {
    this.correctStreak += 1;
    this.totalCorrect += 1;
  } else {
    this.correctStreak = 0;
    this.totalIncorrect += 1;
  }

  this.accuracy = (this.totalCorrect + this.totalIncorrect) > 0
    ? this.totalCorrect / (this.totalCorrect + this.totalIncorrect)
    : 0;

  // Calculate new interval and ease factor
  if (isCorrect) {
    if (this.reviewCount === 1) {
      this.interval = 1;
    } else if (this.reviewCount === 2) {
      this.interval = 6;
    } else {
      this.interval = Math.round(this.interval * this.easeFactor);
    }

    // Adjust ease factor
    this.easeFactor = Math.max(1.3, this.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  } else {
    this.interval = 1; // Reset to 1 day on incorrect answer
    this.easeFactor = Math.max(1.3, this.easeFactor - 0.2);
  }

  // Cap interval at 6 months
  this.interval = Math.min(this.interval, 180);

  // Set next review date
  this.nextReviewAt = new Date(now.getTime() + this.interval * 24 * 60 * 60 * 1000);

  return this.save();
};

FlashcardSchema.methods.getReviewStatus = function() {
  const now = new Date();

  if (!this.nextReviewAt) return 'new';
  if (now > this.nextReviewAt) return 'due';
  if (now.getTime() + 24 * 60 * 60 * 1000 > this.nextReviewAt.getTime()) return 'soon';
  return 'later';
};

FlashcardSchema.methods.getPerformanceStats = function() {
  return {
    reviewCount: this.reviewCount,
    correctStreak: this.correctStreak,
    totalCorrect: this.totalCorrect,
    totalIncorrect: this.totalIncorrect,
    accuracy: this.accuracy,
    easeFactor: this.easeFactor,
    interval: this.interval,
    averageTime: this.reviewHistory.length > 0
      ? this.reviewHistory.reduce((sum, review) => sum + (review.timeSpent || 0), 0) / this.reviewHistory.length
      : 0,
  };
};

FlashcardSchema.methods.isMastered = function(minAccuracy = 0.9, minReviews = 5) {
  return this.reviewCount >= minReviews && this.accuracy >= minAccuracy && this.correctStreak >= 3;
};

export default mongoose.models.Flashcard || mongoose.model('Flashcard', FlashcardSchema);