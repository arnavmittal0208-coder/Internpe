import express from 'express';
import { createQuiz, deleteQuiz, getAllQuizzes, getQuizzesByCourse, updateQuiz } from '../controllers/quizController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllQuizzes);
router.get('/course/:courseId', getQuizzesByCourse);
router.post('/', protect, authorizeRoles('Admin'), createQuiz);
router.put('/:id', protect, authorizeRoles('Admin'), updateQuiz);
router.delete('/:id', protect, authorizeRoles('Admin'), deleteQuiz);

export default router;