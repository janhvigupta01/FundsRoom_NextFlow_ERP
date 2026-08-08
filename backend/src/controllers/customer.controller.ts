import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../types';

const customerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  mobile: z.string().min(5, 'Valid mobile number required'),
  email: z.string().email('Valid email address required'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'], {
    errorMap: () => ({ message: 'Type must be RETAIL, WHOLESALE, or DISTRIBUTOR' })
  }),
  address: z.string().min(3, 'Address is required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('ACTIVE'),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

const noteSchema = z.object({
  note: z.string().min(1, 'Note content cannot be empty'),
  followUpDate: z.string().optional().nullable()
});

export const getCustomers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string)?.trim() || '';
    const status = (req.query.status as string)?.trim();
    const customerType = (req.query.customerType as string)?.trim();

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (customerType && customerType !== 'ALL') {
      where.customerType = customerType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { businessName: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
        { gstNumber: { contains: search } }
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { challans: true, followUpLogs: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        customers,
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

export const getCustomerById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUpLogs: {
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        challans: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true }
            }
          }
        },
        invoices: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = customerSchema.parse(req.body);

    const customer = await prisma.customer.create({
      data: {
        name: parsed.name,
        mobile: parsed.mobile,
        email: parsed.email.toLowerCase().trim(),
        businessName: parsed.businessName,
        gstNumber: parsed.gstNumber || null,
        customerType: parsed.customerType,
        address: parsed.address,
        status: parsed.status,
        followUpDate: parsed.followUpDate ? new Date(parsed.followUpDate) : null,
        notes: parsed.notes || null,
        followUpLogs: parsed.notes && req.user ? {
          create: {
            note: `Initial Note: ${parsed.notes}`,
            createdById: req.user.id
          }
        } : undefined
      }
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = customerSchema.partial().parse(req.body);

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...parsed,
        followUpDate: parsed.followUpDate !== undefined 
          ? (parsed.followUpDate ? new Date(parsed.followUpDate) : null)
          : existing.followUpDate
      }
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if customer has associated challans
    const challanCount = await prisma.salesChallan.count({ where: { customerId: id } });
    if (challanCount > 0) {
      // Soft-delete / Inactive instead of breaking foreign keys
      const updated = await prisma.customer.update({
        where: { id },
        data: { status: 'INACTIVE' }
      });
      res.json({
        success: true,
        message: 'Customer has active orders and was set to INACTIVE status.',
        data: updated
      });
      return;
    }

    await prisma.customer.delete({ where: { id } });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addCustomerNote = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { note, followUpDate } = noteSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const createdNote = await prisma.$transaction(async (tx) => {
      const newNote = await tx.customerNote.create({
        data: {
          customerId: id,
          note,
          createdById: req.user!.id
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      if (followUpDate !== undefined) {
        await tx.customer.update({
          where: { id },
          data: {
            followUpDate: followUpDate ? new Date(followUpDate) : null
          }
        });
      }

      return newNote;
    });

    res.status(201).json({
      success: true,
      message: 'Follow-up note logged successfully',
      data: createdNote
    });
  } catch (error) {
    next(error);
  }
};
