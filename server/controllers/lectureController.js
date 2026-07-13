import Lecture from '../models/Lecture.js';
import Course from '../models/Course.js';
import { seedLectures } from '../seed/initialData.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { removeMediaFromCloudinary } from '../services/mediaService.js';

const toFrontendLecture = (lecture) => ({
  id: lecture._id.toString(),
  courseId: lecture.courseId.toString(),
  index: lecture.lectureNumber,
  title: lecture.title,
  duration: lecture.duration,
  description: lecture.description,
  url: lecture.videoUrl,
  thumbnail: lecture.thumbnailUrl,
  videoPublicId: lecture.videoPublicId,
  thumbnailPublicId: lecture.thumbnailPublicId,
  courseTitle: lecture.courseTitle,
  createdAt: lecture.createdAt,
  updatedAt: lecture.updatedAt
});

export const seedDefaultLectures = asyncHandler(async (_req, res) => {
  const existingCount = await Lecture.countDocuments();
  if (existingCount > 0) {
    return res.json({ message: 'Lectures already seeded' });
  }

  const courses = await Course.find();
  const courseByCode = new Map(courses.map((course) => [course.code, course]));

  const lectureDocuments = seedLectures
    .map((lecture) => {
      const matchedCourse = courseByCode.get(lecture.courseCode);
      if (!matchedCourse) {
        return null;
      }

      return {
        courseId: matchedCourse._id,
        lectureNumber: lecture.lectureNumber,
        title: lecture.title,
        description: lecture.description,
        videoUrl: lecture.videoUrl,
        videoPublicId: lecture.videoPublicId || '',
        thumbnailUrl: lecture.thumbnailUrl || '',
        thumbnailPublicId: lecture.thumbnailPublicId || '',
        courseTitle: lecture.courseTitle || matchedCourse.courseName,
        duration: lecture.duration
      };
    })
    .filter(Boolean);

  await Lecture.insertMany(lectureDocuments);

  const lessonCounts = lectureDocuments.reduce((counts, lecture) => {
    const currentCount = counts.get(String(lecture.courseId)) || 0;
    counts.set(String(lecture.courseId), currentCount + 1);
    return counts;
  }, new Map());

  await Promise.all(
    courses.map((course) =>
      Course.findByIdAndUpdate(course._id, {
        lessonsCount: lessonCounts.get(String(course._id)) || 0
      })
    )
  );

  res.status(201).json({ message: 'Default lectures seeded successfully' });
});

export const getAllLectures = asyncHandler(async (_req, res) => {
  const lectures = await Lecture.find().sort({ lectureNumber: 1, createdAt: 1 });
  res.json({ lectures: lectures.map(toFrontendLecture) });
});

export const getLecturesByCourse = asyncHandler(async (req, res) => {
  const lectures = await Lecture.find({ courseId: req.params.courseId }).sort({ lectureNumber: 1 });
  res.json({ lectures: lectures.map(toFrontendLecture) });
});

export const createLecture = asyncHandler(async (req, res) => {
  console.log('[LECTURE CONTROLLER] Creating new lecture record in MongoDB...');
  console.log(`[LECTURE CONTROLLER] Body Payload: ${JSON.stringify(req.body)}`);
  
  const lecture = await Lecture.create({
    courseId: req.body.courseId,
    lectureNumber: req.body.lectureNumber ?? req.body.index,
    title: req.body.title,
    description: req.body.description,
    videoUrl: req.body.videoUrl || req.body.url,
    thumbnailUrl: req.body.thumbnailUrl || req.body.thumbnail || '',
    videoPublicId: req.body.videoPublicId || '',
    thumbnailPublicId: req.body.thumbnailPublicId || '',
    courseTitle: req.body.courseTitle || '',
    duration: req.body.duration || ''
  });

  console.log(`[LECTURE CONTROLLER] MongoDB document created successfully: ID=${lecture._id}, VideoUrl=${lecture.videoUrl}, Duration=${lecture.duration}`);

  await Course.findByIdAndUpdate(req.body.courseId, { $inc: { lessonsCount: 1 } });

  res.status(201).json({ lecture: toFrontendLecture(lecture) });
});

export const updateLecture = asyncHandler(async (req, res) => {
  console.log(`[LECTURE CONTROLLER] Updating lecture ID=${req.params.id} in MongoDB...`);
  console.log(`[LECTURE CONTROLLER] Body Payload: ${JSON.stringify(req.body)}`);

  const existingLecture = await Lecture.findById(req.params.id);
  const lecture = await Lecture.findByIdAndUpdate(
    req.params.id,
    {
      lectureNumber: req.body.lectureNumber ?? req.body.index,
      title: req.body.title,
      description: req.body.description,
      videoUrl: req.body.videoUrl || req.body.url,
      thumbnailUrl: req.body.thumbnailUrl || req.body.thumbnail,
      videoPublicId: req.body.videoPublicId,
      thumbnailPublicId: req.body.thumbnailPublicId,
      courseTitle: req.body.courseTitle,
      duration: req.body.duration
    },
    { new: true, runValidators: true }
  );

  console.log(`[LECTURE CONTROLLER] MongoDB document updated successfully: ID=${lecture._id}, VideoUrl=${lecture.videoUrl}, Duration=${lecture.duration}`);

  if (existingLecture) {
    if (
      existingLecture.videoPublicId &&
      req.body.videoUrl &&
      req.body.videoUrl !== existingLecture.videoUrl
    ) {
      console.log(`[LECTURE CONTROLLER] Replacing existing Cloudinary video: PublicID=${existingLecture.videoPublicId}`);
      await removeMediaFromCloudinary(existingLecture.videoPublicId, 'video');
    }
    if (
      existingLecture.thumbnailPublicId &&
      req.body.thumbnailUrl &&
      req.body.thumbnailUrl !== existingLecture.thumbnailUrl
    ) {
      console.log(`[LECTURE CONTROLLER] Replacing existing Cloudinary thumbnail: PublicID=${existingLecture.thumbnailPublicId}`);
      await removeMediaFromCloudinary(existingLecture.thumbnailPublicId, 'image');
    }
  }

  res.json({ lecture: toFrontendLecture(lecture) });
});

export const deleteLecture = asyncHandler(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (lecture) {
    await removeMediaFromCloudinary(lecture.videoPublicId, 'video');
    await removeMediaFromCloudinary(lecture.thumbnailPublicId, 'image');
    await Course.findByIdAndUpdate(lecture.courseId, { $inc: { lessonsCount: -1 } });
  }

  await Lecture.findByIdAndDelete(req.params.id);
  res.json({ message: 'Lecture deleted successfully' });
});