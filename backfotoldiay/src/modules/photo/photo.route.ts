import { Router } from 'express';
import { PhotoController } from './photo.controller.js';
import { authenticateToken, requireRole } from '../auth/auth.middleware.js';

const router = Router();
const photoController = new PhotoController();

// GET /photos/:id - Voir les détails d'une photo (Tous)
router.get('/:id', photoController.getPhotoById.bind(photoController));

// DELETE /photos/:id - Supprimer une photo (VENDEUR propriétaire ou ADMIN)
router.delete(
  '/:id',
  authenticateToken,
  requireRole('VENDEUR', 'ADMIN'),
  photoController.deletePhoto.bind(photoController)
);

export default router;