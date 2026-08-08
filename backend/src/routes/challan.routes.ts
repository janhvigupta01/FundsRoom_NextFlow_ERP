import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  confirmChallan,
  cancelChallan,
  downloadChallanPDF
} from '../controllers/challan.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.get('/:id/pdf', downloadChallanPDF);
router.post('/', authorizeRoles('ADMIN', 'SALES'), createChallan);
router.post('/:id/confirm', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE'), confirmChallan);
router.post('/:id/cancel', authorizeRoles('ADMIN', 'SALES'), cancelChallan);

export default router;
