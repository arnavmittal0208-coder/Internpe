import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { uploadImageToCloudinary, uploadVideoToCloudinary } from '../services/mediaService.js';

const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const totalSeconds = Math.round(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const buildMediaResponse = (result) => ({
  url: result.secure_url,
  secureUrl: result.secure_url,
  publicId: result.public_id,
  resourceType: result.resource_type,
  format: result.format,
  bytes: result.bytes,
  duration: result.duration ? formatDuration(result.duration) : '0:00'
});

import fs from 'fs';

export const uploadCourseThumbnail = asyncHandler(async (req, res) => {
  console.log('[UPLOAD CONTROLLER] Received image upload request...');
  if (!req.file) {
    throw new ApiError(400, 'Thumbnail image file is required');
  }

  console.log(`[UPLOAD CONTROLLER] Multer parsed file successfully: Name=${req.file.originalname}, Path=${req.file.path}, Size=${req.file.size} bytes`);

  let result;
  try {
    result = await uploadImageToCloudinary(req.file.path);
  } catch (error) {
    console.error('[UPLOAD CONTROLLER] Error during Cloudinary image upload:', error);
    // Clean up temp file on error
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    const msg = error.message || error.error?.message || (typeof error === 'string' ? error : 'Cloudinary upload failed');
    throw new ApiError(500, `Cloudinary upload failed: ${msg}`);
  }

  // Clean up temp file on success
  if (fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }

  console.log(`[UPLOAD CONTROLLER] Completed upload successfully. Returning secure URL: ${result.secure_url}`);
  res.status(201).json({ media: buildMediaResponse(result) });
});

export const uploadLectureVideo = asyncHandler(async (req, res) => {
  console.log('[UPLOAD CONTROLLER] Received video upload request...');
  if (!req.file) {
    throw new ApiError(400, 'Lecture video file is required');
  }

  console.log(`[UPLOAD CONTROLLER] Multer parsed file successfully: Name=${req.file.originalname}, Path=${req.file.path}, Size=${req.file.size} bytes`);

  let result;
  try {
    result = await uploadVideoToCloudinary(req.file.path);
  } catch (error) {
    console.error('[UPLOAD CONTROLLER] Error during Cloudinary video upload:', error);
    // Clean up temp file on error
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    const msg = error.message || error.error?.message || (typeof error === 'string' ? error : 'Cloudinary upload failed');
    throw new ApiError(500, `Cloudinary upload failed: ${msg}`);
  }

  // Clean up temp file on success
  if (fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }

  console.log(`[UPLOAD CONTROLLER] Completed upload successfully. Returning secure URL: ${result.secure_url}`);
  res.status(201).json({ media: buildMediaResponse(result) });
});