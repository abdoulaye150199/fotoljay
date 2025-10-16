import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Try to get token from Authorization header first (Bearer token)
  let token = req.headers.authorization?.replace('Bearer ', '');
  console.log('Auth header:', req.headers.authorization);
  console.log('Token from header:', token);

  // Fallback to cookies if no header token
  if (!token) {
    const tokenVendeur = req.cookies.token_vendeur;
    const tokenAdmin = req.cookies.token_admin;
    const tokenModerateur = req.cookies.token_moderateur;
    token = tokenVendeur || tokenAdmin || tokenModerateur;
    console.log('Token from cookies:', token);
  }

  if (!token) {
    console.log('No token found');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('JWT verification error:', error);
    res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    console.log('User role:', req.user.role, 'Required roles:', roles);
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};