import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
  async getUserProfile(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude passwordHash
        _count: {
          select: {
            products: true,
            notifications: true,
          },
        },
      },
    });
  }

  async updateUserProfile(userId: string, data: {
    username?: string;
    displayName?: string;
  }) {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUserStats(userId: string) {
    const [productCount, notificationCount, unreadNotifications] = await Promise.all([
      prisma.product.count({ where: { sellerId: userId } }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      totalProducts: productCount,
      totalNotifications: notificationCount,
      unreadNotifications,
    };
  }

  async deactivateUser(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });
  }

  async getAllUsers(filters?: {
    role?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const { role, isActive, limit = 50, offset = 0 } = filters || {};

    return await prisma.user.findMany({
      where: {
        ...(role && { role: role as any }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            notifications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}