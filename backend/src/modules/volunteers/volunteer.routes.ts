import { Router } from 'express';
import * as volunteerController from './volunteer.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import {
  registerVolunteerSchema,
  updateVolunteerSchema,
  nearbyQuerySchema,
} from './volunteer.schema.js';
import { objectIdParamSchema } from '../helpRequests/helpRequest.schema.js';

const router = Router();

// Public: search nearby volunteers
router.get('/nearby', validate({ query: nearbyQuerySchema }), volunteerController.getNearby);

// Public: list volunteers (paginated)
router.get('/', volunteerController.list);

// Public: get volunteer by ID
router.get('/:id', validate({ params: objectIdParamSchema }), volunteerController.getById);

// Protected routes
router.post(
  ['/register', '/'],
  requireAuth,
  validate({ body: registerVolunteerSchema }),
  volunteerController.register,
);

router.get('/profile/me', requireAuth, volunteerController.getMyProfile);

router.patch(
  '/:id',
  requireAuth,
  validate({ params: objectIdParamSchema, body: updateVolunteerSchema }),
  volunteerController.update,
);

export default router;
