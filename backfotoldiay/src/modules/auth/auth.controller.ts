import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, username, phone } = req.body;
      const result = await authService.register(email, password, username, phone);
      // Set token in cookies based on role
      const cookieName = `token_${result.user.role.toLowerCase()}`;
      res.cookie(cookieName, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000, // 1 hour
      });
      res.status(201).json({ user: result.user, token: result.token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      // Set token in cookies based on role
      const cookieName = `token_${result.user.role.toLowerCase()}`;
      res.cookie(cookieName, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000, // 1 hour
      });
      res.json({ user: result.user, token: result.token });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
}