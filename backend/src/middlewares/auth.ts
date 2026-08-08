import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, UserRole, AuthUser } from '../types';
import prisma from '../prisma';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'mini_erp_crm_super_secret_jwt_key_2026';

  try {
    const payload = jwt.verify(token, jwtSecret) as { id: string; role: UserRole };
    
    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid or expired session user' });
      return;
    }

    req.user = user as AuthUser;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
    return;
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Your role (${req.user.role}) does not have permission to perform this action. Required: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};
