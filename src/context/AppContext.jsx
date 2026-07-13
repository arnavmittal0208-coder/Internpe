import React, { createContext, useContext, useEffect, useState } from 'react';
import { deleteVideo, clearAllVideos } from '../utils/db';
import { AuthContext } from './AuthContext';

export const AppContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const createInitialProgress = () => ({
  completedLectures: [], // array of lectureIds
  completedTasks: [],    // array of taskIds
  completedCodingChallenges: [],
  quizScores: {},        // { quizId: { score, totalQuestions, passed, completedAt } }
  activeLectureId: {},    // { courseId: lectureId }
  notesByLecture: {},
  lectureProgressByLecture: {},
  courseProgressByCourse: {},
  lastActivityTimestamp: null
});

export const AppProvider = ({ children }) => {
  const { token, user, loading: authLoading, isAuthenticated } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [codingTasks, setCodingTasks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [studentProgress, setStudentProgress] = useState(() => createInitialProgress());
  const [isHydrated, setIsHydrated] = useState(false);

  const uniqueStrings = (values) => [...new Set((values || []).filter(Boolean).map(String))];

  const mergeProgressRecord = (previous, record) => {
    if (!record) {
      return previous;
    }

    const courseId = String(record.courseId);
    const nextLectureProgressByLecture = { ...(previous.lectureProgressByLecture || {}) };
    const nextNotesByLecture = { ...(previous.notesByLecture || {}) };
    const nextQuizScores = { ...(previous.quizScores || {}) };
    const nextActiveLectureId = { ...(previous.activeLectureId || {}) };
    const nextCourseProgressByCourse = { ...(previous.courseProgressByCourse || {}) };

    (record.lectureProgress || []).forEach((item) => {
      nextLectureProgressByLecture[item.lectureId] = item;
    });

    (record.notes || []).forEach((item) => {
      nextNotesByLecture[item.lectureId] = item.content || '';
    });

    (record.quizScores || []).forEach((item) => {
      nextQuizScores[item.quizId] = item;
    });

    const completedCodingChallenges = uniqueStrings([
      ...(previous.completedCodingChallenges || []),
      ...((record.completedCodingChallenges || []).filter((item) => item?.status === 'completed').map((item) => item.challengeId))
    ]);

    const completedLectures = uniqueStrings([
      ...(previous.completedLectures || []),
      ...(record.completedLectures || [])
    ]);

    nextActiveLectureId[courseId] = record.lastWatchedLecture || nextActiveLectureId[courseId] || '';
    nextCourseProgressByCourse[courseId] = record;

    return {
      ...previous,
      completedLectures,
      completedTasks: completedCodingChallenges,
      completedCodingChallenges,
      quizScores: nextQuizScores,
      activeLectureId: nextActiveLectureId,
      notesByLecture: nextNotesByLecture,
      lectureProgressByLecture: nextLectureProgressByLecture,
      courseProgressByCourse: nextCourseProgressByCourse,
      lastActivityTimestamp: record.lastActivityTimestamp || previous.lastActivityTimestamp || null
    };
  };

  const mergeProgressSnapshot = (records) => {
    return (records || []).reduce((accumulator, record) => mergeProgressRecord(accumulator, record), createInitialProgress());
  };

  const mapCourseFromApi = (course) => ({
    id: course.id,
    code: course.code,
    name: course.name,
    description: course.description,
    instructor: course.instructor,
    duration: course.duration,
    lessonsCount: course.lessonsCount,
    thumbnail: course.thumbnail,
    thumbnailPublicId: course.thumbnailPublicId || '',
    category: course.category
  });

  const mapLectureFromApi = (lecture) => ({
    id: lecture.id,
    courseId: lecture.courseId,
    index: lecture.index,
    title: lecture.title,
    duration: lecture.duration,
    description: lecture.description,
    url: lecture.url,
    thumbnail: lecture.thumbnail || '',
    videoPublicId: lecture.videoPublicId || '',
    thumbnailPublicId: lecture.thumbnailPublicId || '',
    courseTitle: lecture.courseTitle || ''
  });

  const mapQuizFromApi = (quiz) => ({
    id: quiz.id,
    courseId: quiz.courseId,
    title: quiz.title,
    description: quiz.description,
    timeLimit: quiz.timeLimit,
    marks: quiz.marks,
    questions: (quiz.questions || []).map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options || [],
      correctIndex: q.correctIndex,
      explanation: q.explanation || '',
      marks: q.marks
    }))
  });

  const mapCodingChallengeFromApi = (challenge) => ({
    id: challenge.id,
    courseId: challenge.courseId,
    title: challenge.title,
    description: challenge.description,
    difficulty: challenge.difficulty,
    link: challenge.link,
    tags: challenge.tags || ''
  });

  const fetchJson = async (path, options = {}) => {
    const token = sessionStorage.getItem('internpe_auth_token');
    const mergedHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: mergedHeaders,
      ...options
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  };

  useEffect(() => {
    const loadCoreData = async () => {
      try {
        const [coursesResponse, lecturesResponse, quizzesResponse, challengesResponse] = await Promise.all([
          fetchJson('/courses'),
          fetchJson('/lectures').catch(async () => ({ lectures: [] })),
          fetchJson('/quizzes').catch(async () => ({ quizzes: [] })),
          fetchJson('/coding-challenges').catch(async () => ({ codingChallenges: [] }))
        ]);

        setCourses((coursesResponse.courses || []).map(mapCourseFromApi));
        setLectures((lecturesResponse.lectures || []).map(mapLectureFromApi));
        setQuizzes((quizzesResponse.quizzes || []).map(mapQuizFromApi));
        setCodingTasks((challengesResponse.codingChallenges || []).map(mapCodingChallengeFromApi));
      } catch (error) {
        console.error('Failed to load core course data from API:', error);
        setCourses([]);
        setLectures([]);
        setCodingTasks([]);
        setQuizzes([]);
      } finally {
        setIsHydrated(true);
      }
    };

    loadCoreData();
  }, []);

  useEffect(() => {
    if (authLoading || !isHydrated) {
      return;
    }

    if (!isAuthenticated || !user) {
      setStudentProgress(createInitialProgress());
      return;
    }

    const loadStudentProgress = async () => {
      try {
        const response = await fetchJson('/progress');
        setStudentProgress(mergeProgressSnapshot(response.progress || []));
      } catch (error) {
        console.error('Failed to load student progress from API:', error);
        setStudentProgress(createInitialProgress());
      }
    };

    loadStudentProgress();
  }, [authLoading, isAuthenticated, isHydrated, user?.id]);

  // Reset function to revert back to default state
  const resetToSeeds = async () => {
    try {
      await fetchJson('/courses/reset', { method: 'POST' });
      try {
        await clearAllVideos();
      } catch (err) {
        console.error('Failed to clear IndexedDB videos:', err);
      }
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset backend database:', error);
      alert('Failed to reset database: ' + error.message);
    }
  };

  const syncProgressRecord = (progressRecord) => {
    setStudentProgress((previous) => mergeProgressRecord(previous, progressRecord));
  };

  const getCourseProgressSnapshot = (courseId) => {
    const courseLectures = lectures.filter((lecture) => lecture.courseId === courseId);
    const courseTasks = codingTasks.filter((task) => task.courseId === courseId);
    const courseQuizzes = quizzes.filter((quiz) => quiz.courseId === courseId);

    const completedLecturesCount = courseLectures.filter((lecture) => studentProgress.completedLectures.includes(lecture.id)).length;
    const completedTasksCount = courseTasks.filter((task) => studentProgress.completedTasks.includes(task.id)).length;
    const completedQuizzesCount = courseQuizzes.filter((quiz) => studentProgress.quizScores[quiz.id]?.passed).length;

    const totalItems = courseLectures.length + courseTasks.length + courseQuizzes.length;
    const completedItems = completedLecturesCount + completedTasksCount + completedQuizzesCount;

    return {
      totalLectures: courseLectures.length,
      completedLecturesCount,
      courseCompletionPercentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    };
  };

  const updateProgressOnServer = async (courseId, endpoint = '', payload = {}, method = 'POST') => {
    const courseSnapshot = getCourseProgressSnapshot(courseId);
    const response = await fetchJson(`/progress/course/${courseId}${endpoint}`, {
      method,
      body: JSON.stringify({
        ...payload,
        ...courseSnapshot
      })
    });

    syncProgressRecord(response.progress);
    return response.progress;
  };

  // Course Management APIs
  const addCourse = async (course) => {
    const payload = {
      code: course.code,
      courseName: course.name,
      description: course.description,
      category: course.category,
      thumbnailUrl: course.thumbnail,
      thumbnailPublicId: course.thumbnailPublicId || '',
      instructor: course.instructor,
      duration: course.duration,
      lessonsCount: course.lessonsCount ?? 0
    };

    const response = await fetchJson('/courses', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setCourses((prev) => [mapCourseFromApi(response.course), ...prev]);
    return response.course;
  };

  const updateCourse = async (courseId, updatedFields) => {
    const payload = {
      code: updatedFields.code,
      courseName: updatedFields.name || updatedFields.courseName,
      description: updatedFields.description,
      category: updatedFields.category,
      thumbnailUrl: updatedFields.thumbnail,
      thumbnailPublicId: updatedFields.thumbnailPublicId || '',
      instructor: updatedFields.instructor,
      duration: updatedFields.duration,
      lessonsCount: updatedFields.lessonsCount
    };

    const response = await fetchJson(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    setCourses((prev) => prev.map((course) => (course.id === courseId ? mapCourseFromApi(response.course) : course)));
    return response.course;
  };

  const deleteCourse = async (courseId) => {
    // Clean up local IndexedDB videos
    const courseLecs = lectures.filter((l) => l.courseId === courseId);
    courseLecs.forEach((l) => {
      deleteVideo(l.id);
    });

    await fetchJson(`/courses/${courseId}`, { method: 'DELETE' });

    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    // clean up lectures, quizzes, codingTasks
    setLectures((prev) => prev.filter((l) => l.courseId !== courseId));
    setCodingTasks((prev) => prev.filter((t) => t.courseId !== courseId));
    setQuizzes((prev) => prev.filter((q) => q.courseId !== courseId));
  };

  // Lecture / Video APIs
  const addLecture = async (lecture) => {
    const payload = {
      courseId: lecture.courseId,
      lectureNumber: lecture.index,
      title: lecture.title,
      description: lecture.description,
      videoUrl: lecture.url,
      thumbnailUrl: lecture.thumbnail || '',
      videoPublicId: lecture.videoPublicId || '',
      thumbnailPublicId: lecture.thumbnailPublicId || '',
      courseTitle: lecture.courseTitle || '',
      duration: lecture.duration || ''
    };

    const response = await fetchJson('/lectures', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setLectures((prev) => [...prev, mapLectureFromApi(response.lecture)]);
    setTimeout(() => {
      setCourses((prev) =>
        prev.map((c) => (c.id === lecture.courseId ? { ...c, lessonsCount: c.lessonsCount + 1 } : c))
      );
    }, 0);
    return response.lecture;
  };

  const updateLecture = async (lectureId, updatedFields) => {
    const payload = {
      lectureNumber: updatedFields.index,
      title: updatedFields.title,
      description: updatedFields.description,
      videoUrl: updatedFields.url,
      thumbnailUrl: updatedFields.thumbnail || '',
      videoPublicId: updatedFields.videoPublicId || '',
      thumbnailPublicId: updatedFields.thumbnailPublicId || '',
      courseTitle: updatedFields.courseTitle || '',
      duration: updatedFields.duration || ''
    };

    const response = await fetchJson(`/lectures/${lectureId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    setLectures((prev) => prev.map((lecture) => (lecture.id === lectureId ? mapLectureFromApi(response.lecture) : lecture)));
    return response.lecture;
  };

  const deleteLecture = async (lectureId) => {
    // Clean up local IndexedDB video if present
    deleteVideo(lectureId);

    await fetchJson(`/lectures/${lectureId}`, { method: 'DELETE' });

    setLectures((prevLectures) => {
      const deletedLec = prevLectures.find((item) => item.id === lectureId);
      if (deletedLec) {
        setTimeout(() => {
          setCourses((prevCourses) =>
            prevCourses.map((c) => (c.id === deletedLec.courseId ? { ...c, lessonsCount: Math.max(0, c.lessonsCount - 1) } : c))
          );
        }, 0);
      }
      return prevLectures.filter((item) => item.id !== lectureId);
    });

    // clean from progress
    setStudentProgress((prev) => ({
      ...prev,
      completedLectures: prev.completedLectures.filter((id) => id !== lectureId),
      lectureProgressByLecture: Object.fromEntries(Object.entries(prev.lectureProgressByLecture || {}).filter(([key]) => key !== lectureId)),
      notesByLecture: Object.fromEntries(Object.entries(prev.notesByLecture || {}).filter(([key]) => key !== lectureId)),
      activeLectureId: Object.fromEntries(Object.entries(prev.activeLectureId || {}).map(([key, value]) => [key, value === lectureId ? '' : value]))
    }));
  };

  const updateLessonsCount = (cId, allLectures) => {
    const count = allLectures.filter((l) => l.courseId === cId).length;
    setCourses((prev) =>
      prev.map((c) => (c.id === cId ? { ...c, lessonsCount: count } : c))
    );
  };

  // Coding Tasks APIs
  const addCodingTask = async (task) => {
    const payload = {
      courseId: task.courseId,
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      leetcodeUrl: task.leetcodeUrl || task.link,
      tags: task.tags || ''
    };
    const response = await fetchJson('/coding-challenges', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setCodingTasks((prev) => [...prev, mapCodingChallengeFromApi(response.codingChallenge)]);
    return response.codingChallenge;
  };

  const updateCodingTask = async (taskId, updatedFields) => {
    const payload = {
      courseId: updatedFields.courseId,
      title: updatedFields.title,
      description: updatedFields.description,
      difficulty: updatedFields.difficulty,
      leetcodeUrl: updatedFields.leetcodeUrl || updatedFields.link,
      tags: updatedFields.tags || ''
    };
    const response = await fetchJson(`/coding-challenges/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    setCodingTasks((prev) =>
      prev.map((t) => (t.id === taskId ? mapCodingChallengeFromApi(response.codingChallenge) : t))
    );
    return response.codingChallenge;
  };

  const deleteCodingTask = async (taskId) => {
    await fetchJson(`/coding-challenges/${taskId}`, { method: 'DELETE' });
    setCodingTasks((prev) => prev.filter((t) => t.id !== taskId));
    setStudentProgress((prev) => ({
      ...prev,
      completedTasks: prev.completedTasks.filter((id) => id !== taskId),
      completedCodingChallenges: prev.completedCodingChallenges.filter((id) => id !== taskId)
    }));
  };

  // Quizzes APIs
  const addQuiz = async (quiz) => {
    const payload = {
      courseId: quiz.courseId,
      quizTitle: quiz.title,
      description: quiz.description,
      timer: quiz.timer !== undefined ? quiz.timer : quiz.timeLimit,
      marks: quiz.marks,
      questions: (quiz.questions || []).map((q) => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : q.correctIndex,
        explanation: q.explanation || '',
        marks: q.marks
      }))
    };
    const response = await fetchJson('/quizzes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setQuizzes((prev) => [...prev, mapQuizFromApi(response.quiz)]);
    return response.quiz;
  };

  const updateQuiz = async (quizId, updatedFields) => {
    const payload = {
      courseId: updatedFields.courseId,
      quizTitle: updatedFields.quizTitle || updatedFields.title,
      description: updatedFields.description,
      timer: updatedFields.timer !== undefined ? updatedFields.timer : updatedFields.timeLimit,
      marks: updatedFields.marks,
      questions: (updatedFields.questions || []).map((q) => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : q.correctIndex,
        explanation: q.explanation || '',
        marks: q.marks
      }))
    };
    const response = await fetchJson(`/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? mapQuizFromApi(response.quiz) : q))
    );
    return response.quiz;
  };

  const deleteQuiz = async (quizId) => {
    await fetchJson(`/quizzes/${quizId}`, { method: 'DELETE' });
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    setStudentProgress((prev) => {
      const scores = { ...prev.quizScores };
      delete scores[quizId];
      return { ...prev, quizScores: scores };
    });
  };

  // Student Progress APIs
  const toggleLectureCompleted = async (lectureId, courseIdOverride = '', progressSnapshot = {}) => {
    const courseId = courseIdOverride || lectures.find((lecture) => lecture.id === lectureId)?.courseId;
    if (!courseId) {
      return;
    }

    const isCompleted = studentProgress.completedLectures.includes(lectureId);
    const currentPlaybackTime = progressSnapshot.currentPlaybackTime ?? studentProgress.lectureProgressByLecture[lectureId]?.currentPlaybackTime ?? 0;
    const watchPercentage = progressSnapshot.watchPercentage ?? studentProgress.lectureProgressByLecture[lectureId]?.watchPercentage ?? 0;
    const responseProgress = await updateProgressOnServer(courseId, '/lecture-complete', {
      lectureId,
      completed: !isCompleted,
      currentPlaybackTime,
      watchPercentage
    });

    return responseProgress;
  };

  const toggleTaskCompleted = async (taskId) => {
    const courseId = codingTasks.find((task) => task.id === taskId)?.courseId;
    if (!courseId) {
      return;
    }

    const isCompleted = studentProgress.completedTasks.includes(taskId);
    await updateProgressOnServer(courseId, '/challenge-status', {
      challengeId: taskId,
      completed: !isCompleted,
      status: !isCompleted ? 'completed' : 'pending',
      submissionDate: !isCompleted ? new Date().toISOString() : null
    });
  };

  const submitQuizScore = async (quizId, score, totalQuestions, passed, correctAnswers = 0) => {
    const courseId = quizzes.find((quiz) => quiz.id === quizId)?.courseId;
    if (!courseId) {
      return;
    }

    await updateProgressOnServer(courseId, '/quiz-results', {
      quizId,
      score,
      totalQuestions,
      correctAnswers,
      passed,
      completionStatus: passed ? 'completed' : 'failed'
    });
  };

  const setActiveLecture = async (courseId, lectureId) => {
    setStudentProgress((prev) => ({
      ...prev,
      activeLectureId: {
        ...prev.activeLectureId,
        [courseId]: lectureId
      }
    }));

    const currentPlaybackTime = studentProgress.lectureProgressByLecture[lectureId]?.currentPlaybackTime || 0;
    const watchPercentage = studentProgress.lectureProgressByLecture[lectureId]?.watchPercentage || 0;

    try {
      await updateProgressOnServer(courseId, '/playback', {
        lectureId,
        currentPlaybackTime,
        watchPercentage
      });
    } catch (error) {
      console.error('Failed to sync active lecture to progress API:', error);
    }
  };

  const saveLecturePlayback = async (courseId, lectureId, currentPlaybackTime, watchPercentage, completed = false) => {
    const responseProgress = await updateProgressOnServer(courseId, '/playback', {
      lectureId,
      currentPlaybackTime,
      watchPercentage,
      completed
    });

    if (currentPlaybackTime === 0 && watchPercentage === 0) {
      return responseProgress;
    }

    return responseProgress;
  };

  const saveLectureNotes = async (courseId, lectureId, content) => {
    return updateProgressOnServer(courseId, '/notes', {
      lectureId,
      content
    });
  };

  const saveProgressSnapshot = async (courseId) => {
    const snapshot = getCourseProgressSnapshot(courseId);
    return updateProgressOnServer(courseId, '', snapshot, 'PATCH');
  };

  return (
    <AppContext.Provider
      value={{
        courses,
        lectures,
        codingTasks,
        quizzes,
        isHydrated,
        studentProgress,
        addCourse,
        updateCourse,
        deleteCourse,
        addLecture,
        updateLecture,
        deleteLecture,
        addCodingTask,
        updateCodingTask,
        deleteCodingTask,
        addQuiz,
        updateQuiz,
        deleteQuiz,
        toggleLectureCompleted,
        toggleTaskCompleted,
        submitQuizScore,
        setActiveLecture,
        saveLecturePlayback,
        saveLectureNotes,
        saveProgressSnapshot,
        resetToSeeds
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
