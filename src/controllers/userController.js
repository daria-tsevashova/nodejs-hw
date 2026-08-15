// src/controllers/userController.js

import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getCurrentUser = async (req, res, next) => {
  try {
    // Перетворюємо в об'єкт та видаляємо пароль про всяк випадок, 
    // якщо він не був видалений у middleware
    const user = req.user.toObject ? req.user.toObject() : req.user;
    if (user.password) {
      delete user.password;
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateCurrentUser = async (req, res, next) => {
  try {
    const { username, avatar } = req.body;
    const updates = {};

    if (typeof username === 'string' && username.trim() !== '') {
      updates.username = username.trim();
    }

    // Keep existing avatar when empty string or undefined is sent.
    if (typeof avatar === 'string' && avatar.trim() !== '') {
      updates.avatar = avatar;
    }

    if (Object.keys(updates).length === 0) {
      const currentUser = await User.findById(req.user._id).select('-password');

      if (!currentUser) {
        throw createHttpError(404, 'User not found');
      }

      return res.status(200).json(currentUser);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true },
    ).select('-password');

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserAvatar = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};
