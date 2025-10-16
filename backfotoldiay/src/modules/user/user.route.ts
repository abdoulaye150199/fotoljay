import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticateToken, requireRole } from '../auth/auth.middleware.js';

const router = Router();
const userController = new UserController();

// Profile routes (authenticated users)
router.get('/profile', authenticateToken, userController.getProfile.bind(userController));
router.put('/profile', authenticateToken, userController.updateProfile.bind(userController));
router.get('/stats', authenticateToken, userController.getStats.bind(userController));
router.patch('/deactivate', authenticateToken, userController.deactivateAccount.bind(userController));

// Admin routes (admin only)
router.get('/', authenticateToken, requireRole('ADMIN'), userController.getAllUsers.bind(userController));

export default router;