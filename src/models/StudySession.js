import mongoose from 'mongoose';

const StudySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  durationMinutes: { type: Number, required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  sessionType: { type: String, enum: ['pomodoro', 'free', 'exam'], default: 'free' },
});

StudySessionSchema.index({ userId: 1, startedAt: -1 });

export default mongoose.models.StudySession || mongoose.model('StudySession', StudySessionSchema);
