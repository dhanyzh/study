import mongoose from 'mongoose';
import Subject from './src/models/Subject.js';
import Chapter from './src/models/Chapter.js';

async function checkLocalDB() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/studyos');
    const subjects = await Subject.find({});
    const chapters = await Chapter.find({});
    console.log(`Found ${subjects.length} subjects and ${chapters.length} chapters.`);
    if (subjects.length === 0) {
      console.log('Database is empty!');
    } else {
      console.log('Subjects:', subjects.map(s => s.name).join(', '));
      console.log('Chapters:', chapters.map(c => c.title).join(', '));
    }
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to local DB:', err.message);
    process.exit(1);
  }
}
checkLocalDB();
