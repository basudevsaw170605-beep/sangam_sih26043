import express from 'express';
import { body } from 'express-validator';
import { protect, optionalAuth, authorize } from '../middleware/authMiddleware.js';
import { uploadEvidence } from '../middleware/uploadMiddleware.js';
import * as auth from '../controllers/authController.js';
import * as challenge from '../controllers/challengeController.js';
import * as r from '../controllers/resourceControllers.js';
import { analyzeChallenge } from '../controllers/aiController.js';
const router = express.Router(),
  admin = authorize('admin'),
  university = authorize('university', 'admin'),
  collaborator = authorize('university', 'industry', 'admin');
router.post(
  '/auth/register',
  [body('name').trim().notEmpty(), body('email').isEmail(), body('password').isLength({ min: 8 })],
  auth.register
);
router.post('/auth/login', auth.login);
router.get('/auth/me', protect, auth.me);
router.post('/auth/logout', auth.logout);
router.post('/auth/forgot-password', auth.forgotPassword);
router.post('/auth/reset-password', auth.resetPassword);
router.get('/challenges/nearby', challenge.nearby);
router.get('/challenges', optionalAuth, challenge.listChallenges);
router.get(
  '/citizen/dashboard',
  protect,
  authorize('citizen', 'admin'),
  challenge.citizenDashboard
);
router.post(
  '/challenges',
  protect,
  authorize('citizen', 'admin'),
  uploadEvidence,
  challenge.createChallenge
);
router.get('/challenges/:id', protect, challenge.getChallenge);
router.put('/challenges/:id', protect, challenge.updateChallenge);
router.delete('/challenges/:id', protect, challenge.deleteChallenge);
router.put('/challenges/:id/status', protect, admin, challenge.changeStatus);
router.put('/challenges/:id/assign', protect, admin, challenge.assignChallenge);
router.put('/challenges/:id/accept', protect, university, challenge.acceptChallenge);
router.put('/challenges/:id/reject', protect, university, challenge.rejectChallenge);
router.put('/challenges/:id/priority', protect, admin, challenge.setPriority);
router.get('/challenges/:id/matches', protect, admin, challenge.matches);
router.get('/universities', protect, r.listUniversities);
router.post('/universities', protect, admin, r.createUniversity);
router.get('/universities/:id', protect, r.getUniversity);
router.put('/universities/:id', protect, admin, r.updateUniversity);
router.get('/projects', protect, r.listProjects);
router.post('/projects', protect, university, r.createProject);
router.get('/projects/:id', protect, r.getProject);
router.put('/projects/:id', protect, university, r.updateProject);
router.delete('/projects/:id', protect, admin, r.deleteProject);
router.get('/teams', protect, r.listTeams);
router.post('/teams', protect, university, r.createTeam);
router.get('/teams/:id', protect, r.getTeam);
router.put('/teams/:id', protect, university, r.updateTeam);
router.post('/teams/:id/members', protect, university, r.addMember);
router.delete('/teams/:id/members/:userId', protect, university, r.removeMember);
router.get('/proposals', protect, r.listProposals);
router.post('/proposals', protect, collaborator, r.createProposal);
router.get('/proposals/:id', protect, r.getProposal);
router.put('/proposals/:id', protect, collaborator, r.updateProposal);
router.put('/proposals/:id/status', protect, admin, r.proposalStatus);
router.get('/notifications', protect, r.notifications);
router.put('/notifications/read-all', protect, r.readAll);
router.put('/notifications/:id/read', protect, r.readNotification);
router.delete('/notifications/:id', protect, r.deleteNotification);
router.post('/ai/analyze-challenge', protect, analyzeChallenge);
router.get('/admin/stats', protect, admin, r.adminStats);
router.get('/admin/analytics', protect, admin, r.analytics);
router.get('/admin/users', protect, admin, r.adminUsers);
router.get('/admin/challenges', protect, admin, r.adminChallenges);
router.get('/admin/projects', protect, admin, r.adminProjects);
router.get('/admin/activities', protect, admin, r.activities);
export default router;
