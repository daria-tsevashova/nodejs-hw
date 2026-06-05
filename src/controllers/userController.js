// src/controllers/userController.js

import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getCurrentUser = async (req, res) => {
  // Перетворюємо в об'єкт та видаляємо пароль про всяк випадок, 
  // якщо він не був видалений у middleware
  const user = req.user.toObject ? req.user.toObject() : req.user;
  if (user.password) {
    delete user.password;
  }
  res.status(200).json(user);
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
  ).select('-password');

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  res.status(200).json(user);
};

export const updateUserAvatar = async (req, res) => {
  const avatarFile = req.file || req.files?.avatar?.[0] || req.files?.file?.[0];

  if (!avatarFile) {
    throw createHttpError(400, 'Avatar file is required');
  }

  const result = await saveFileToCloudinary(avatarFile.buffer, req.user.id);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: result.secure_url },
    { new: true },
  ).select('-password');

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  res.status(200).json({ url: user.avatar });
};
