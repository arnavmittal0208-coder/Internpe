import CodingChallenge from '../models/CodingChallenge.js';
import Lecture from '../models/Lecture.js';
import Quiz from '../models/Quiz.js';
import StudentProgress from '../models/StudentProgress.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const DEFAULT_PROGRESS = {
  completedLectures: [],
  lastWatchedLecture: null,
  currentPlaybackTime: 0,
  watchPercentage: 0,
  lectureProgress: [],
  quizScores: [],
  completedCodingChallenges: [],
  notes: [],
  totalLectures: 0,
  completedLecturesCount: 0,
  courseCompletionPercentage: 0,
  lastActivityTimestamp: null
};

const uniqueStrings = (values) => [...new Set((values || []).filter(Boolean).map(String))];

const upsertEntry = (items, matchKey, matchValue, nextEntry) => {
  const remaining = (items || []).filter((item) => String(item?.[matchKey]) !== String(matchValue));
  return [...remaining, nextEntry];
};

const calculateCourseStats = async (courseId, progress, overrides = {}) => {
  const [totalLectures, totalQuizzes, totalChallenges] = await Promise.all([
    Lecture.countDocuments({ courseId }),
    Quiz.countDocuments({ courseId }),
    CodingChallenge.countDocuments({ courseId })
  ]);

  const completedLecturesCount = uniqueStrings(progress.completedLectures).length;
  const completedQuizCount = (progress.quizScores || []).filter((quizScore) => quizScore.completionStatus === 'completed').length;
  const completedChallengeCount = (progress.completedCodingChallenges || []).filter((challenge) => challenge.status === 'completed').length;
  const totalItems = totalLectures + totalQuizzes + totalChallenges;
  const completedItems = completedLecturesCount + completedQuizCount + completedChallengeCount;
  const courseCompletionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return {
    totalLectures: Number.isFinite(overrides.totalLectures) ? overrides.totalLectures : totalLectures,
    completedLecturesCount: Number.isFinite(overrides.completedLecturesCount) ? overrides.completedLecturesCount : completedLecturesCount,
    courseCompletionPercentage: Number.isFinite(overrides.courseCompletionPercentage) ? overrides.courseCompletionPercentage : courseCompletionPercentage
  };
};

const toClientProgress = (progress) => ({
  ...DEFAULT_PROGRESS,
  ...(progress ? {
    id: progress._id,
    userId: progress.userId,
    courseId: progress.courseId,
    completedLectures: uniqueStrings(progress.completedLectures),
    lastWatchedLecture: progress.lastWatchedLecture || null,
    currentPlaybackTime: progress.currentPlaybackTime || 0,
    watchPercentage: progress.watchPercentage || 0,
    lectureProgress: progress.lectureProgress || [],
    quizScores: progress.quizScores || [],
    completedCodingChallenges: progress.completedCodingChallenges || [],
    notes: progress.notes || [],
    totalLectures: progress.totalLectures || 0,
    completedLecturesCount: progress.completedLecturesCount || 0,
    courseCompletionPercentage: progress.courseCompletionPercentage || 0,
    lastActivityTimestamp: progress.lastActivityTimestamp || progress.updatedAt || null,
    createdAt: progress.createdAt,
    updatedAt: progress.updatedAt
  } : {})
});

const loadProgress = async (userId, courseId) => {
  return StudentProgress.findOne({ userId, courseId });
};

const upsertProgress = async (userId, courseId, update, statsOverride = {}) => {
  const existing = await StudentProgress.findOne({ userId, courseId });
  const next = existing || new StudentProgress({ userId, courseId });
  Object.assign(next, update);

  const stats = await calculateCourseStats(courseId, next, statsOverride);
  next.totalLectures = stats.totalLectures;
  next.completedLecturesCount = stats.completedLecturesCount;
  next.courseCompletionPercentage = stats.courseCompletionPercentage;
  next.lastActivityTimestamp = new Date();

  await next.save();
  return next;
};

export const getAllProgress = asyncHandler(async (req, res) => {
  const progress = await StudentProgress.find({ userId: req.user._id }).sort({ updatedAt: -1 });
  res.json({ progress: progress.map(toClientProgress) });
});

export const getProgress = asyncHandler(async (req, res) => {
  const progress = await loadProgress(req.user._id, req.params.courseId);
  res.json({ progress: toClientProgress(progress) });
});

export const saveProgress = asyncHandler(async (req, res) => {
  const progress = await upsertProgress(req.user._id, req.params.courseId, {
    completedLectures: uniqueStrings(req.body.completedLectures),
    lastWatchedLecture: req.body.lastWatchedLecture || null,
    currentPlaybackTime: Number(req.body.currentPlaybackTime) || 0,
    watchPercentage: Number(req.body.watchPercentage) || 0,
    lectureProgress: req.body.lectureProgress || [],
    quizScores: req.body.quizScores || [],
    completedCodingChallenges: req.body.completedCodingChallenges || [],
    notes: req.body.notes || []
  }, req.body);

  res.json({ progress: toClientProgress(progress) });
});

