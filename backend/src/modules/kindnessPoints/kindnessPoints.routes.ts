import { Router } from 'express';
import * as kindnessController from './kindnessPoints.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

// Public: leaderboard
router.get('/leaderboard', kindnessController.getLeaderboard);

// Protected: my points and history
router.get('/my-points', requireAuth, kindnessController.getMyPoints);
router.get('/history', requireAuth, kindnessController.getHistory);

export default router;
