import mongoose from 'mongoose';

const ProcessedMCQSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contentBlockId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentBlock' },
  pdfUploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfUpload', required: true },

  // MCQ content
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true, min: 0 }, // Index of correct option
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

  // Study tracking
  attempts: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeSpent: Number, // in seconds
    attemptedAt: { type: Date, default: Date.now },
  }],
  correctAttempts: { type: Number, default: 0 },
  totalAttempts: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0, min: 0, max: 1 },

  // Approval status
  approved: { type: Boolean, default: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
ProcessedMCQSchema.index({ userId: 1, createdAt: -1 });
ProcessedMCQSchema.index({ 'topicMapping.subject': 1, 'topicMapping.chapter': 1, 'topicMapping.topic': 1 });
ProcessedMCQSchema.index({ pdfUploadId: 1 });
ProcessedMCQSchema.index({ approved: 1, createdAt: -1 });
ProcessedMCQSchema.index({ difficulty: 1, accuracy: 1 });

// Instance methods
ProcessedMCQSchema.methods.recordAttempt = function(userId, selectedAnswer, timeSpent = 0) {
  const isCorrect = selectedAnswer === this.correctAnswer;

  this.attempts.push({
    userId,
    selectedAnswer,
    isCorrect,
    timeSpent,
    attemptedAt: new Date(),
  });

  this.totalAttempts += 1;
  if (isCorrect) {
    this.correctAttempts += 1;
  }

  this.accuracy = this.correctAttempts / this.totalAttempts;

  return this.save();
};

ProcessedMCQSchema.methods.getPerformanceStats = function() {
  return {
    totalAttempts: this.totalAttempts,
    correctAttempts: this.correctAttempts,
    accuracy: this.accuracy,
    averageTime: this.attempts.length > 0
      ? this.attempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / this.attempts.length
      : 0,
  };
};

ProcessedMCQSchema.methods.isMastered = function(minAccuracy = 0.8, minAttempts = 3) {
  return this.totalAttempts >= minAttempts && this.accuracy >= minAccuracy;
};

export default mongoose.models.ProcessedMCQ || mongoose.model('ProcessedMCQ', ProcessedMCQSchema);