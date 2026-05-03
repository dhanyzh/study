import mongoose from 'mongoose';

const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  notesRead: { type: Boolean, default: false },
  quizCompleted: { type: Boolean, default: false },
  quizScore: { type: Number, default: 0 },
  quizTotal: { type: Number, default: 0 },
  timeSpentMinutes: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now },
});

// One progress record per user per topic
ProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });
ProgressSchema.index({ userId: 1, subjectId: 1 });

export default mongoose.models.Progress || mongoose.model('Progress', ProgressSchema);
