import createHttpError from 'http-errors';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies.accessToken;

  let session = null;

  // 1. Пробуємо знайти сесію через заголовок Authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]?.trim();
    if (token && token !== 'null' && token !== 'undefined') {
      session = await Session.findOne({ accessToken: token });
    }
  }

  // 2. Якщо через заголовок не знайшли — перевіряємо куки
  if (!session && cookieToken) {
    const token = cookieToken.trim();
    if (token && token !== 'null' && token !== 'undefined') {
      session = await Session.findOne({ accessToken: token });
    }
  }

  if (!session) {
    return next(createHttpError(401, 'Session not found or token invalid'));
  }

  const isAccessTokenExpired = new Date() > new Date(session.accessTokenValidUntil);
  if (isAccessTokenExpired) {
    return next(createHttpError(401, 'Access token expired'));
  }

  const user = await User.findById(session.userId);
  if (!user) {
    return next(createHttpError(401, 'User not found'));
  }

  req.user = user;
  next();
};
