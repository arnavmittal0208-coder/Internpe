import User from '../models/User.js';
import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import Quiz from '../models/Quiz.js';
import CodingChallenge from '../models/CodingChallenge.js';
import { seedCourses, seedLectures, seedQuizzes, seedCodingChallenges } from '../seed/initialData.js';

const createUserIfMissing = async ({ name, email, password, role }) => {
  if (!name || !email || !password) {
    return null;
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return existingUser;
  }
  return User.create({ name, email, password, role });
};

export const seedDatabase = async () => {
  console.log('Starting database seeding check...');

  // 1. Seed Users
  await createUserIfMissing({
    name: process.env.ADMIN_NAME || 'Internpe Admin',
    email: process.env.ADMIN_EMAIL || 'admin@internpe.local',
    password: process.env.ADMIN_PASSWORD || 'admin',
    role: 'Admin'
  });

  await createUserIfMissing({
    name: process.env.STUDENT_NAME || 'Internpe Student',
    email: process.env.STUDENT_EMAIL || 'student@internpe.local',
    password: process.env.STUDENT_PASSWORD || 'student',
    role: 'Student'
  });

  // 2. Seed Courses
  const courseCount = await Course.countDocuments();
  if (courseCount === 0) {
    console.log('Seeding default courses...');
    await Course.insertMany(seedCourses);
  }

  // Fetch all courses to map code to ObjectId
  const courses = await Course.find();
  const courseByCode = new Map(courses.map((c) => [c.code, c]));

  // 3. Seed Lectures
  const lectureCount = await Lecture.countDocuments();
  if (lectureCount === 0) {
    console.log('Seeding default lectures...');
    const lectureDocs = seedLectures.map((lecture) => {
      const matchedCourse = courseByCode.get(lecture.courseCode);
      if (!matchedCourse) return null;
      return {
        courseId: matchedCourse._id,
        lectureNumber: lecture.lectureNumber,
        title: lecture.title,
        description: lecture.description,
        videoUrl: lecture.videoUrl,
        videoPublicId: '',
        thumbnailUrl: lecture.thumbnailUrl || '',
        thumbnailPublicId: '',
        courseTitle: lecture.courseTitle || matchedCourse.courseName,
        duration: lecture.duration
      };
    }).filter(Boolean);

    if (lectureDocs.length > 0) {
      await Lecture.insertMany(lectureDocs);

      // Recalculating lesson counts
      const countsMap = new Map();
      lectureDocs.forEach((l) => {
        const cid = String(l.courseId);
        countsMap.set(cid, (countsMap.get(cid) || 0) + 1);
      });

      await Promise.all(
        courses.map((course) =>
          Course.findByIdAndUpdate(course._id, {
            lessonsCount: countsMap.get(String(course._id)) || 0
          })
        )
      );
    }
  }

  // 4. Seed Quizzes
  const quizCount = await Quiz.countDocuments();
  if (quizCount === 0) {
    console.log('Seeding default quizzes...');
    const quizDocs = seedQuizzes.map((quiz) => {
      const matchedCourse = courseByCode.get(quiz.courseCode);
      if (!matchedCourse) return null;
      return {
        courseId: matchedCourse._id,
        quizTitle: quiz.quizTitle,
        description: quiz.description,
        timer: quiz.timer,
        marks: quiz.marks,
        questions: quiz.questions
      };
    }).filter(Boolean);

    if (quizDocs.length > 0) {
      await Quiz.insertMany(quizDocs);
    }
  }

  // 5. Seed Coding Challenges
  const challengeCount = await CodingChallenge.countDocuments();
  if (challengeCount === 0) {
    console.log('Seeding default coding challenges...');
    const challengeDocs = seedCodingChallenges.map((challenge) => {
      const matchedCourse = courseByCode.get(challenge.courseCode);
      if (!matchedCourse) return null;
      return {
        courseId: matchedCourse._id,
        title: challenge.title,
        description: challenge.description,
        difficulty: challenge.difficulty,
        leetcodeUrl: challenge.leetcodeUrl,
        tags: challenge.tags
      };
    }).filter(Boolean);

    if (challengeDocs.length > 0) {
      await CodingChallenge.insertMany(challengeDocs);
    }
  }

  console.log('Database seeding check complete.');
};
