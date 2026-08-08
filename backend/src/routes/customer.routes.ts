import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerNote
} from '../controllers/customer.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), getCustomers);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), getCustomerById);
router.post('/', authorizeRoles('ADMIN', 'SALES'), createCustomer);
router.put('/:id', authorizeRoles('ADMIN', 'SALES'), updateCustomer);
router.delete('/:id', authorizeRoles('ADMIN'), deleteCustomer);
router.post('/:id/notes', authorizeRoles('ADMIN', 'SALES'), addCustomerNote);

export default router;
