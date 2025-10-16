import type { Request, Response } from 'express';
import { UserService } from './user.service.js';

const userService = new UserService();

export class UserController {
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const profile = await userService.getUserProfile(userId);

      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { username, displayName } = req.body;

      const updatedProfile = await userService.updateUserProfile(userId, {
        username,
        displayName,
      });

      res.json(updatedProfile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const stats = await userService.getUserStats(userId);

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deactivateAccount(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await userService.deactivateUser(userId);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const { role, isActive, limit, offset } = req.query;

      const filters = {
        ...(role && { role: role as string }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(limit && { limit: parseInt(limit as string) }),
        ...(offset && { offset: parseInt(offset as string) }),
      };

      const users = await userService.getAllUsers(filters);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}