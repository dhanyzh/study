import mongoose from 'mongoose';

const TopicSchema = new mongoose.Schema({
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, lowercase: true },
  order: { type: Number, default: 0 },
  videoUrl: { type: String, default: '' },
});

TopicSchema.index({ chapterId: 1, slug: 1 }, { unique: true });

export default mongoose.models.Topic || mongoose.model('Topic', TopicSchema);
