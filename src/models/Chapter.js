import mongoose from 'mongoose';

const ChapterSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, lowercase: true },
  order: { type: Number, default: 0 },
  description: { type: String, default: '' },
});

ChapterSchema.index({ subjectId: 1, slug: 1 }, { unique: true });

export default mongoose.models.Chapter || mongoose.model('Chapter', ChapterSchema);
