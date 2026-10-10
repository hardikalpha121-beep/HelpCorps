import { Router } from 'express';

import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { registerSchema, loginSchema } from './auth.schema.js';



const router = Router();

// ── Email / Password auth ───────────────────────────────────────────────
router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/login', validate({ body: loginSchema }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', requireAuth, authController.logout);


export default router;
