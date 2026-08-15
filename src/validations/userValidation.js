import { Joi, Segments } from 'celebrate';

const avatarSchema = Joi.string()
  .pattern(/^(data:image\/|https?:\/\/)/)
  .messages({
    'string.pattern.base':
      'Avatar must start with data:image/ or http(s)://',
  });

export const updateCurrentUserSchema = {
  [Segments.BODY]: Joi.object({
    username: Joi.string().trim().min(1),
    avatar: Joi.alternatives().try(avatarSchema, Joi.string().valid('')),
  }).min(1),
};
