import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../types';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      leadCustomers,
      totalProducts,
      allProducts,
      totalChallans,
      confirmedChallans,
      draftChallans,
      recentChallans,
      recentStockMovements,
      pendingFollowUps
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'LEAD' } }),
      prisma.product.count(),
      prisma.product.findMany({
        select: { id: true, name: true, sku: true, currentStock: true, minStockAlert: true, location: true }
      }),
      prisma.salesChallan.count(),
      prisma.salesChallan.count({ where: { status: 'CONFIRMED' } }),
      prisma.salesChallan.count({ where: { status: 'DRAFT' } }),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } }
        }
      }),
      prisma.stockMovement.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          createdBy: { select: { name: true, role: true } }
        }
      }),
      prisma.customer.findMany({
        where: {
          followUpDate: {
            gte: today
          }
        },
        take: 5,
        orderBy: { followUpDate: 'asc' },
        select: { id: true, name: true, businessName: true, mobile: true, followUpDate: true, status: true }
      })
    ]);

    // Calculate low stock products
    const lowStockProducts = allProducts.filter(p => p.currentStock <= p.minStockAlert);
    const outOfStockProducts = allProducts.filter(p => p.currentStock === 0);

    // Calculate total valuation
    const totalInventoryValue = allProducts.reduce((acc, p) => acc + (p.currentStock * 1), 0); // items

    // Financial calculations
    const challanValuation = await prisma.salesChallan.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'CONFIRMED' }
    });

    res.json({
      success: true,
      data: {
        kpis: {
          totalCustomers,
          leadCustomers,
          totalProducts,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          totalChallans,
          confirmedChallans,
          draftChallans,
          totalSalesValuation: challanValuation._sum.totalAmount || 0
        },
        lowStockAlerts: lowStockProducts.slice(0, 6),
        pendingFollowUps,
        recentChallans,
        recentStockMovements
      }
    });
  } catch (error) {
    next(error);
  }
};
