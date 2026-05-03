import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = system note
  proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfProposal' },
  content: { type: String, default: '' },
  source: { type: String, enum: ['system', 'user', 'pdf', 'ai'], default: 'system' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

NoteSchema.index({ topicId: 1, userId: 1 });

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
