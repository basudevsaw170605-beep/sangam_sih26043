import { validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '../models/User.js';
import { tokenFor, asyncHandler } from '../utils/helpers.js';
const sendUser = (res, user, status = 200, message = 'Success') =>
  res.status(status).json({ success: true, message, token: tokenFor(user), data: user });
export const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res
      .status(422)
      .json({ success: false, message: 'Validation failed', errors: errors.array() });
  const { name, email, password, role = 'citizen', ...details } = req.body;
  if (role === 'admin')
    return res.status(403).json({ success: false, message: 'Admin registration is restricted' });
  if (await User.findOne({ email }))
    return res.status(409).json({ success: false, message: 'Email already registered' });
  const user = await User.create({ name, email, password, role, ...details });
  sendUser(res, user, 201, 'Account created successfully');
});
export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password || '')))
    return res.status(401).json({ success: false, message: 'Incorrect email or password' });
  if (!user.isActive)
    return res.status(403).json({ success: false, message: 'Account is inactive' });
  user.password = undefined;
  sendUser(res, user, 200, 'Logged in successfully');
});
export const me = asyncHandler(async (req, res) => res.json({ success: true, data: req.user }));
export const logout = (_, res) => res.json({ success: true, message: 'Logged out successfully' });
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() }).select('+password');
  if (user) {
    user.resetPasswordToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save({ validateBeforeSave: false });
  }
  res.json({
    success: true,
    message: 'If that account exists, reset instructions have been prepared.',
  });
});
export const resetPassword = asyncHandler(async (req, res) =>
  res.status(501).json({ success: false, message: 'Password reset delivery is not configured yet' })
);
