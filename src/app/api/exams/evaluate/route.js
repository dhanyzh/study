/**
 * POST /api/exams/evaluate — Submit exam answers for AI evaluation
 * 
 * Handles both MCQ scoring (automatic) and descriptive answer evaluation (AI).
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';
import Quiz from '@/models/Quiz';
import { authenticateRequest } from '@/lib/auth';
import { evaluateAnswer } from '@/lib/ai';

export async function POST(request) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await dbConnect();
    const { examId, mcqAnswers, descriptiveAnswers } = await request.json();

    if (!examId) {
      return NextResponse.json({ error: 'examId is required.' }, { status: 400 });
    }

    // Fetch exam with populated MCQs
    const exam = await Exam.findById(examId).populate('mcqs');
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found.' }, { status: 404 });
    }

    // Score MCQs (1 mark each)
    let mcqScore = 0;
    if (mcqAnswers && exam.mcqs) {
      exam.mcqs.forEach((mcq, index) => {
        if (mcqAnswers[index] === mcq.correctAnswer) {
          mcqScore++;
        }
      });
    }

    // Evaluate descriptive answers using AI
    const descriptiveEvaluations = [];
    let descriptiveScore = 0;

    if (descriptiveAnswers && exam.descriptiveQuestions) {
      for (let i = 0; i < exam.descriptiveQuestions.length; i++) {
        const question = exam.descriptiveQuestions[i];
        const answer = descriptiveAnswers[i] || '';

        if (answer.trim()) {
          const evaluation = await evaluateAnswer(question.question, answer, question.marks);
          descriptiveEvaluations.push(evaluation);
          descriptiveScore += evaluation.score;
        } else {
          descriptiveEvaluations.push({
            score: 0,
            feedback: 'No answer provided.',
            suggestions: ['Attempt the question next time.'],
          });
        }
      }
    }

    const totalScore = mcqScore + descriptiveScore;

    // Save the attempt
    const attempt = await ExamAttempt.create({
      examId,
      userId: payload.userId,
      mcqAnswers: mcqAnswers || [],
      descriptiveAnswers: descriptiveAnswers || [],
      mcqScore,
      descriptiveScore,
      totalScore,
      descriptiveEvaluations,
      aiFeedback: `MCQ: ${mcqScore}/${exam.mcqs.length} | Descriptive: ${descriptiveScore}/${exam.descriptiveQuestions.length * 5} | Total: ${totalScore}/${exam.totalMarks}`,
    });

    return NextResponse.json({
      attempt,
      mcqScore,
      descriptiveScore,
      totalScore,
      totalMarks: exam.totalMarks,
      descriptiveEvaluations,
    });
  } catch (error) {
    console.error('Exam evaluate error:', error);
    return NextResponse.json({ error: 'Failed to evaluate exam.' }, { status: 500 });
  }
}
