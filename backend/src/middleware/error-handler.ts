// ============================================================
// /backend/src/middleware/error-handler.ts
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.response?.status ?? err.status ?? 500;
  const message = err.response?.data?.message ?? err.message ?? 'Internal server error';

  logger.error('Unhandled error', {
    status,
    message,
    url: req.url,
    method: req.method,
    stack: err.stack,
  });

  res.status(status >= 100 && status < 600 ? status : 500).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.url} not found` });
}
