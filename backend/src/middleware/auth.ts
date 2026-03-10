// ============================================================
// /backend/src/middleware/auth.ts
// JWT validation middleware for the internal REST API
// ============================================================
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../config/logger';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    roleId: string;
    username?: string;
    scopes?: string[];
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.security.jwtSecret) as any;
    const userId = payload.userId ?? payload.UserId ?? payload.sub;
    const roleId = payload.roleId ?? payload.RoleId;

    if (!userId || !roleId) {
      return res.status(401).json({ success: false, error: 'Invalid token payload' });
    }

    req.user = {
      userId: String(userId),
      roleId: String(roleId),
      username: payload.username ? String(payload.username) : undefined,
      scopes: Array.isArray(payload.scopes) ? payload.scopes.map((s: unknown) => String(s)) : [],
    };
    next();
  } catch {
    logger.warn('Auth middleware: invalid token', { ip: req.ip });
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Development bypass - disabled by default and never active in production.
export function devAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (config.isDev && config.security.enableDevAuthBypass) {
    req.user = {
      userId: '0001',
      roleId: 'Odyssey',
      username: 'dev-admin',
      scopes: ['*'],
    };
    return next();
  }
  return authMiddleware(req, res, next);
}
