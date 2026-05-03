import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  proposalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PdfProposal' }],
  // 15 MCQ references
  mcqs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  // 3 descriptive questions (5 marks each)
  descriptiveQuestions: [
    {
      question: { type: String, required: true },
      marks: { type: Number, default: 5 },
      sampleAnswer: { type: String, default: '' },
    },
  ],
  totalMarks: { type: Number, default: 30 }, // 15 MCQs (1 each) + 3 descriptive (5 each) = 30
  duration: { type: Number, default: 45 }, // minutes
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
