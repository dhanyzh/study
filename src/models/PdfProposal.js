import mongoose from 'mongoose';

const PdfProposalSchema = new mongoose.Schema({
  pdfUploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfUpload', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  schemaVersion: { type: String, default: '1.0' },

  // scope + targetId tell the UI where the proposal will be applied.
  scope: { type: String, enum: ['chunk', 'topic', 'chapter', 'diagram'], required: true, index: true },
  targetId: { type: String, required: true, index: true },

  contentType: {
    type: String,
    enum: ['notes', 'mcq', 'descriptive_question', 'formula', 'code', 'table'],
    required: true,
    index: true,
  },

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },

  modelMeta: { type: mongoose.Schema.Types.Mixed }, // provider/model/promptHash/etc.
  payload: { type: mongoose.Schema.Types.Mixed, required: true },

  approvedAt: Date,
  rejectedAt: Date,

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PdfProposal || mongoose.model('PdfProposal', PdfProposalSchema);

