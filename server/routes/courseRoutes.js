import express from 'express';
import { createCourse, deleteCourse, getCourses, resetAllDatabases, seedDefaultCourses, updateCourse } from '../controllers/courseController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/seed', seedDefaultCourses);
router.post('/reset', protect, authorizeRoles('Admin'), resetAllDatabases);
router.get('/', getCourses);
router.post('/', protect, authorizeRoles('Admin'), createCourse);
router.put('/:id', protect, authorizeRoles('Admin'), updateCourse);
router.delete('/:id', protect, authorizeRoles('Admin'), deleteCourse);

export default router;