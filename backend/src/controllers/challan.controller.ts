import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { AuthenticatedRequest, ProductSnapshot } from '../types';
import { generateChallanNumber } from '../utils/numberGenerators';
import { generateChallanPDF } from '../utils/pdfGenerator';

const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative')
});

const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
  notes: z.string().optional().nullable(),
  items: z.array(challanItemSchema).min(1, 'At least one product item is required')
});

export const getChallans = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string)?.trim() || '';
    const status = (req.query.status as string)?.trim();
    const customerId = req.query.customerId as string;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
        { createdBy: { name: { contains: search } } }
      ];
    }

    const [total, challans] = await Promise.all([
      prisma.salesChallan.count({ where }),
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, mobile: true, email: true }
          },
          createdBy: {
            select: { id: true, name: true, role: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true }
              }
            }
          },
          invoices: {
            select: { id: true, invoiceNumber: true, status: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        challans,
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

export const getChallanById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        items: {
          include: {
            product: true
          }
        },
        invoices: true
      }
    });

    if (!challan) {
      res.status(404).json({ success: false, message: 'Sales Challan not found' });
      return;
    }

    res.json({
      success: true,
      data: challan
    });
  } catch (error) {
    next(error);
  }
};

export const createChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createChallanSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({ where: { id: parsed.customerId } });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Selected customer does not exist' });
      return;
    }

    // Fetch products to build snapshots & validate stock
    const productIds = parsed.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      res.status(400).json({ success: false, message: 'One or more selected products are invalid or no longer exist' });
      return;
    }

    const productMap = new Map(products.map(p => [p.id, p]));

    // If status is CONFIRMED, check stock sufficiency across all items
    if (parsed.status === 'CONFIRMED') {
      const stockErrors: string[] = [];

      for (const item of parsed.items) {
        const prod = productMap.get(item.productId)!;
        if (prod.currentStock < item.quantity) {
          stockErrors.push(
            `Product "${prod.name}" (SKU: ${prod.sku}) has only ${prod.currentStock} in stock, but ${item.quantity} was requested.`
          );
        }
      }

      if (stockErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot confirm challan due to insufficient stock in warehouse',
          errors: stockErrors
        });
        return;
      }
    }

    const challanNumber = await generateChallanNumber();
    let totalQuantity = 0;
    let totalAmount = 0;

    const itemsToCreate = parsed.items.map(item => {
      const prod = productMap.get(item.productId)!;
      const snapshot: ProductSnapshot = {
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        category: prod.category,
        unitPrice: item.unitPrice,
        location: prod.location
      };

      const lineTotal = item.quantity * item.unitPrice;
      totalQuantity += item.quantity;
      totalAmount += lineTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: lineTotal,
        productSnapshot: JSON.stringify(snapshot)
      };
    });

    // Execute atomic transaction
    const createdChallan = await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId: parsed.customerId,
          totalQuantity,
          totalAmount,
          status: parsed.status,
          createdById: req.user!.id,
          notes: parsed.notes || null,
          confirmedAt: parsed.status === 'CONFIRMED' ? new Date() : null,
          items: {
            create: itemsToCreate
          }
        },
        include: {
          items: true,
          customer: true,
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      // If CONFIRMED, deduct stock & create StockMovement records
      if (parsed.status === 'CONFIRMED') {
        for (const item of parsed.items) {
          const prod = productMap.get(item.productId)!;
          
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                decrement: item.quantity
              }
            }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan Dispatch - ${challanNumber} (${customer.businessName})`,
              createdById: req.user!.id
            }
          });
        }
      }

      return challan;
    });

    res.status(201).json({
      success: true,
      message: `Sales Challan ${challanNumber} created successfully in ${parsed.status} state`,
      data: createdChallan
    });
  } catch (error) {
    next(error);
  }
};

export const confirmChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!challan) {
      res.status(404).json({ success: false, message: 'Challan not found' });
      return;
    }

    if (challan.status === 'CONFIRMED') {
      res.status(400).json({ success: false, message: 'Challan is already CONFIRMED' });
      return;
    }

    if (challan.status === 'CANCELLED') {
      res.status(400).json({ success: false, message: 'Cannot confirm a CANCELLED challan' });
      return;
    }

    // Check stock for all items
    const stockErrors: string[] = [];
    for (const item of challan.items) {
      if (item.product.currentStock < item.quantity) {
        stockErrors.push(
          `Product "${item.product.name}" (SKU: ${item.product.sku}) has only ${item.product.currentStock} units in stock, required: ${item.quantity}`
        );
      }
    }

    if (stockErrors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot confirm challan: Insufficient stock available in warehouse',
        errors: stockErrors
      });
      return;
    }

    // Transactional stock deduction
    const updatedChallan = await prisma.$transaction(async (tx) => {
      const confirmed = await tx.salesChallan.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date()
        },
        include: {
          customer: true,
          items: true,
          createdBy: { select: { id: true, name: true, role: true } }
        }
      });

      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity
            }
          }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Sales Challan Confirmation - ${challan.challanNumber} (${challan.customer.businessName})`,
            createdById: req.user!.id
          }
        });
      }

      return confirmed;
    });

    res.json({
      success: true,
      message: `Challan ${challan.challanNumber} has been CONFIRMED and warehouse inventory updated.`,
      data: updatedChallan
    });
  } catch (error) {
    next(error);
  }
};

export const cancelChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true
      }
    });

    if (!challan) {
      res.status(404).json({ success: false, message: 'Challan not found' });
      return;
    }

    if (challan.status === 'CANCELLED') {
      res.status(400).json({ success: false, message: 'Challan is already cancelled' });
      return;
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      // If was previously CONFIRMED, refund stock back!
      if (challan.status === 'CONFIRMED') {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                increment: item.quantity
              }
            }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'IN',
              reason: `Sales Challan Cancelled / Restocked - ${challan.challanNumber}`,
              createdById: req.user!.id
            }
          });
        }
      }

      return tx.salesChallan.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          customer: true,
          items: true
        }
      });
    });

    res.json({
      success: true,
      message: `Challan ${challan.challanNumber} cancelled successfully.${challan.status === 'CONFIRMED' ? ' Stock restored to inventory.' : ''}`,
      data: cancelled
    });
  } catch (error) {
    next(error);
  }
};

export const downloadChallanPDF = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { name: true, role: true }
        },
        items: true
      }
    });

    if (!challan) {
      res.status(404).json({ success: false, message: 'Challan not found' });
      return;
    }

    const pdfDoc = generateChallanPDF(challan as any);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${challan.challanNumber}.pdf"`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};
