import createHttpError from 'http-errors';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies.accessToken;

  let token = null;

  // 1. Намагаємося взяти токен з заголовка
  if (authHeader?.startsWith('Bearer ')) {
    const candidate = authHeader.split(' ')[1]?.trim();
    if (candidate && candidate !== 'null' && candidate !== 'undefined') {
      token = candidate;
    }
  }

  // 2. Якщо в заголовку порожньо або сміття — перевіряємо куки
  if (!token && cookieToken) {
    const candidate = cookieToken.trim();
    if (candidate && candidate !== 'null' && candidate !== 'undefined') {
      token = candidate;
    }
  }

  if (!token || token === '') {
    return next(createHttpError(401, 'Missing access token'));
  }

  const session = await Session.findOne({
    accessToken: token,
  });

  // 3. Якщо такої сесії нема, повертаємо помилку
  if (!session) {
    return next(createHttpError(401, 'Session not found'));
  }

  // 4. Перевіряємо термін дії access токена
  const isAccessTokenExpired =
    new Date() > new Date(session.accessTokenValidUntil);

  if (isAccessTokenExpired) {
    return next(createHttpError(401, 'Access token expired'));
  }

  // 5. Якщо з токеном все добре і сесія існує,
  // шукаємо користувача
  const user = await User.findById(session.userId);

  // 6. Якщо користувача не знайдено
  if (!user) {
    return next(createHttpError(401, 'User not found'));
  }

  // 7. Якщо користувач існує, додаємо його до запиту
  req.user = user;

  // 8. Передаємо управління далі
  next();
};
