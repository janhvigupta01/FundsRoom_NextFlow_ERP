import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../types';

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU / Product code is required').toUpperCase(),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  currentStock: z.number().int().nonnegative('Stock cannot be negative').default(0),
  minStockAlert: z.number().int().nonnegative('Alert quantity cannot be negative').default(10),
  location: z.string().min(2, 'Warehouse location is required'),
  imageUrl: z.string().optional().nullable()
});

const stockAdjustmentSchema = z.object({
  quantity: z.number().int().positive('Adjustment quantity must be at least 1'),
  movementType: z.enum(['IN', 'OUT'], {
    errorMap: () => ({ message: 'Movement type must be IN or OUT' })
  }),
  reason: z.string().min(3, 'Detailed reason for stock adjustment is required')
});

export const getProducts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string)?.trim() || '';
    const category = (req.query.category as string)?.trim();
    const lowStock = req.query.lowStock === 'true';

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
        { location: { contains: search } }
      ];
    }

    let products = await prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { stockMovements: true, challanItems: true }
        }
      }
    });

    if (lowStock) {
      products = products.filter(p => p.currentStock <= p.minStockAlert);
    }

    const total = products.length;
    const paginatedProducts = products.slice(skip, skip + limit);

    // Get categories list for filters
    const allCategories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category']
    });

    res.json({
      success: true,
      data: {
        products: paginatedProducts,
        categories: allCategories.map(c => c.category),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            }
          }
        }
      }
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = productSchema.parse(req.body);

    const existingSku = await prisma.product.findUnique({
      where: { sku: parsed.sku }
    });

    if (existingSku) {
      res.status(400).json({ success: false, message: `Product with SKU "${parsed.sku}" already exists` });
      return;
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: parsed.name,
          sku: parsed.sku,
          category: parsed.category,
          unitPrice: parsed.unitPrice,
          currentStock: parsed.currentStock,
          minStockAlert: parsed.minStockAlert,
          location: parsed.location,
          imageUrl: parsed.imageUrl || null
        }
      });

      if (parsed.currentStock > 0 && req.user) {
        await tx.stockMovement.create({
          data: {
            productId: newProduct.id,
            quantity: parsed.currentStock,
            movementType: 'IN',
            reason: 'Initial Opening Stock Entry',
            createdById: req.user.id
          }
        });
      }

      return newProduct;
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = productSchema.partial().parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (parsed.sku && parsed.sku !== existing.sku) {
      const duplicateSku = await prisma.product.findUnique({ where: { sku: parsed.sku } });
      if (duplicateSku) {
        res.status(400).json({ success: false, message: `SKU "${parsed.sku}" is already in use by another product` });
        return;
      }
    }

    // Do not update currentStock directly from here (use adjustStock endpoint to ensure audit trail)
    const { currentStock, ...safeUpdateData } = parsed;

    const updated = await prisma.product.update({
      where: { id },
      data: safeUpdateData
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, movementType, reason } = stockAdjustmentSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Strict validation: Prevent stock from going negative
    if (movementType === 'OUT' && product.currentStock < quantity) {
      res.status(400).json({
        success: false,
        message: `Insufficient stock! Product "${product.name}" (${product.sku}) has only ${product.currentStock} units available in ${product.location}, requested deduction: ${quantity} units.`
      });
      return;
    }

    const newStock = movementType === 'IN' 
      ? product.currentStock + quantity 
      : product.currentStock - quantity;

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock }
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: id,
          quantity,
          movementType,
          reason,
          createdById: req.user!.id
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      return { updatedProduct, movement };
    });

    res.json({
      success: true,
      message: `Stock updated successfully: ${movementType} ${quantity} units. New balance: ${result.updatedProduct.currentStock} units.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getStockMovements = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const productId = req.query.productId as string;
    const movementType = req.query.movementType as string;
    const search = (req.query.search as string)?.trim() || '';

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (movementType && movementType !== 'ALL') {
      where.movementType = movementType;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { product: { name: { contains: search } } },
        { product: { sku: { contains: search } } },
        { createdBy: { name: { contains: search } } }
      ];
    }

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: true, location: true }
          },
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        movements,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
