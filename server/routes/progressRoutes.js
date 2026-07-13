import express from 'express';
import {
	getAllProgress,
	getProgress,
	markLectureComplete,
	saveCodingChallengeStatus,
	saveNotes,
	savePlaybackPosition,
	saveProgress,
	saveQuizResults,
	updateProgress
} from '../controllers/progressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllProgress);
router.get('/course/:courseId', protect, getProgress);
router.put('/course/:courseId', protect, saveProgress);
router.patch('/course/:courseId', protect, updateProgress);
router.post('/course/:courseId/lecture-complete', protect, markLectureComplete);
router.post('/course/:courseId/playback', protect, savePlaybackPosition);
router.post('/course/:courseId/notes', protect, saveNotes);
router.post('/course/:courseId/quiz-results', protect, saveQuizResults);
router.post('/course/:courseId/challenge-status', protect, saveCodingChallengeStatus);

export default router;