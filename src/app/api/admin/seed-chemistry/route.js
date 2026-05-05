import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import dbConnect from '@/lib/db';
import Quiz from '@/models/Quiz';
import Subject from '@/models/Subject';
import { chemistryQuestions } from '@/components/ChemistryModule1Quiz';

export async function POST(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();
    const chemistrySubject = await Subject.findOne({ slug: 'chemistry' });
    if (!chemistrySubject) {
      return NextResponse.json({ error: 'Chemistry subject not found. Run the main seed first.' }, { status: 404 });
    }

    const quizzesToInsert = chemistryQuestions.map(q => {
      return {
        subjectId: chemistrySubject._id,
        question: q.question,
        options: q.options,
        correctAnswer: q.options.indexOf(q.correctAnswer),
        explanation: '',
        difficulty: 'medium',
        source: 'system'
      };
    });

    await Quiz.insertMany(quizzesToInsert);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully added ${quizzesToInsert.length} chemistry quizzes to the database!` 
    });
  } catch (error) {
    console.error('Seed chemistry error:', error);
    return NextResponse.json(
      { error: 'Failed to seed chemistry quizzes.', details: error.message },
      { status: 500 }
    );
  }
}
