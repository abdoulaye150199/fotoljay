import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductService {
  async createProduct(data: {
    title: string;
    description: string;
    priceCfa?: number | null;
    sellerId: string;
    photos: { url: string; filename: string; mimeType?: string; size?: number }[];
  }) {
    const product = await prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        priceCfa: data.priceCfa || null,
        sellerId: data.sellerId,
        photos: {
          create: data.photos,
        },
      },
      include: {
        photos: true,
        seller: {
          select: { id: true, email: true, displayName: true, phone: true },
        },
      },
    });
    return product;
  }

  async getProducts(filters: {
    status?: ProductStatus;
    isVip?: boolean;
    sellerId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      status: { not: ProductStatus.SUPPRIME }
    };
    if (filters.status) where.status = filters.status;
    if (filters.isVip !== undefined) where.isVip = filters.isVip;
    if (filters.sellerId) where.sellerId = filters.sellerId;

    const products = await prisma.product.findMany({
      where,
      include: {
        photos: true,
        seller: {
          select: { id: true, email: true, username: true, displayName: true, phone: true },
        },
        _count: {
          select: { views: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });

    return products.map(product => ({
      ...product,
      views: product._count.views,
      _count: undefined, 
    }));
  }

  async getProductById(id: string, viewerId: string | undefined) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        photos: true,
        seller: {
          select: { id: true, email: true, username: true, displayName: true, phone: true },
        },
        views: {
          select: { viewedAt: true },
          orderBy: { viewedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { views: true },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    await prisma.productView.create({
      data: {
        productId: id,
        viewerId: viewerId || null,
      },
    });

    return {
      ...product,
      views: product._count.views,
      _count: undefined,
    };
  }

  async updateProduct(id: string, sellerId: string, data: {
    title?: string;
    description?: string;
    priceCfa?: number;
    photos?: { url: string; filename: string; mimeType?: string; size?: number }[];
  }) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new Error('Unauthorized');
    }

    if (product.status !== ProductStatus.EN_ATTENTE) {
      throw new Error('Cannot modify validated product');
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.priceCfa !== undefined) updateData.priceCfa = data.priceCfa;
    if (data.photos) {
      updateData.photos = {
        deleteMany: {},
        create: data.photos,
      };
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        photos: true,
        seller: {
          select: { id: true, email: true, displayName: true, phone: true },
        },
      },
    });

    return updatedProduct;
  }

  async republishProduct(id: string, sellerId: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new Error('Unauthorized');
    }

    if (product.status !== ProductStatus.EN_ATTENTE && product.status !== ProductStatus.VALIDE) {
      throw new Error('Cannot republish product');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        publishedAt: now,
        expiresAt,
        lastRepublishAt: now,
        status: ProductStatus.EN_ATTENTE,
      },
      include: {
        photos: true,
        seller: {
          select: { id: true, email: true, displayName: true, phone: true },
        },
      },
    });

    return updatedProduct;
  }

  async updateProductStatus(id: string, moderatorId: string, status: ProductStatus, reason?: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const fromStatus = product.status;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        status,
      },
      include: {
        photos: true,
        seller: {
          select: { id: true, email: true, displayName: true, phone: true },
        },
      },
    });

    const moderationLog = await prisma.moderationLog.create({
      data: {
        productId: id,
        moderatorId: moderatorId!,
        decision: status,
        reason: reason || null,
      },
    });

    await prisma.productHistory.create({
      data: {
        productId: id,
        action: `Status changed to ${status}`,
        fromStatus,
        toStatus: status,
        actorId: moderatorId!,
        note: reason || null,
      },
    });

    const { NotificationService } = await import('../notifications/notification.service.js');
    const notificationService = new NotificationService();

    let notificationTitle = '';
    let notificationBody = '';

    if (status === ProductStatus.VALIDE) {
      notificationTitle = 'Produit approuvé';
      notificationBody = `Votre produit "${product.title}" a été approuvé par notre équipe de modération.`;
    } else if (status === ProductStatus.REJETE) {
      notificationTitle = 'Produit rejeté';
      notificationBody = `Votre produit "${product.title}" a été rejeté. ${reason ? `Raison: ${reason}` : ''}`;
    }

    if (notificationTitle && notificationBody) {
      await notificationService.createNotification(
        product.sellerId,
        'MODERATION_DECISION',
        notificationTitle,
        notificationBody,
        { productId: id, status },
        moderationLog.id
      );
    }

    return updatedProduct;
  }

  async deleteProduct(id: string, userId: string, userRole: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        photos: true,
        views: true,
        moderationLogs: true,
        history: true,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.sellerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    for (const photo of product.photos) {
      const fs = await import('fs');
      const path = await import('path');
      const filename = photo.url.split('/').pop()!;
      const filepath = path.join('uploads', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      await prisma.photoView.deleteMany({
        where: { photoId: photo.id },
      });
    }

    await prisma.photo.deleteMany({
      where: { productId: id },
    });


    await prisma.productView.deleteMany({
      where: { productId: id },
    });

    await prisma.moderationLog.deleteMany({
      where: { productId: id },
    });


    await prisma.productHistory.deleteMany({
      where: { productId: id },
    });

    await prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted' };
  }

  async setVip(id: string, userId: string, userRole: string, durationDays: number = 30) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.sellerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    const vipUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        isVip: true,
        vipUntil,
      },
      include: {
        photos: true,
        seller: {
          select: { id: true, email: true, displayName: true, phone: true },
        },
      },
    });

    return updatedProduct;
  }

  async markAsSold(id: string, sellerId: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new Error('Unauthorized');
    }

    if (product.status !== ProductStatus.VALIDE) {
      throw new Error('Only validated products can be marked as sold');
    }

    const fromStatus = product.status;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.VENDU,
      },
      include: {
        photos: true,
        seller: {
          select: { id: true, email: true, displayName: true, phone: true },
        },
      },
    });

    // Log history
    await prisma.productHistory.create({
      data: {
        productId: id,
        action: 'Product marked as sold',
        fromStatus,
        toStatus: ProductStatus.VENDU,
        actorId: sellerId,
      },
    });

    // Create notification for the seller
    const { NotificationService } = await import('../notifications/notification.service.js');
    const notificationService = new NotificationService();

    await notificationService.createNotification(
      sellerId,
      'GENERIC',
      'Produit marqué comme vendu',
      `Votre produit "${product.title}" a été marqué comme vendu avec succès.`,
      { productId: id, status: 'VENDU' }
    );

    return updatedProduct;
  }
}