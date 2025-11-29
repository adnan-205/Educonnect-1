import express from 'express';
import { register, login, updateRole, updateMyRole, clerkSync } from '../controllers/auth';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/update-role', protect, authorize('admin'), updateRole);
// Allow role selection without authentication (used during onboarding)
// Only allows 'student' or 'teacher' roles, not 'admin'
router.put('/update-my-role', updateMyRole);
router.post('/clerk-sync', clerkSync);

export default router;
