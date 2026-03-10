// ============================================================
// /backend/src/services/auth-service.ts
// Authentication - JWT issuing, validation, refresh
// ============================================================
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../config/logger';

export interface AuthUser {
  id: string;
  username: string;
  roleId: string;
  operatorName: string;
  scopes: string[];
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

interface OperatorCredential {
  username: string;
  password: string;
  user: AuthUser;
}

const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Active refresh tokens (in production, store in Redis)
const refreshTokens = new Set<string>();
let cachedOperators: OperatorCredential[] | null = null;

function parseOperatorsFromEnv(): OperatorCredential[] {
  const raw = config.auth.operatorsJson.trim();
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('AUTH_OPERATORS_JSON must be valid JSON.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AUTH_OPERATORS_JSON must be a JSON array.');
  }

  return parsed.map((entry, index) => {
    const rec = entry as any;
    const username = String(rec?.username ?? '').trim();
    const password = String(rec?.password ?? '');
    const id = String(rec?.user?.id ?? '').trim();
    const roleId = String(rec?.user?.roleId ?? '').trim();
    const operatorName = String(rec?.user?.operatorName ?? username).trim();
    const scopes = Array.isArray(rec?.user?.scopes)
      ? rec.user.scopes.map((s: unknown) => String(s))
      : [];

    if (!username || !password || !id || !roleId) {
      throw new Error(`Invalid AUTH_OPERATORS_JSON entry at index ${index}.`);
    }

    return {
      username,
      password,
      user: { id, username, roleId, operatorName, scopes },
    } as OperatorCredential;
  });
}

function getOperators(): OperatorCredential[] {
  if (cachedOperators) return cachedOperators;

  const envOperators = parseOperatorsFromEnv();
  if (envOperators.length > 0) {
    cachedOperators = envOperators;
    return cachedOperators;
  }

  if (config.isDev) {
    logger.warn('No AUTH_OPERATORS_JSON found. Using development fallback authentication mode.');
    cachedOperators = [];
    return cachedOperators;
  }

  throw new Error('No auth operators configured. Set AUTH_OPERATORS_JSON for non-development environments.');
}

function issueTokenPair(user: AuthUser): TokenPair {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
      scopes: user.scopes,
    },
    config.security.jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY, issuer: 'acob-odyssey' }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
      scopes: user.scopes,
      type: 'refresh',
    },
    config.security.jwtSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRY, issuer: 'acob-odyssey' }
  );

  refreshTokens.add(refreshToken);

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
    user,
  };
}

export async function login(username: string, password: string): Promise<TokenPair> {
  const operators = getOperators();
  const account = operators.find(
    op => op.username === username && op.password === password
  );

  if (account) {
    logger.info('User logged in', { username, roleId: account.user.roleId });
    return issueTokenPair(account.user);
  }

  // Development fallback: allow local sandbox login without hardcoded source credentials.
  if (config.isDev && operators.length === 0 && username.trim() && password.trim()) {
    const devUser: AuthUser = {
      id: '0001',
      username: username.trim(),
      roleId: 'Odyssey',
      operatorName: 'Development Operator',
      scopes: ['*'],
    };
    logger.warn('Development fallback login used', { username: devUser.username });
    return issueTokenPair(devUser);
  }

  throw Object.assign(new Error('Invalid username or password'), { statusCode: 401 });
}

export async function refreshAccessToken(token: string): Promise<{ accessToken: string; expiresIn: number }> {
  if (!refreshTokens.has(token)) {
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
  }

  try {
    const payload = jwt.verify(token, config.security.jwtSecret) as any;
    if (payload?.type !== 'refresh') {
      throw new Error('Invalid refresh token type');
    }

    const operators = getOperators();
    let user: AuthUser | undefined;

    if (operators.length > 0) {
      user = operators.find(op => op.user.id === payload.userId)?.user;
    } else if (config.isDev) {
      user = {
        id: String(payload.userId),
        username: String(payload.username ?? 'developer'),
        roleId: String(payload.roleId ?? 'Odyssey'),
        operatorName: 'Development Operator',
        scopes: Array.isArray(payload.scopes) ? payload.scopes.map((s: unknown) => String(s)) : ['*'],
      };
    }

    if (!user) throw new Error('User not found');

    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roleId: user.roleId,
        scopes: user.scopes,
      },
      config.security.jwtSecret,
      { expiresIn: ACCESS_TOKEN_EXPIRY, issuer: 'acob-odyssey' }
    );

    return { accessToken, expiresIn: 3600 };
  } catch {
    refreshTokens.delete(token);
    throw Object.assign(new Error('Refresh token expired'), { statusCode: 401 });
  }
}

export function verifyToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, config.security.jwtSecret) as any;
    return {
      id: payload.userId,
      username: payload.username,
      roleId: payload.roleId,
      operatorName: payload.username,
      scopes: payload.scopes ?? [],
    };
  } catch {
    throw Object.assign(new Error('Invalid or expired token'), { statusCode: 401 });
  }
}

export function logout(refreshToken: string): void {
  refreshTokens.delete(refreshToken);
}

export async function listUsers() {
  const operators = getOperators();
  if (operators.length === 0 && config.isDev) {
    return [{
      userName: 'developer',
      roleName: 'Odyssey',
      staffNo: '0001',
      mobile: 'N/A',
      remark: 'Development Operator',
      stationId: 'ALL',
    }];
  }

  return operators.map(op => ({
    userName: op.username,
    roleName: op.user.roleId,
    staffNo: op.user.id,
    mobile: 'N/A',
    remark: op.user.operatorName,
    stationId: 'ALL',
  }));
}

export async function listRoles() {
  const operators = getOperators();
  const roles = Array.from(new Set(
    (operators.length === 0 && config.isDev ? ['Odyssey'] : operators.map(op => op.user.roleId))
  ));

  return roles.map(role => ({
    roleId: role,
    roleName: role,
    remark: 'System Role',
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
  }));
}
