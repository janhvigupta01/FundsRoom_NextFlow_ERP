import { Router } from 'express';
import { login, getMe, getDemoAccounts } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.get('/demo-accounts', getDemoAccounts);

export default router;
