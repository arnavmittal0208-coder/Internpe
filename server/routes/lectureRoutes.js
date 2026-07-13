import express from 'express';
import { createLecture, deleteLecture, getAllLectures, getLecturesByCourse, seedDefaultLectures, updateLecture } from '../controllers/lectureController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/seed', seedDefaultLectures);
router.get('/', getAllLectures);
router.get('/course/:courseId', getLecturesByCourse);
router.post('/', protect, authorizeRoles('Admin'), createLecture);
router.put('/:id', protect, authorizeRoles('Admin'), updateLecture);
router.delete('/:id', protect, authorizeRoles('Admin'), deleteLecture);

export default router;