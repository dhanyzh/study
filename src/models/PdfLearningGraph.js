import mongoose from 'mongoose';

const PdfLearningGraphSchema = new mongoose.Schema({
  pdfUploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfUpload', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  schemaVersion: { type: String, default: '1.0' },

  status: { type: String, enum: ['building', 'approved', 'rejected'], default: 'approved', index: true },

  // Canonical learning graph JSON used by the UI.
  graph: { type: mongoose.Schema.Types.Mixed, required: true },

  // Optional link to the revision currently active in the UI.
  activeRevisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfRevision' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Mongoose supports both callback-style and sync/async middleware.
// In some bundled environments the callback param can be omitted, so keep this hook sync.
PdfLearningGraphSchema.pre('save', function preSave() {
  this.updatedAt = new Date();
});

export default mongoose.models.PdfLearningGraph || mongoose.model('PdfLearningGraph', PdfLearningGraphSchema);

