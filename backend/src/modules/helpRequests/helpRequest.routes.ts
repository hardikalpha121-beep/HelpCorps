import { Router } from 'express';
import * as helpRequestController from './helpRequest.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import {
  createHelpRequestSchema,
  listHelpRequestsSchema,
  rateHelpRequestSchema,
  objectIdParamSchema,
} from './helpRequest.schema.js';

const router = Router();

// Public: list help requests (filtered)
router.get('/', validate({ query: listHelpRequestsSchema }), helpRequestController.list);

// Protected routes
router.post(
  '/',
  requireAuth,
  validate({ body: createHelpRequestSchema }),
  helpRequestController.create,
);

router.get('/my', requireAuth, helpRequestController.myRequests);
router.get('/assigned', requireAuth, helpRequestController.assignedToMe);

router.get(
  '/:id',
  validate({ params: objectIdParamSchema }),
  helpRequestController.getById,
);

router.patch(
  '/:id/accept',
  requireAuth,
  validate({ params: objectIdParamSchema }),
  helpRequestController.accept,
);

router.patch(
  '/:id/complete',
  requireAuth,
  validate({ params: objectIdParamSchema }),
  helpRequestController.complete,
);

router.patch(
  '/:id/cancel',
  requireAuth,
  validate({ params: objectIdParamSchema }),
  helpRequestController.cancel,
);

router.patch(
  '/:id/rate',
  requireAuth,
  validate({ params: objectIdParamSchema, body: rateHelpRequestSchema }),
  helpRequestController.rate,
);

export default router;
