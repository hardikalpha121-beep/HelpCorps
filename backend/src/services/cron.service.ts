import cron from 'node-cron';
import { logger } from '../config/logger.js';
import HelpRequest from '../modules/helpRequests/helpRequest.model.js';
import SafetyAlert from '../modules/womenSafety/safetyAlert.model.js';

/**
 * Initialize all background cron jobs.
 */
export function initializeCronJobs(): void {
  // ── Auto-expire stale pending requests (every hour) ─────────────
  cron.schedule('0 * * * *', async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await HelpRequest.updateMany(
        {
          status: 'pending',
          createdAt: { $lt: twentyFourHoursAgo },
          isDeleted: false,
        },
        {
          status: 'cancelled',
        },
      );

      if (result.modifiedCount > 0) {
        logger.info(`Cron: Auto-cancelled ${result.modifiedCount} stale pending requests`);
      }
    } catch (error) {
      logger.error('Cron error — auto-expire requests:', error);
    }
  });

  // ── Auto-resolve stale safety alerts (every 30 minutes) ─────────
  cron.schedule('*/30 * * * *', async () => {
    try {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

      const result = await SafetyAlert.updateMany(
        {
          status: 'active',
          createdAt: { $lt: sixHoursAgo },
        },
        {
          status: 'resolved',
          resolvedAt: new Date(),
        },
      );

      if (result.modifiedCount > 0) {
        logger.info(`Cron: Auto-resolved ${result.modifiedCount} stale safety alerts`);
      }
    } catch (error) {
      logger.error('Cron error — auto-resolve alerts:', error);
    }
  });

  logger.info('✅ Cron jobs initialized');
}
