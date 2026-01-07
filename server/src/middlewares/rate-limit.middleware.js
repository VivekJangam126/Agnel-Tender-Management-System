import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const max = parseInt(env.RATE_LIMIT_MAX || '30', 10);

export const aiRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  keyGenerator: (req) => {
    if (req.user?.id) {
      return `${req.user.id}:${req.ip}`;
    }
    return req.ip;
  },
});