import jwt from 'jsonwebtoken';
import Notification from '../models/Notification.js';
import Activity from '../models/Activity.js';
export const tokenFor = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export const audit = (user, action, entityType, entityId, description, metadata) =>
  Activity.create({ user, action, entityType, entityId, description, metadata });
export const notify = (recipient, title, message, type, relatedChallenge) =>
  recipient && Notification.create({ recipient, title, message, type, relatedChallenge });
export const paging = (query) => ({
  page: Math.max(parseInt(query.page, 10) || 1, 1),
  limit: Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100),
});
