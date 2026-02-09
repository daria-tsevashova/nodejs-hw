import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { errors } from 'celebrate';

import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

import notesRoutes from './routes/notesRoutes.js';
import authRoutes from './routes/authRoutes.js';

import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Глобальні middleware
app.use(logger);
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(cookieParser());

// Маршрути
// підключаємо групу маршрутів для нотаток
app.use(notesRoutes);
app.use(authRoutes);

app.get('/test-error', () => {
  throw new Error('Simulated server error');
});

// 404 — якщо маршрут не знайдено
app.use(notFoundHandler);

// Обробка помилок валідації від celebrate
app.use(errors());

// Error — якщо під час запиту виникла помилка
app.use(errorHandler);

// підключення до MongoDB
await connectMongoDB();

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
