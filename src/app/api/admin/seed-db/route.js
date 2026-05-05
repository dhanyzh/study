import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import Chapter from '@/models/Chapter';
import Topic from '@/models/Topic';
import Note from '@/models/Note';
import Quiz from '@/models/Quiz';
import { SUBJECTS_DATA, CHAPTERS_DATA } from '../../../../../scripts/seed.js';

export async function POST(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();

    // Clear existing data (except Users to avoid logging out the admin)
    await Subject.deleteMany({});
    await Chapter.deleteMany({});
    await Topic.deleteMany({});
    await Note.deleteMany({});
    await Quiz.deleteMany({});

    // Seed subjects
    const subjects = await Subject.insertMany(SUBJECTS_DATA);
    let totalChapters = 0, totalTopics = 0, totalNotes = 0, totalQuizzes = 0;

    // Seed chapters, topics, notes, quizzes for each subject
    for (const subject of subjects) {
      const chaptersData = CHAPTERS_DATA[subject.slug];
      if (!chaptersData) continue;

      for (const chData of chaptersData) {
        const chapter = await Chapter.create({
          subjectId: subject._id, 
          title: chData.title,
          slug: chData.slug, 
          order: chData.order, 
          description: chData.description || '',
        });
        totalChapters++;

        if (chData.topics) {
          for (const tData of chData.topics) {
            const topic = await Topic.create({
              chapterId: chapter._id, 
              subjectId: subject._id,
              title: tData.title, 
              slug: tData.slug, 
              order: tData.order,
              videoUrl: tData.videoUrl || '',
            });
            totalTopics++;

            if (tData.notes) {
              await Note.create({ topicId: topic._id, content: tData.notes, source: 'system' });
              totalNotes++;
            }

            if (tData.quizzes) {
              for (const qData of tData.quizzes) {
                await Quiz.create({ topicId: topic._id, subjectId: subject._id, ...qData, source: 'system' });
                totalQuizzes++;
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Database seeded! ${subjects.length} subjects, ${totalChapters} chapters, ${totalTopics} topics added.` 
    });
  } catch (error) {
    console.error('Seed error via API:', error);
    return NextResponse.json(
      { error: 'Database seeding failed.', details: error.message },
      { status: 500 }
    );
  }
}
