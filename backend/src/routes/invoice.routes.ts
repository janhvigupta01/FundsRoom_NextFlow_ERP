import { Router } from 'express';
import {
  getInvoices,
  createInvoiceFromChallan,
  updateInvoiceStatus
} from '../controllers/invoice.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('ADMIN', 'ACCOUNTS', 'SALES'), getInvoices);
router.post('/', authorizeRoles('ADMIN', 'ACCOUNTS'), createInvoiceFromChallan);
router.put('/:id/status', authorizeRoles('ADMIN', 'ACCOUNTS'), updateInvoiceStatus);

export default router;
