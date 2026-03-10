// ============================================================
// /backend/src/index.ts
// Express application entry point
// ============================================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { logger } from './config/logger';
import { authRouter } from './api/auth';
import { dashboardRouter } from './api/dashboard';
import { tokensRouter } from './api/tokens';
import { managementRouter } from './api/management';
import { reportsRouter } from './api/reports';
import { operationsRouter } from './api/operations';
import { settingsRouter } from './api/settings';
import { diagnosticsRouter } from './api/diagnostics';
import { metersRouter } from './api/meters';
import { notificationRouter } from './api/notifications';

import { accountRouter } from './api/amr-v1/account';
import { customerRouter } from './api/amr-v1/customer';
import { dailyDataMeterRouter } from './api/amr-v1/daily-data-meter';
import { dashboardRouter as amrDashboardRouter } from './api/amr-v1/dashboard';
import { gprsMeterTaskRouter } from './api/amr-v1/gprs-meter-task';
import { stationRouter } from './api/amr-v1/station';
import { gatewayRouter } from './api/amr-v1/gateway';
import { userRouter } from './api/amr-v1/user';
import { tokenRouter } from './api/amr-v1/token';
import { tariffRouter } from './api/amr-v1/tariff';

import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { devAuthMiddleware } from './middleware/auth';

const app = express();

// ── Security headers ─────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────
app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
}));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP logging ──────────────────────────────────────────────
app.use(morgan(config.isDev ? 'dev' : 'combined'));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sites: config.odyssey.sites,
    environment: config.nodeEnv,
  });
});

// ── Public routes ─────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Legacy Protected routes (Backwards compatibility) ─────────
app.use('/api/dashboard', devAuthMiddleware, dashboardRouter);
app.use('/api/tokens', devAuthMiddleware, tokensRouter);
app.use('/api/management', devAuthMiddleware, managementRouter);
app.use('/api/reports', devAuthMiddleware, reportsRouter);
app.use('/api/operations', devAuthMiddleware, operationsRouter);
app.use('/api/settings', devAuthMiddleware, settingsRouter);
app.use('/api/diagnostics', devAuthMiddleware, diagnosticsRouter);
app.use('/api/meters', devAuthMiddleware, metersRouter);
app.use('/api/notifications', devAuthMiddleware, notificationRouter);

// ── AMR API V1 Standardized Routes ─────────────────────────────
app.use('/api/account', devAuthMiddleware, accountRouter);
app.use('/api/customer', devAuthMiddleware, customerRouter);
app.use('/api/DailyDataMeter', devAuthMiddleware, dailyDataMeterRouter);
// Note: Swagger uses /api/dashboard for both groups. 
// We should probably merge these or use sub-routes if they collide.
// For now, amrDashboardRouter is mounted second, potentially overriding.
app.use('/api/dashboard', devAuthMiddleware, amrDashboardRouter);
app.use('/api/GPRSMeterTask', devAuthMiddleware, gprsMeterTaskRouter);
app.use('/api/station', devAuthMiddleware, stationRouter);
app.use('/api/gateway', devAuthMiddleware, gatewayRouter);
app.use('/api/user', devAuthMiddleware, userRouter);
app.use('/api/token', devAuthMiddleware, tokenRouter);
app.use('/api/tariff', devAuthMiddleware, tariffRouter);

// ── 404 & Error handlers ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────
app.listen(config.port, () => {
  logger.info(`ACOB Odyssey backend running on port ${config.port}`, {
    environment: config.nodeEnv,
    sites: config.odyssey.sites,
    odysseyApi: config.odyssey.baseUrl,
  });

  // Start the automated API Health Probe defined in SOP
  import('./services/health-probe-service').then(({ healthProbeService }) => {
    healthProbeService.startCron();
  });

  // Start the Live Data Notification Analysis Engine
  import('./services/analysis-engine').then(({ analysisEngine }) => {
    analysisEngine.startCron();

    // Also trigger an immediate run right after boot (with a small delay for token engine to warm up)
    setTimeout(() => {
      analysisEngine.runAnalysis().catch(err => logger.error('Initial Analysis Error', err));
    }, 15000);
  });
});

export default app;
