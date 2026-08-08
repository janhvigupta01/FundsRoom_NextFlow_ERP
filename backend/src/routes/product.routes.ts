import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getStockMovements
} from '../controllers/product.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getProducts);
router.get('/movements/log', getStockMovements);
router.get('/:id', getProductById);
router.post('/', authorizeRoles('ADMIN', 'WAREHOUSE'), createProduct);
router.put('/:id', authorizeRoles('ADMIN', 'WAREHOUSE'), updateProduct);
router.post('/:id/stock', authorizeRoles('ADMIN', 'WAREHOUSE'), adjustStock);

export default router;
