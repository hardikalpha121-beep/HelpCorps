import { Router } from 'express';
import * as womenSafetyController from './womenSafety.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, optionalAuth } from '../../middleware/requireAuth.js';
import { instantHelpSchema } from './womenSafety.schema.js';
import { objectIdParamSchema } from '../helpRequests/helpRequest.schema.js';

const router = Router();

// Emergency route — public/anonymous with optional auth
router.post(
  '/instant-help',
  optionalAuth,
  validate({ body: instantHelpSchema }),
  womenSafetyController.instantHelp,
);

router.get('/active-alerts', requireAuth, womenSafetyController.activeAlerts);
router.get('/my-alerts', requireAuth, womenSafetyController.myAlerts);

router.patch(
  '/:id/respond',
  requireAuth,
  validate({ params: objectIdParamSchema }),
  womenSafetyController.respond,
);

router.patch(
  '/:id/resolve',
  requireAuth,
  validate({ params: objectIdParamSchema }),
  womenSafetyController.resolve,
);

export default router;
