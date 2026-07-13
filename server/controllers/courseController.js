import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import Quiz from '../models/Quiz.js';
import CodingChallenge from '../models/CodingChallenge.js';
import User from '../models/User.js';
import StudentProgress from '../models/StudentProgress.js';
import { seedCourses } from '../seed/initialData.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { removeMediaFromCloudinary } from '../services/mediaService.js';
import { seedDatabase } from '../services/dbSeedService.js';
import { ApiError } from '../utils/apiError.js';

const toFrontendCourse = (course) => ({
  id: course._id.toString(),
  code: course.code,
  name: course.courseName,
  description: course.description,
  instructor: course.instructor,
  duration: course.duration,
  lessonsCount: course.lessonsCount,
  thumbnail: course.thumbnailUrl,
  thumbnailPublicId: course.thumbnailPublicId,
  category: course.category,
  createdAt: course.createdAt,
  updatedAt: course.updatedAt
});

export const seedDefaultCourses = asyncHandler(async (_req, res) => {
  const existingCount = await Course.countDocuments();
  if (existingCount > 0) {
    return res.json({ message: 'Courses already seeded' });
  }

  await Course.insertMany(seedCourses);
  res.status(201).json({ message: 'Default courses seeded successfully' });
});

export const getCourses = asyncHandler(async (_req, res) => {
  const courses = await Course.find().sort({ createdAt: -1 });
  res.json({ courses: courses.map(toFrontendCourse) });
});

export const createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create({
    code: req.body.code,
    courseName: req.body.courseName || req.body.name,
    description: req.body.description,
    category: req.body.category,
    thumbnailUrl: req.body.thumbnailUrl || req.body.thumbnail || '',
    thumbnailPublicId: req.body.thumbnailPublicId || '',
    instructor: req.body.instructor,
    duration: req.body.duration,
    lessonsCount: req.body.lessonsCount ?? 0
  });
  res.status(201).json({ course: toFrontendCourse(course) });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const existingCourse = await Course.findById(req.params.id);
  const updates = {
    code: req.body.code,
    courseName: req.body.courseName || req.body.name,
    description: req.body.description,
    category: req.body.category,
    thumbnailUrl: req.body.thumbnailUrl || req.body.thumbnail,
    thumbnailPublicId: req.body.thumbnailPublicId,
    instructor: req.body.instructor,
    duration: req.body.duration,
    lessonsCount: req.body.lessonsCount
  };

  if (
    existingCourse &&
    existingCourse.thumbnailPublicId &&
    updates.thumbnailUrl &&
    updates.thumbnailUrl !== existingCourse.thumbnailUrl
  ) {
    await removeMediaFromCloudinary(existingCourse.thumbnailPublicId, 'image');
  }

  const course = await Course.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.json({ course: toFrontendCourse(course) });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  const lectures = await Lecture.find({ courseId: req.params.id });

  await Promise.all(
    lectures.map(async (lecture) => {
      await removeMediaFromCloudinary(lecture.videoPublicId, 'video');
      await removeMediaFromCloudinary(lecture.thumbnailPublicId, 'image');
    })
  );

  await removeMediaFromCloudinary(course?.thumbnailPublicId, 'image');
  await Lecture.deleteMany({ courseId: req.params.id });
  await Course.findByIdAndDelete(req.params.id);
  res.json({ message: 'Course deleted successfully' });
});

export const resetAllDatabases = asyncHandler(async (_req, res) => {
  // Disable resets in production unless explicitly allowed by environment override
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_RESET_IN_PRODUCTION !== 'true') {
    throw new ApiError(403, 'Database resets are disabled in production environment');
  }

  // Wipe all main LMS data
  await Promise.all([
    Course.deleteMany({}),
    Lecture.deleteMany({}),
    Quiz.deleteMany({}),
    CodingChallenge.deleteMany({}),
    StudentProgress.deleteMany({}),
    User.deleteMany({})
  ]);

  // Seed default dataset back
  await seedDatabase();

  res.json({ message: 'All databases reset and re-seeded successfully' });
});