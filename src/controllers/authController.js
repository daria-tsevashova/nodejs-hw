// src/controllers/authController.js

import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendMail.js';

import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw createHttpError(500, 'JWT secret is not configured');
  }

  return process.env.JWT_SECRET;
};

const clearSessionCookies = (res) => {
  res.clearCookie('sessionId');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

const getUserOrThrow = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw createHttpError(401, 'User not found');
  }

  return user;
};

const getSessionByRefreshToken = async (cookies) => {
  if (!cookies.refreshToken) {
    return null;
  }

  if (cookies.sessionId) {
    const session = await Session.findOne({
      _id: cookies.sessionId,
      refreshToken: cookies.refreshToken,
    });

    if (session) {
      return session;
    }
  }

  return Session.findOne({ refreshToken: cookies.refreshToken });
};

const refreshSession = async (req, res) => {
  const session = await getSessionByRefreshToken(req.cookies);

  if (!session) {
    clearSessionCookies(res);
    throw createHttpError(401, 'Session not found');
  }

  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

  if (isSessionTokenExpired) {
    await Session.deleteOne({ _id: session._id });
    clearSessionCookies(res);
    throw createHttpError(401, 'Session token expired');
  }

  await Session.deleteOne({ _id: session._id });

  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);

  return getUserOrThrow(session.userId);
};

export const registerUser = async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createHttpError(409, 'Email in use');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    email,
    password: hashedPassword,
  });

  const newSession = await createSession(newUser._id);

  // 2. Викликаємо, передаємо об'єкт відповіді та сесію
  setSessionCookies(res, newSession);

  res.status(201).json(newUser);
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createHttpError(401, 'Invalid credentials');
  }

  await Session.deleteOne({ userId: user._id });

  const newSession = await createSession(user._id);

  // 3. Викликаємо, передаємо об'єкт відповіді та сесію
  setSessionCookies(res, newSession);

  res.status(200).json(user);
};

export const logoutUser = async (req, res) => {
  const { sessionId, refreshToken, accessToken } = req.cookies;

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  } else if (refreshToken) {
    await Session.deleteOne({ refreshToken });
  } else if (accessToken) {
    await Session.deleteOne({ accessToken });
  }

  clearSessionCookies(res);

  res.status(204).send();
};

export const getCurrentSessionUser = async (req, res) => {
  if (req.cookies.accessToken) {
    const session = await Session.findOne({
      accessToken: req.cookies.accessToken,
    });

    if (session) {
      const isAccessTokenExpired =
        new Date() > new Date(session.accessTokenValidUntil);

      if (!isAccessTokenExpired) {
        const user = await getUserOrThrow(session.userId);
        return res.status(200).json(user);
      }
    }
  }

  const user = await refreshSession(req, res);

  res.status(200).json(user);
};

export const refreshUserSession = async (req, res) => {
  await refreshSession(req, res);

  res.status(200).json({
    message: 'Session refreshed',
  });
};

export const requestResetEmail = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({
      message: 'If this email exists, a reset link has been sent',
    });
  }

  const resetToken = jwt.sign({ sub: user._id, email }, getJwtSecret(), {
    expiresIn: '15m',
  });

  // 1. Формуємо шлях до шаблона незалежно від cwd процесу
  const templatePath = path.join(
    __dirname,
    '..',
    'templates',
    'reset-password-email.html',
  );
  // 2. Читаємо шаблон
  const templateSource = await fs.readFile(templatePath, 'utf-8');
  // 3. Готуємо шаблон до заповнення
  const template = handlebars.compile(templateSource);
  // 4. Формуємо із шаблона HTML документ з динамічними даними
  const html = template({
    name: user.username,
    link: `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`,
  });

  try {
    await sendEmail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your password',
      // 5. Передаємо HTML у функцію надписання пошти
      html,
    });
  } catch {
    throw createHttpError(
      500,
      'Failed to send the email, please try again later.',
    );
  }

  res.status(200).json({
    message: 'If this email exists, a reset link has been sent',
  });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  // 1. Перевіряємо/декодуємо токен
  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch {
    // Повертаємо помилку якщо проблема при декодуванні
    throw createHttpError(401, 'Invalid or expired token');
  }

  // 2. Шукаємо користувача
  const user = await User.findOne({ _id: payload.sub, email: payload.email });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  // 3. Якщо користувач існує
  // створюємо новий пароль і оновлюємо користувача
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: user._id }, { password: hashedPassword });

  // 4. Інвалідовуємо всі можливі попередні сесії користувача
  await Session.deleteMany({ userId: user._id });

  // 5. Повертаємо успішну відповідь
  res.status(200).json({
    message: 'Password reset successfully. Please log in again.',
  });
};
