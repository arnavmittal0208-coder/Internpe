import express from 'express';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';
import { uploadImage, uploadVideo } from '../middleware/uploadMiddleware.js';
import { uploadCourseThumbnail, uploadLectureVideo } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/image', protect, authorizeRoles('Admin'), uploadImage, uploadCourseThumbnail);
router.post('/video', protect, authorizeRoles('Admin'), uploadVideo, uploadLectureVideo);

export default router;