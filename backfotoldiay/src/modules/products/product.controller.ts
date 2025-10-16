import type { Request, Response } from 'express';
import { ProductService } from './product.service.js';
import { ProductStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const productService = new ProductService();

interface AuthRequest extends Request {
  user?: any;
}

export class ProductController {
  async createProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { title, description, priceCfa } = req.body;
      const sellerId = req.user!.id;

      if (!title || !description) {
        return res.status(400).json({ error: 'Missing required fields: title and description' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Photo is required' });
      }

      // Parse priceCfa to number if provided
      const parsedPriceCfa = priceCfa ? parseInt(priceCfa, 10) : undefined;

      // Save the uploaded file
      const file = req.file;
      const filename = `${Date.now()}-${file.originalname}`;
      const filepath = path.join('uploads', filename);

      // Ensure uploads directory exists
      if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
      }

      // Write file to disk
      fs.writeFileSync(filepath, file.buffer);

      // Create photo URL (full URL for frontend)
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      const photoUrl = `${baseUrl}/uploads/${filename}`;

      const product = await productService.createProduct({
        title,
        description,
        priceCfa: parsedPriceCfa ?? null,
        sellerId,
        photos: [{
          url: photoUrl,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        }],
      });

      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      const { status, isVip, sellerId, limit, offset } = req.query;

      const filters: any = {};
      if (status) filters.status = status as ProductStatus;
      if (isVip !== undefined) filters.isVip = isVip === 'true';
      if (sellerId) filters.sellerId = sellerId as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const products = await productService.getProducts(filters);
      res.json(products);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProductById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const viewerId = req.user?.id;

      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const product = await productService.getProductById(id, viewerId);
      res.json(product);
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async updateProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const { id } = req.params;
      const { title, description, priceCfa, photos } = req.body;
      const sellerId = req.user!.id;

      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const product = await productService.updateProduct(id, sellerId, {
        title,
        description,
        priceCfa,
        photos,
      });

      res.json(product);
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async republishProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const { id } = req.params;
      const sellerId = req.user!.id;

      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const product = await productService.republishProduct(id, sellerId);
      res.json(product);
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async updateProductStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const { id } = req.params;
      const { status, reason } = req.body;
      const moderatorId = req.user!.id;

      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      if (!Object.values(ProductStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const product = await productService.updateProductStatus(id, moderatorId, status, reason);
      res.json(product);
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      await productService.deleteProduct(id, userId, userRole);
      res.json({ message: 'Product deleted' });
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async setVip(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const { id } = req.params;
      const { durationDays } = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const product = await productService.setVip(id, userId, userRole, durationDays || 30);
      res.json(product);
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async markAsSold(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const { id } = req.params;
      const sellerId = req.user!.id;

      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const product = await productService.markAsSold(id, sellerId);
      res.json(product);
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }
}