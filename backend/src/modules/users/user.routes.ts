import { Router } from 'express';
import * as userController from './user.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { updateUserSchema, deleteAccountSchema } from './user.schema.js';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

router.get('/me', userController.getMe);
router.patch('/me', validate({ body: updateUserSchema }), userController.updateMe);
router.delete('/me', validate({ body: deleteAccountSchema }), userController.deleteMe);
router.get('/me/export', userController.exportData);

export default router;
