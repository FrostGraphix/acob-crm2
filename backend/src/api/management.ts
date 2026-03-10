// ============================================================
// /backend/src/api/management.ts
// Gateway, Customer, Tariff, Account REST routes
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SITES, SiteId } from '../../../common/types/odyssey';
import {
  listGateways, getGateway, createGateway, updateGateway, deleteGateway,
  listCustomers, getCustomer, createCustomer, updateCustomer,
  listTariffs, getTariff, createTariff, updateTariff,
  listAccounts, getAccount, createAccount, updateAccount, deactivateAccount,
  getConsumptionAnalytics, getMeterConsumptionAnalytics,
} from '../services/management-service';
import { getCustomerFullDetails } from '../services/customer-service';
import { listVirtualCustomers } from '../services/virtual-customer-service';

export const managementRouter = Router();

const SiteIdSchema = z.enum(SITES);

// ════════════════════════════════════════════════════════════
// ANALYTICS ROUTES
// ════════════════════════════════════════════════════════════
managementRouter.get('/analytics/consumption', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, meterSN } = req.query as { siteId?: string; meterSN?: string };
    const data = await getConsumptionAnalytics({ siteId, meterSN });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

managementRouter.get('/analytics/meter-consumption', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.query as { siteId?: string };
    const data = await getMeterConsumptionAnalytics({ siteId });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════
// STATS ROUTES (aggregate KPIs for dashboards)
// ════════════════════════════════════════════════════════════
import { tokenDataEngine } from '../services/token-data-engine';

managementRouter.get('/stats/meters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.query as { siteId?: string };
    const data = await tokenDataEngine.getMeterStats(siteId as SiteId | undefined);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

managementRouter.get('/stats/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.query as { siteId?: string };
    const engineStats = await tokenDataEngine.getCustomerStats(siteId as SiteId | undefined);

    // The TokenDataEngine derives 'customers' from unique meters that have bought tokens.
    // To get the true CRM registration count, we fetch the total directly from Odyssey's customer API.
    let trueTotal = engineStats.totalCustomers;
    try {
      const { total } = await listCustomers(1, 1);
      if (total > 0) trueTotal = total;
    } catch (e) {
      // fallback to engine
    }

    res.json({
      success: true,
      data: {
        totalCustomers: trueTotal,
        activeCustomers: engineStats.activeCustomers, // Currently defined as customers with recent token activity
        inactiveCustomers: trueTotal - engineStats.activeCustomers,
        totalRevenue: engineStats.totalRevenue,
        totalTransactions: engineStats.totalTransactions
      }
    });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════
// GATEWAY ROUTES
// ════════════════════════════════════════════════════════════
managementRouter.get('/gateways', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.query as { siteId?: string };
    const data = await listGateways(siteId as SiteId | undefined);
    res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
});

managementRouter.get('/gateways/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.query as { siteId: string };
    if (!siteId) return res.status(400).json({ success: false, error: 'siteId required' });
    const data = await getGateway(req.params.id, siteId as SiteId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

managementRouter.post('/gateways', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      name: z.string().min(1),
      siteId: SiteIdSchema,
      ipAddress: z.string().ip({ version: 'v4' }).or(z.string().min(1)),
      protocol: z.enum(['GPRS', 'Ethernet', 'WiFi', 'RS485', 'LoRa']),
      location: z.string().min(1),
      notes: z.string().optional(),
    }).parse(req.body);
    const data = await createGateway(body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

managementRouter.put('/gateways/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, ...rest } = req.body;
    SiteIdSchema.parse(siteId);
    const data = await updateGateway(req.params.id, rest, siteId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

managementRouter.delete('/gateways/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.query as { siteId: string };
    if (!siteId) return res.status(400).json({ success: false, error: 'siteId required' });
    await deleteGateway(req.params.id, siteId as SiteId);
    res.json({ success: true, message: 'Gateway decommissioned' });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════
// CUSTOMER ROUTES
// ════════════════════════════════════════════════════════════
managementRouter.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || undefined;

    const { data, total } = await listCustomers(page, limit, search);
    res.json({ success: true, data, total });
  } catch (err) { next(err); }
});

managementRouter.get('/customers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getCustomer(req.params.id, 'ALL' as any); // getCustomer in service ignores this anyway, leaving for backwards compat
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

managementRouter.get('/customers/:id/details', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.query as { siteId: string };
    if (!siteId) return res.status(400).json({ success: false, error: 'siteId required' });
    const data = await getCustomerFullDetails(req.params.id, siteId as SiteId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

managementRouter.post('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      name: z.string().min(1),
      accountNumber: z.string().min(1),
      meterSN: z.string().min(1),
      siteId: SiteIdSchema,
      phone: z.string().optional(),
      address: z.string().optional(),
      tariffId: z.string().min(1),
    }).parse(req.body);
    const data = await createCustomer(body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

managementRouter.put('/customers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await updateCustomer(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════
// TARIFF ROUTES
// ════════════════════════════════════════════════════════════
managementRouter.get('/tariffs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.query as { siteId?: string };
    const data = await listTariffs(siteId as SiteId | undefined);
    res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
});

managementRouter.get('/tariffs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.query as { siteId: string };
    if (!siteId) return res.status(400).json({ success: false, error: 'siteId required' });
    const data = await getTariff(req.params.id, siteId as SiteId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

managementRouter.post('/tariffs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      name: z.string().min(1),
      siteId: SiteIdSchema,
      ratePerKwh: z.number().positive(),
      currency: z.string().default('NGN'),
      effectiveFrom: z.string().datetime(),
      effectiveTo: z.string().datetime().optional(),
      approvedBy: z.string().min(1),
    }).parse(req.body);
    const data = await createTariff(body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

managementRouter.put('/tariffs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, ...rest } = req.body;
    SiteIdSchema.parse(siteId);
    const data = await updateTariff(req.params.id, rest, siteId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════
// ACCOUNT ROUTES
// ════════════════════════════════════════════════════════════
managementRouter.get('/accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { data, total } = await listAccounts(page, limit);
    res.json({ success: true, data, total });
  } catch (err) { next(err); }
});

managementRouter.get('/accounts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getAccount(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

managementRouter.post('/accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      customerId: z.string().min(1, 'Customer ID is required'),
      customerName: z.string().optional(),
      meterId: z.string().min(1, 'Meter ID is required'),
      tariffId: z.string().min(1, 'Tariff ID is required'),
    }).parse(req.body);
    const data = await createAccount(body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

managementRouter.put('/accounts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await updateAccount(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

managementRouter.post('/accounts/:id/deactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deactivateAccount(req.params.id, 'system');
    res.json({ success: true, message: 'Account deactivated' });
  } catch (err: any) {
    next(err);
  }
});
