import mongoose from 'mongoose';

const PdfExtractionSchema = new mongoose.Schema({
  pdfUploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'PdfUpload', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  schemaVersion: { type: String, default: '1.0' },

  // Store the structured extractor payload (text/pages/tables/images metadata).
  // For production scalability, move large binary assets (images) to object storage and store references here.
  payload: { type: mongoose.Schema.Types.Mixed, required: true },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PdfExtraction || mongoose.model('PdfExtraction', PdfExtractionSchema);

