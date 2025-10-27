import express from 'express';
import { protect, authorize } from '../middleware/auth';
import { listUsers, getUserByAdmin, listActivities, getUserActivities, getClassAnalytics } from '../controllers/admin';

const router = express.Router();

router.get('/users', protect, authorize('admin'), listUsers);
router.get('/users/:id', protect, authorize('admin'), getUserByAdmin);
router.get('/activities', protect, authorize('admin'), listActivities);
router.get('/users/:id/activities', protect, authorize('admin'), getUserActivities);
router.get('/analytics/classes', protect, authorize('admin'), getClassAnalytics);

export default router;
