import express from 'express';
import { register, login, updateRole, clerkSync } from '../controllers/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/update-role', updateRole);
router.post('/clerk-sync', clerkSync);

export default router;
