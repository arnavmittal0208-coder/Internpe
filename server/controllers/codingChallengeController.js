import CodingChallenge from '../models/CodingChallenge.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toFrontendCodingChallenge = (challenge) => {
  if (!challenge) return null;
  return {
    id: challenge._id.toString(),
    courseId: challenge.courseId.toString(),
    title: challenge.title,
    description: challenge.description,
    difficulty: challenge.difficulty,
    link: challenge.leetcodeUrl,
    tags: challenge.tags || ''
  };
};

const mapIncomingCodingChallenge = (body) => ({
  courseId: body.courseId,
  title: body.title,
  description: body.description,
  difficulty: body.difficulty,
  leetcodeUrl: body.leetcodeUrl || body.link,
  tags: body.tags || ''
});

export const getCodingChallengesByCourse = asyncHandler(async (req, res) => {
  const codingChallenges = await CodingChallenge.find({ courseId: req.params.courseId }).sort({ createdAt: -1 });
  res.json({ codingChallenges: codingChallenges.map(toFrontendCodingChallenge) });
});

export const getAllCodingChallenges = asyncHandler(async (_req, res) => {
  const codingChallenges = await CodingChallenge.find().sort({ createdAt: -1 });
  res.json({ codingChallenges: codingChallenges.map(toFrontendCodingChallenge) });
});

export const createCodingChallenge = asyncHandler(async (req, res) => {
  const payload = mapIncomingCodingChallenge(req.body);
  const codingChallenge = await CodingChallenge.create(payload);
  res.status(201).json({ codingChallenge: toFrontendCodingChallenge(codingChallenge) });
});

export const updateCodingChallenge = asyncHandler(async (req, res) => {
  const payload = mapIncomingCodingChallenge(req.body);
  const codingChallenge = await CodingChallenge.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  res.json({ codingChallenge: toFrontendCodingChallenge(codingChallenge) });
});

export const deleteCodingChallenge = asyncHandler(async (req, res) => {
  await CodingChallenge.findByIdAndDelete(req.params.id);
  res.json({ message: 'Coding challenge deleted successfully' });
});