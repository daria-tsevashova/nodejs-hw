// src/controllers/userController.js

import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getCurrentUser = async (req, res) => {
  res.status(200).json(req.user);
};

export const updateCurrentUser = async (req, res) => {
  const username = req.body.username?.trim();

  if (!username) {
    throw createHttpError(400, 'Username is required');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { username },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  res.status(200).json(user);
};

export const updateUserAvatar = async (req, res, next) => {
  if (!req.file) {
    throw createHttpError(400, 'No file');
  }

  const result = await saveFileToCloudinary(req.file.buffer, req.user.id);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: result.secure_url },
    { new: true },
  );

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  res.status(200).json({ url: user.avatar });
};
