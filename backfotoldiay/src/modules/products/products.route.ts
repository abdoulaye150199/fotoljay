import { Router } from 'express';
import multer from 'multer';
import { ProductController } from './product.controller.js';
import { PhotoController } from '../photo/photo.controller.js';
import { authenticateToken, requireRole } from '../auth/auth.middleware.js';

const router = Router();
const productController = new ProductController();
const photoController = new PhotoController();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST /products - Créer un produit (VENDEUR ou ADMIN)
router.post(
  '/',
  authenticateToken,
  requireRole('VENDEUR', 'ADMIN'),
  upload.single('photo'),
  productController.createProduct.bind(productController)
);

// GET /products - Lister les produits (Tous)
router.get('/', productController.getProducts.bind(productController));

// GET /products/:id - Voir les détails d'un produit + compter la vue (Tous)
router.get('/:id', productController.getProductById.bind(productController));

// PUT /products/:id - Modifier un produit (VENDEUR propriétaire)
router.put(
  '/:id',
  authenticateToken,
  requireRole('VENDEUR'),
  productController.updateProduct.bind(productController)
);

// PATCH /products/:id/republish - Republier un produit expiré (VENDEUR)
router.patch(
  '/:id/republish',
  authenticateToken,
  requireRole('VENDEUR'),
  productController.republishProduct.bind(productController)
);

// PATCH /products/:id/status - Changer le statut du produit (MODERATEUR / ADMIN)
router.patch(
  '/:id/status',
  authenticateToken,
  requireRole('MODERATEUR', 'ADMIN'),
  productController.updateProductStatus.bind(productController)
);

// PATCH /products/:id/vip - Marquer un produit comme VIP (ADMIN ou VENDEUR)
router.patch(
  '/:id/vip',
  authenticateToken,
  requireRole('VENDEUR', 'ADMIN'),
  productController.setVip.bind(productController)
);

// PATCH /products/:id/sell - Marquer un produit comme vendu (VENDEUR propriétaire)
router.patch(
  '/:id/sell',
  authenticateToken,
  requireRole('VENDEUR'),
  productController.markAsSold.bind(productController)
);

// DELETE /products/:id - Supprimer (VENDEUR ou ADMIN)
router.delete(
  '/:id',
  authenticateToken,
  requireRole('VENDEUR', 'ADMIN'),
  productController.deleteProduct.bind(productController)
);

// Photos routes
// POST /products/:productId/photos - Créer une photo (VENDEUR propriétaire)
router.post(
  '/:productId/photos',
  authenticateToken,
  requireRole('VENDEUR'),
  photoController.createPhoto.bind(photoController)
);

// GET /products/:productId/photos - Lister les photos d'un produit (Tous)
router.get('/:productId/photos', photoController.getPhotosByProductId.bind(photoController));

export default router;