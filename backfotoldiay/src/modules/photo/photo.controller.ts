import type { Request, Response } from 'express';
import { PhotoService } from './photo.service.js';

const photoService = new PhotoService();

interface AuthRequest extends Request {
  user?: any;
}

export class PhotoController {
  async createPhoto(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const { productId } = req.params;
      const { url, filename, mimeType, size, capturedWithCamera } = req.body;

      if (!url || !filename) {
        return res.status(400).json({ error: 'Missing required fields: url and filename' });
      }

      const photo = await photoService.createPhoto({
        productId: productId as string,
        url,
        filename,
        mimeType,
        size,
        capturedWithCamera,
      });

      res.status(201).json(photo);
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async getPhotosByProductId(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      const photos = await photoService.getPhotosByProductId(productId as string);
      res.json(photos);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPhotoById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const viewerId = req.user?.id;

      const photo = await photoService.getPhotoById(id as string, viewerId);
      res.json(photo);
    } catch (error: any) {
      if (error.message === 'Photo not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async deletePhoto(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      await photoService.deletePhoto(id as string, userId, userRole);
      res.json({ message: 'Photo deleted' });
    } catch (error: any) {
      if (error.message === 'Photo not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }
}