import mongoose from 'mongoose';

const PdfRevisionSchema = new mongoose.Schema({
  pdfUploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfUpload', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  schemaVersion: { type: String, default: '1.0' },

  baseProposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfProposal' },
  scope: { type: String, enum: ['chunk', 'topic', 'chapter', 'diagram'], required: true, index: true },
  targetId: { type: String, required: true, index: true },

  // Payload represents a patch or a full replacement for the target node.
  payload: { type: mongoose.Schema.Types.Mixed, required: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PdfRevision || mongoose.model('PdfRevision', PdfRevisionSchema);

