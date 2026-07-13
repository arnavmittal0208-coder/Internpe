import Quiz from '../models/Quiz.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toFrontendQuiz = (quiz) => {
  if (!quiz) return null;
  return {
    id: quiz._id.toString(),
    courseId: quiz.courseId.toString(),
    title: quiz.quizTitle,
    description: quiz.description,
    timeLimit: quiz.timer,
    marks: quiz.marks,
    questions: (quiz.questions || []).map((q) => ({
      id: q._id ? q._id.toString() : undefined,
      questionText: q.questionText,
      options: q.options,
      correctIndex: q.correctAnswer,
      explanation: q.explanation || '',
      marks: q.marks
    }))
  };
};

const mapIncomingQuiz = (body) => ({
  courseId: body.courseId,
  quizTitle: body.quizTitle || body.title,
  description: body.description,
  timer: body.timer !== undefined ? body.timer : body.timeLimit,
  marks: body.marks,
  questions: (body.questions || []).map((q) => ({
    questionText: q.questionText,
    options: q.options,
    correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : q.correctIndex,
    explanation: q.explanation || '',
    marks: q.marks
  }))
});

export const getQuizzesByCourse = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ courseId: req.params.courseId }).sort({ createdAt: -1 });
  res.json({ quizzes: quizzes.map(toFrontendQuiz) });
});

export const getAllQuizzes = asyncHandler(async (_req, res) => {
  const quizzes = await Quiz.find().sort({ createdAt: -1 });
  res.json({ quizzes: quizzes.map(toFrontendQuiz) });
});

export const createQuiz = asyncHandler(async (req, res) => {
  const payload = mapIncomingQuiz(req.body);
  const quiz = await Quiz.create(payload);
  res.status(201).json({ quiz: toFrontendQuiz(quiz) });
});

export const updateQuiz = asyncHandler(async (req, res) => {
  const payload = mapIncomingQuiz(req.body);
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  res.json({ quiz: toFrontendQuiz(quiz) });
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  await Quiz.findByIdAndDelete(req.params.id);
  res.json({ message: 'Quiz deleted successfully' });
});