import express from 'express';
import { register, login, updateRole, clerkSync } from '../controllers/auth';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/update-role', protect, authorize('admin'), updateRole);
router.post('/clerk-sync', clerkSync);

export default router;
