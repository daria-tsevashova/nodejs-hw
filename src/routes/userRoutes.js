// src/routes/userRoutes.js

import { Router } from 'express';
import { celebrate } from 'celebrate';
import { authenticate } from '../middleware/authenticate.js';
import {
  getCurrentUser,
  updateCurrentUser,
  updateUserAvatar,
} from '../controllers/userController.js';
import { upload } from '../middleware/multer.js';
import { updateCurrentUserSchema } from '../validations/userValidation.js';

const router = Router();

router.get(['/users/me', '/api/users/me'], authenticate, getCurrentUser);
router.patch(
  ['/users/me', '/api/users/me'],
  authenticate,
  celebrate(updateCurrentUserSchema),
  updateCurrentUser,
);

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
