import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: [{ type: String, required: true, trim: true }],
    correctAnswer: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: '' },
    marks: { type: Number, default: 10, min: 0 }
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    quizTitle: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    questions: {
      type: [quizQuestionSchema],
      default: []
    },
    timer: {
      type: Number,
      default: 0
    },
    marks: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;