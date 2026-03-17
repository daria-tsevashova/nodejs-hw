// src/routes/userRoutes.js

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getCurrentUser,
  updateCurrentUser,
  updateUserAvatar,
} from '../controllers/userController.js';
import { upload } from '../middleware/multer.js';

const router = Router();

router.get('/users/me', authenticate, getCurrentUser);
router.patch('/users/me', authenticate, updateCurrentUser);

router.patch(
  '/users/me/avatar',
  authenticate,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  updateUserAvatar,
);

export default router;
