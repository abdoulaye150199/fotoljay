import type { Request, Response } from 'express';
import { NotificationService } from './notification.service.js';

const notificationService = new NotificationService();

export class NotificationsController {
  async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id; // From auth middleware
      const { limit = '50', offset = '0' } = req.query;

      const notifications = await notificationService.getUserNotifications(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Notification ID is required' });
      }

      await notificationService.markAsRead(id, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      await notificationService.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Notification ID is required' });
      }

      await notificationService.deleteNotification(id, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}