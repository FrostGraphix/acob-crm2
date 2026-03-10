// ============================================================
// /backend/src/api/auth.ts
// Authentication routes — login, refresh, logout, me
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { login, refreshAccessToken, logout, listUsers, listRoles } from '../services/auth-service';

export const authRouter = Router();

// ── POST /api/auth/login ──────────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password } = z
            .object({ username: z.string().min(1), password: z.string().min(1) })
            .parse(req.body);

        const result = await login(username, password);

        res.json({
            success: true,
            data: result,
        });
    } catch (err: any) {
        if (err.statusCode === 401) {
            return res.status(401).json({ success: false, error: err.message });
        }
        if (err.name === 'ZodError') {
            return res.status(400).json({ success: false, error: 'Username and password are required' });
        }
        next(err);
    }
});

// ── POST /api/auth/refresh ────────────────────────────────────
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = z
            .object({ refreshToken: z.string().min(1) })
            .parse(req.body);

        const result = await refreshAccessToken(refreshToken);

        res.json({ success: true, data: result });
    } catch (err: any) {
        if (err.statusCode === 401) {
            return res.status(401).json({ success: false, error: err.message });
        }
        next(err);
    }
});

// ── POST /api/auth/logout ─────────────────────────────────────
authRouter.post('/logout', (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) logout(refreshToken);
    res.json({ success: true, message: 'Logged out' });
});

// ── GET /api/auth/users (Mocked) ─────────────────────────────
authRouter.get('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await listUsers();
        res.json({ success: true, data: users });
    } catch (err) { next(err); }
});

// ── GET /api/auth/roles (Mocked) ─────────────────────────────
authRouter.get('/roles', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roles = await listRoles();
        res.json({ success: true, data: roles });
    } catch (err) { next(err); }
});
