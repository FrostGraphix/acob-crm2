// ============================================================
// /backend/src/services/token-service.ts
// Token generation orchestration with validation
// ============================================================
import { odysseyClient } from './odyssey-client';
import { logger } from '../config/logger';
import type { SiteId, CreditTokenRequest, TokenResponse } from '../../../common/types/odyssey';

export async function generateCreditToken(req: CreditTokenRequest): Promise<TokenResponse> {
  logger.info('Generating credit token', {
    meterSN: req.meterSN,
    siteId: req.siteId,
    amount: req.amount,
    operatorId: req.operatorId,
  });

  const result = await odysseyClient.generateCreditToken({
    MeterSN: req.meterSN,
    Amount: req.amount,
    TariffRate: req.tariffRate,
    SITE_ID: req.siteId,
    OperatorId: req.operatorId,
  });

  logger.info('Credit token generated successfully', {
    meterSN: req.meterSN,
    siteId: req.siteId,
    tokenValue: result.TokenValue ?? result.tokenValue,
  });

  return {
    tokenValue: result.TokenValue ?? result.tokenValue ?? '',
    energyUnits: result.EnergyUnits ?? result.energyUnits ?? 0,
    amount: req.amount,
    meterSN: req.meterSN,
    siteId: req.siteId,
    generatedAt: new Date().toISOString(),
  };
}

export async function getCreditTokenRecords(
  siteId: SiteId | 'ALL',
  from: string,
  to: string
) {
  // Use the token data engine's cached snapshot — it already has all transactions
  // fetched reliably via fetchAllSites with proper pagination
  const { tokenDataEngine } = await import('./token-data-engine');
  const snap = await tokenDataEngine.getSnapshot();
  let txs = snap.transactions;

  // Filter by siteId
  if (siteId !== 'ALL') {
    txs = txs.filter(t => t.siteId === siteId);
  }

  // Filter by date range
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999); // Include the full "to" day

  txs = txs.filter(t => {
    if (!t.timestamp) return false;
    const d = new Date(t.timestamp);
    return d >= fromDate && d <= toDate;
  });

  // Map to the expected CreditTokenRecord shape for the frontend
  return txs.map(t => ({
    id: t.id,
    meterSN: t.meterSN,
    siteId: t.siteId,
    customerName: t.customerName,
    accountNo: t.accountNo,
    amount: t.amount,
    kwh: t.kwh,
    tariffRate: t.tariffRate,
    tokenValue: t.tokenValue,
    timestamp: t.timestamp,
  }));
}

export async function generateClearTamperToken(
  meterSN: string, siteId: SiteId, operatorId: string
) {
  logger.info('Generating clear tamper token', { meterSN, siteId });
  return odysseyClient.generateClearTamperToken(meterSN, siteId, operatorId);
}

export async function generateClearCreditToken(
  meterSN: string, siteId: SiteId, operatorId: string
) {
  logger.info('Generating clear credit token', { meterSN, siteId });
  return odysseyClient.generateClearCreditToken(meterSN, siteId, operatorId);
}

export async function generateMaxPowerToken(
  meterSN: string, siteId: SiteId, limitKw: number, operatorId: string
) {
  logger.info('Generating max power limit token', { meterSN, siteId, limitKw });
  return odysseyClient.generateMaxPowerToken(meterSN, siteId, limitKw, operatorId);
}

export async function getClearTamperTokenRecords(siteId: SiteId, from: string, to: string) {
  return odysseyClient.getClearTamperTokenRecords(siteId, from, to);
}

export async function getClearCreditTokenRecords(siteId: SiteId, from: string, to: string) {
  return odysseyClient.getClearCreditTokenRecords(siteId, from, to);
}

export async function getSetMaxPowerTokenRecords(siteId: SiteId, from: string, to: string) {
  return odysseyClient.getSetMaxPowerTokenRecords(siteId, from, to);
}
