// ============================================================
// /backend/src/config/index.ts
// Centralised config - all env vars validated here
// ============================================================
import dotenv from 'dotenv';
import { SITES, SiteId } from '../../../common/types/odyssey';

dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function optionalBoolean(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

const nodeEnv = optional('NODE_ENV', 'production');
const isDev = nodeEnv === 'development';
const DEV_DEFAULT_JWT_SECRET = 'local-dev-jwt-secret-change-me';
const jwtSecret = isDev
  ? optional('JWT_SECRET', DEV_DEFAULT_JWT_SECRET)
  : required('JWT_SECRET');

if (!isDev && jwtSecret === DEV_DEFAULT_JWT_SECRET) {
  throw new Error('JWT_SECRET must be set to a strong value outside development.');
}

export const config = {
  port: parseInt(optional('PORT', '4000'), 10),
  nodeEnv,
  isDev,

  odyssey: {
    baseUrl: optional('ODYSSEY_API_BASE_URL', 'http://8.208.16.168:9310/api'),
    jwtToken: optional('ODYSSEY_JWT_TOKEN', ''),
    tokenExpiryBuffer: parseInt(optional('ODYSSEY_TOKEN_EXPIRY_BUFFER_SECONDS', '60'), 10),
    sites: (optional('ODYSSEY_SITES', 'KYAKALE,MUSHA,UMAISHA,TUNGA,OGUFA')
      .split(',')
      .map(s => s.trim()) as SiteId[]),
  },

  security: {
    jwtSecret,
    corsOrigin: optional('CORS_ORIGIN', 'http://localhost:5173'),
    enableDevAuthBypass: optionalBoolean('ENABLE_DEV_AUTH_BYPASS', false),
  },

  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '60000'), 10),
    max: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  },

  auth: {
    operatorsJson: optional('AUTH_OPERATORS_JSON', ''),
  },

  log: {
    level: optional('LOG_LEVEL', 'info'),
  },
  weather: {
    apiKey: optional('OPENWEATHER_API_KEY', ''),
  },
} as const;

// Validate sites
config.odyssey.sites.forEach(site => {
  if (!SITES.includes(site as any)) {
    throw new Error(`Invalid SITE_ID in config: ${site}. Must be one of: ${SITES.join(', ')}`);
  }
});
