import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { authenticateToken } from '../auth/auth.middleware.js';

const router = Router();
const notificationsController = new NotificationsController();

// All notification routes require authentication
router.use(authenticateToken);

router.get('/', notificationsController.getUserNotifications.bind(notificationsController));
router.get('/unread-count', notificationsController.getUnreadCount.bind(notificationsController));
router.patch('/:id/read', notificationsController.markAsRead.bind(notificationsController));
router.patch('/mark-all-read', notificationsController.markAllAsRead.bind(notificationsController));
router.delete('/:id', notificationsController.deleteNotification.bind(notificationsController));

export default router;