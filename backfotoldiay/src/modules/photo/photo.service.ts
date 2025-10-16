import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PhotoService {
  async createPhoto(data: {
    productId: string;
    url: string;
    filename: string;
    mimeType?: string;
    size?: number;
    capturedWithCamera?: boolean;
  }) {
    // Verify product exists and get seller
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, sellerId: true, status: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const photo = await prisma.photo.create({
      data: {
        productId: data.productId,
        url: data.url,
        filename: data.filename,
        mimeType: data.mimeType || null,
        size: data.size || null,
        capturedWithCamera: data.capturedWithCamera ?? true,
      },
    });

    return photo;
  }

  async getPhotoById(id: string, viewerId: string | undefined) {
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, title: true, seller: { select: { id: true, displayName: true } } },
        },
        _count: {
          select: { views: true },
        },
      },
    });

    if (!photo) {
      throw new Error('Photo not found');
    }

    // Increment view count
    await prisma.photoView.create({
      data: {
        photoId: id,
        viewerId: viewerId || null,
      },
    });

    return photo;
  }

  async getPhotosByProductId(productId: string) {
    const photos = await prisma.photo.findMany({
      where: { productId },
      include: {
        _count: {
          select: { views: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return photos;
  }

  async deletePhoto(id: string, userId: string, userRole: string) {
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: {
        product: {
          select: { sellerId: true },
        },
      },
    });

    if (!photo) {
      throw new Error('Photo not found');
    }

    if (photo.product.sellerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    await prisma.photo.delete({
      where: { id },
    });

    return { message: 'Photo deleted' };
  }
}