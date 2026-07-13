import mongoose from 'mongoose';

const lectureProgressSchema = new mongoose.Schema(
  {
    lectureId: {
      type: String,
      required: true,
      trim: true
    },
    currentPlaybackTime: {
      type: Number,
      default: 0,
      min: 0
    },
    watchPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completed: {
      type: Boolean,
      default: false
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const quizScoreSchema = new mongoose.Schema(
  {
    quizId: {
      type: String,
      required: true,
      trim: true
    },
    score: {
      type: Number,
      default: 0,
      min: 0
    },
    totalQuestions: {
      type: Number,
      default: 0,
      min: 0
    },
    correctAnswers: {
      type: Number,
      default: 0,
      min: 0
    },
    completionStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed'
    },
    passed: {
      type: Boolean,
      default: false
    },
    attemptDate: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const codingChallengeProgressSchema = new mongoose.Schema(
  {
    challengeId: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    submissionDate: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    lectureId: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      default: ''
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const studentProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    completedLectures: [{ type: String, trim: true }],
    lastWatchedLecture: {
      type: String,
      default: null
    },
    currentPlaybackTime: {
      type: Number,
      default: 0,
      min: 0
    },
    watchPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lectureProgress: {
      type: [lectureProgressSchema],
      default: []
    },
    quizScores: {
      type: [quizScoreSchema],
      default: []
    },
    completedCodingChallenges: {
      type: [codingChallengeProgressSchema],
      default: []
    },
    notes: {
      type: [noteSchema],
      default: []
    },
    totalLectures: {
      type: Number,
      default: 0,
      min: 0
    },
    completedLecturesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    courseCompletionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastActivityTimestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

studentProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);
export default StudentProgress;