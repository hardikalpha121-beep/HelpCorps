import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initializeSocketIO } from './sockets/index.js';
import { initializeCronJobs } from './services/cron.service.js';
import { initializeEmail } from './services/email.service.js';
import { logger } from './config/logger.js';

async function startServer(): Promise<void> {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create HTTP server
  const httpServer = createServer(app);

  // 3. Initialize Socket.io
  initializeSocketIO(httpServer);

  // 4. Initialize email service
  initializeEmail();

  // 5. Start cron jobs
  initializeCronJobs();

  // 6. Start listening
  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 HelpCorps server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`   Health: http://localhost:${env.PORT}/health`);
    logger.info(`   API:    http://localhost:${env.PORT}/api/v1`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} received — shutting down gracefully...`);
    httpServer.close(async () => {
      await disconnectDB();
      logger.info('Server closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled rejections/exceptions
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
