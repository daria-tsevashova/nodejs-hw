import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { errors } from 'celebrate';
import swaggerUi from 'swagger-ui-express';
import redoc from 'redoc-express';

import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

import notesRoutes from './routes/notesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { openApiSpec } from './docs/openapi.js';

import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Глобальні middleware
app.use(logger);
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(cookieParser());

app.get('/openapi.json', (_req, res) => {
  res.status(200).json(openApiSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get(
  '/api-docs/redoc',
  redoc({
    title: 'Nodejs HW API Docs',
    specUrl: '/openapi.json',
  }),
);

// Маршрути
// підключаємо групу маршрутів для нотаток
app.use(notesRoutes);
app.use(authRoutes);
app.use(userRoutes);

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