export const updateProgress = asyncHandler(async (req, res) => {
  const progress = await upsertProgress(req.user._id, req.params.courseId, req.body || {}, req.body || {});
  res.json({ progress: toClientProgress(progress) });
});

export const markLectureComplete = asyncHandler(async (req, res) => {
  const lectureId = String(req.body.lectureId || '');
  const completed = req.body.completed !== false;

  const existing = await loadProgress(req.user._id, req.params.courseId);
  const completedLectures = completed
    ? uniqueStrings([...(existing?.completedLectures || []), lectureId])
    : uniqueStrings((existing?.completedLectures || []).filter((id) => String(id) !== lectureId));

  const lectureProgress = upsertEntry(existing?.lectureProgress || [], 'lectureId', lectureId, {
    lectureId,
    currentPlaybackTime: Number(req.body.currentPlaybackTime) || existing?.currentPlaybackTime || 0,
    watchPercentage: Number(req.body.watchPercentage) || existing?.watchPercentage || 0,
    completed,
    lastUpdatedAt: new Date()
  });

  const progress = await upsertProgress(req.user._id, req.params.courseId, {
    completedLectures,
    lastWatchedLecture: lectureId,
    currentPlaybackTime: Number(req.body.currentPlaybackTime) || existing?.currentPlaybackTime || 0,
    watchPercentage: Number(req.body.watchPercentage) || existing?.watchPercentage || 0,
    lectureProgress
  }, req.body);

  res.json({ progress: toClientProgress(progress) });
});

export const savePlaybackPosition = asyncHandler(async (req, res) => {
  const lectureId = String(req.body.lectureId || '');
  const currentPlaybackTime = Number(req.body.currentPlaybackTime) || 0;
  const watchPercentage = Number(req.body.watchPercentage) || 0;

  const existing = await loadProgress(req.user._id, req.params.courseId);
  const lectureProgress = upsertEntry(existing?.lectureProgress || [], 'lectureId', lectureId, {
    lectureId,
    currentPlaybackTime,
    watchPercentage,
    completed: Boolean(req.body.completed),
    lastUpdatedAt: new Date()
  });

  const progress = await upsertProgress(req.user._id, req.params.courseId, {
    lastWatchedLecture: lectureId,
    currentPlaybackTime,
    watchPercentage,
    lectureProgress
  }, req.body);

  res.json({ progress: toClientProgress(progress) });
});

export const saveNotes = asyncHandler(async (req, res) => {
  const lectureId = String(req.body.lectureId || '');
  const content = String(req.body.content || '');

  const existing = await loadProgress(req.user._id, req.params.courseId);
  const notes = upsertEntry(existing?.notes || [], 'lectureId', lectureId, {
    lectureId,
    content,
    updatedAt: new Date()
  });

  const progress = await upsertProgress(req.user._id, req.params.courseId, { notes }, req.body);
  res.json({ progress: toClientProgress(progress) });
});

export const saveQuizResults = asyncHandler(async (req, res) => {
  const quizId = String(req.body.quizId || '');
  const score = Number(req.body.score) || 0;
  const totalQuestions = Number(req.body.totalQuestions) || 0;
  const correctAnswers = Number(req.body.correctAnswers) || 0;
  const passed = Boolean(req.body.passed);
  const completionStatus = req.body.completionStatus || 'completed';

  const existing = await loadProgress(req.user._id, req.params.courseId);
  const quizScores = upsertEntry(existing?.quizScores || [], 'quizId', quizId, {
    quizId,
    score,
    totalQuestions,
    correctAnswers,
    passed,
    completionStatus,
    attemptDate: new Date()
  });

  const progress = await upsertProgress(req.user._id, req.params.courseId, { quizScores }, req.body);
  res.json({ progress: toClientProgress(progress) });
});

export const saveCodingChallengeStatus = asyncHandler(async (req, res) => {
  const challengeId = String(req.body.challengeId || '');
  const completed = Boolean(req.body.completed);
  const status = req.body.status || (completed ? 'completed' : 'pending');

  const existing = await loadProgress(req.user._id, req.params.courseId);
  const completedCodingChallenges = upsertEntry(existing?.completedCodingChallenges || [], 'challengeId', challengeId, {
    challengeId,
    completed,
    status,
    submissionDate: req.body.submissionDate ? new Date(req.body.submissionDate) : (completed ? new Date() : null)
  });

  const progress = await upsertProgress(req.user._id, req.params.courseId, { completedCodingChallenges }, req.body);
  res.json({ progress: toClientProgress(progress) });
});