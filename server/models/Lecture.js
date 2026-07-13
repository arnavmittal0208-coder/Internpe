import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    lectureNumber: {
      type: Number,
      required: true,
      min: 1
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    videoUrl: {
      type: String,
      required: true
    },
    videoPublicId: {
      type: String,
      default: ''
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    thumbnailPublicId: {
      type: String,
      default: ''
    },
    courseTitle: {
      type: String,
      default: ''
    },
    duration: {
      type: String,
      default: ''
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Lecture = mongoose.model('Lecture', lectureSchema);
export default Lecture;