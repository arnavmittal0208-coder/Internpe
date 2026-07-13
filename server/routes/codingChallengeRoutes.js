import express from 'express';
import { createCodingChallenge, deleteCodingChallenge, getAllCodingChallenges, getCodingChallengesByCourse, updateCodingChallenge } from '../controllers/codingChallengeController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllCodingChallenges);
router.get('/course/:courseId', getCodingChallengesByCourse);
router.post('/', protect, authorizeRoles('Admin'), createCodingChallenge);
router.put('/:id', protect, authorizeRoles('Admin'), updateCodingChallenge);
router.delete('/:id', protect, authorizeRoles('Admin'), deleteCodingChallenge);

export default router;