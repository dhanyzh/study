import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  icon: { type: String, default: '📚' },
  color: { type: String, default: '#6C63FF' },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
});

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
