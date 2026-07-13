import { configureCloudinary, cloudinary } from '../config/cloudinary.js';

const uploadBuffer = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
};

export const uploadImageToCloudinary = async (filePath, folder = 'internpe/thumbnails') => {
  console.log(`[CLOUDINARY] Uploading image: ${filePath} to folder: ${folder}...`);
  configureCloudinary();
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
  });
  console.log(`[CLOUDINARY] Image uploaded successfully. Secure URL: ${result.secure_url}`);
  return result;
};

export const uploadVideoToCloudinary = async (filePath, folder = 'internpe/lectures') => {
  console.log(`[CLOUDINARY] Starting chunked upload for video: ${filePath} to folder: ${folder}...`);
  configureCloudinary();
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'video',
    chunk_size: 6000000, // 6MB chunk size for chunked uploading of large videos
    allowed_formats: ['mp4', 'webm', 'mov', 'mkv']
  });
  console.log(`[CLOUDINARY] Video uploaded successfully. Secure URL: ${result.secure_url}, Duration: ${result.duration}s`);
  return result;
};

export const removeMediaFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) {
    return null;
  }

  configureCloudinary();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
};