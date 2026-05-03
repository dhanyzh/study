import mongoose from 'mongoose';

const ExamAttemptSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mcqAnswers: [{ type: Number }], // Array of selected option indices
  descriptiveAnswers: [{ type: String }], // Array of written answers
  mcqScore: { type: Number, default: 0 },
  descriptiveScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  aiFeedback: { type: String, default: '' },
  descriptiveEvaluations: [
    {
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' },
      suggestions: [{ type: String }],
    },
  ],
  attemptedAt: { type: Date, default: Date.now },
});

ExamAttemptSchema.index({ examId: 1, userId: 1 });

export default mongoose.models.ExamAttempt || mongoose.model('ExamAttempt', ExamAttemptSchema);
