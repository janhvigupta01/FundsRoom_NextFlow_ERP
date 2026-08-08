import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../types';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'mini_erp_crm_super_secret_jwt_key_2026';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      jwtSecret as jwt.Secret,
      { expiresIn: (jwtExpiresIn as any) || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const getDemoAccounts = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: [
      { role: 'ADMIN', email: 'admin@erp.com', password: 'password123', label: 'Admin (Full Access)' },
      { role: 'SALES', email: 'sales@erp.com', password: 'password123', label: 'Sales (CRM & Challans)' },
      { role: 'WAREHOUSE', email: 'warehouse@erp.com', password: 'password123', label: 'Warehouse (Stock & Inventory)' },
      { role: 'ACCOUNTS', email: 'accounts@erp.com', password: 'password123', label: 'Accounts (Billing & Invoices)' }
    ]
  });
};
