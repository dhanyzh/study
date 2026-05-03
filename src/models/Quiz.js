import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfProposal' },
  question: { type: String, required: true },
  options: [{ type: String, required: true }], // Array of 4 options
  correctAnswer: { type: Number, required: true, min: 0, max: 3 }, // Index of correct option
  explanation: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  source: { type: String, enum: ['system', 'pdf', 'ai'], default: 'system' },
  createdAt: { type: Date, default: Date.now },
});

QuizSchema.index({ topicId: 1 });
QuizSchema.index({ subjectId: 1 });

export default mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);
