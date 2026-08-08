import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../types';
import { generateInvoiceNumber } from '../utils/numberGenerators';

const createInvoiceSchema = z.object({
  challanId: z.string().min(1, 'Challan ID is required'),
  taxPercent: z.number().min(0).max(100).default(18), // Default 18% GST
  dueDate: z.string().optional().nullable()
});

export const getInvoices = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const status = req.query.status as string;
    const search = (req.query.search as string)?.trim() || '';

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
        { challan: { challanNumber: { contains: search } } }
      ];
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, mobile: true, email: true, gstNumber: true }
          },
          challan: {
            select: { id: true, challanNumber: true, status: true, totalQuantity: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        invoices,
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

export const createInvoiceFromChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { challanId, taxPercent, dueDate } = createInvoiceSchema.parse(req.body);

    const challan = await prisma.salesChallan.findUnique({
      where: { id: challanId },
      include: {
        customer: true,
        invoices: true
      }
    });

    if (!challan) {
      res.status(404).json({ success: false, message: 'Challan not found' });
      return;
    }

    if (challan.status !== 'CONFIRMED') {
      res.status(400).json({ success: false, message: 'Invoices can only be generated for CONFIRMED challans' });
      return;
    }

    const invoiceNumber = await generateInvoiceNumber();
    const subTotal = challan.totalAmount;
    const taxAmount = (subTotal * taxPercent) / 100;
    const grandTotal = subTotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        challanId,
        customerId: challan.customerId,
        subTotal,
        taxAmount,
        grandTotal,
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // Default Net 15
      },
      include: {
        customer: true,
        challan: true
      }
    });

    res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNumber} created successfully`,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvoiceStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be PENDING, PAID, or CANCELLED' });
      return;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      message: `Invoice status updated to ${status}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
