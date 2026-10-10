import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import { objectIdParamSchema } from '../helpRequests/helpRequest.schema.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAuth);
router.use(roleGuard('admin'));

router.get('/volunteers', adminController.getVolunteers);
router.get('/kindness-scores', adminController.getKindnessScores);
router.get('/dashboard-stats', adminController.getDashboardStats);
router.patch(
  '/volunteers/:id',
  validate({ params: objectIdParamSchema }),
  adminController.updateVolunteer,
);

export default router;
