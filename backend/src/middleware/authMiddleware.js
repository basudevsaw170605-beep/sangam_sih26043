import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const userFromToken = async (raw) => {
  const decoded = jwt.verify(raw.slice(7), process.env.JWT_SECRET);
  return User.findById(decoded.userId);
};
export const protect = async (req, res, next) => {
  try {
    const raw = req.headers.authorization;
    if (!raw?.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'Authentication required' });
    const user = await userFromToken(raw);
    if (!user?.isActive)
      return res.status(401).json({ success: false, message: 'Account unavailable' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
export const optionalAuth = async (req, res, next) => {
  const raw = req.headers.authorization;
  if (raw?.startsWith('Bearer ')) {
    try {
      const user = await userFromToken(raw);
      if (user?.isActive) req.user = user;
    } catch {}
  }
  next();
};
export const authorize =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res.status(403).json({ success: false, message: 'Insufficient permissions' });
