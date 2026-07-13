import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const requestedRole = role === 'Admin' ? 'Admin' : 'Student';

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  if (requestedRole === 'Admin') {
    const registrationKey = req.body.adminKey;
    if (!process.env.ADMIN_REGISTRATION_KEY || registrationKey !== process.env.ADMIN_REGISTRATION_KEY) {
      throw new ApiError(403, 'Admin registration is restricted');
    }
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: requestedRole
  });

  const token = signToken(user._id);

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: sanitizeUser(user)
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user._id);

  res.json({
    message: 'Logged in successfully',
    token,
    user: sanitizeUser(user)
  });
});

export const logoutUser = asyncHandler(async (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});