import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { ApiError } from '../utils/apiError.js';

// Ensure temp_uploads directory exists in workspace
const tempDir = './temp_uploads';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const imageFileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Only JPG, PNG, WEBP, and GIF images are allowed'));
  }
  cb(null, true);
};

const videoFileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Only MP4, WEBM, MOV, and MKV videos are allowed'));
  }
  cb(null, true);
};

export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for thumbnails
}).single('file');

export const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 150 * 1024 * 1024 } // 150MB limit for video lectures
}).single('file');