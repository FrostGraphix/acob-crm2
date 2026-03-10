/**
 * test-all-endpoints.ts — Comprehensive Odyssey API probe script
 * Tests every known Odyssey endpoint and reports which return data.
 *
 * Usage: npx tsx backend/test-all-endpoints.ts
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env' });

import axios from 'axios';

const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
const TOKEN = process.env.ODYSSEY_JWT_TOKEN;
const SITES = ['KYAKALE', 'MUSHA', 'UMAISHA', 'TUNGA', 'OGUFA'];
const FROM = '2025-01-01T00:00:00.000Z';
const TO = '2027-01-01T00:00:00.000Z';
const SITE = SITES[0]; // Use first site for single-site tests

const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

interface ProbeResult {
    name: string;
    method: string;
    path: string;
    status: 'OK' | 'EMPTY' | 'ERROR';
    recordCount: number;
    topKeys: string[];
    error?: string;
    sampleRecord?: any;
}

const results: ProbeResult[] = [];

async function probe(
    name: string,
    method: 'GET' | 'POST',
    path: string,
    bodyOrParams: Record<string, any> = {},
    queryParams: Record<string, any> = {}
) {
    try {
        let res: any;
        if (method === 'GET') {
            res = await axios.get(`${BASE_URL}${path}`, { headers, params: { ...bodyOrParams, ...queryParams } });
        } else {
            res = await axios.post(`${BASE_URL}${path}`, bodyOrParams, { headers, params: queryParams });
        }

        const data = res.data;
        const topKeys = Object.keys(data || {});

        // Try to extract the actual records array
        let records: any[] = [];
        if (Array.isArray(data)) records = data;
        else if (data?.payments) records = data.payments;
        else if (data?.result?.data) records = data.result.data;
        else if (data?.Data) records = Array.isArray(data.Data) ? data.Data : [data.Data];
        else if (data?.data) records = Array.isArray(data.data) ? data.data : [data.data];
        else if (data?.events) records = data.events;
        else if (data?.readings) records = data.readings;

        const result: ProbeResult = {
            name,
            method,
            path,
            status: records.length > 0 ? 'OK' : 'EMPTY',
            recordCount: records.length,
            topKeys,
            sampleRecord: records.length > 0 ? records[0] : undefined,
        };
        results.push(result);

        const icon = result.status === 'OK' ? '✅' : '⚠️';
        console.log(`${icon} ${name} | ${method} ${path} | ${records.length} records | keys: ${topKeys.join(', ')}`);
        if (records.length > 0) {
            console.log(`   Record keys: ${Object.keys(records[0]).join(', ')}`);
        }
    } catch (err: any) {
        const result: ProbeResult = {
            name,
            method,
            path,
            status: 'ERROR',
            recordCount: 0,
            topKeys: [],
            error: `${err.response?.status ?? 'NETWORK'}: ${err.message}`,
        };
        results.push(result);
        console.log(`❌ ${name} | ${method} ${path} | ${result.error}`);
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  ODYSSEY API ENDPOINT PROBE');
    console.log(`  Base URL: ${BASE_URL}`);
    console.log(`  Test Site: ${SITE}`);
    console.log('═══════════════════════════════════════════════════\n');

    // ── TOKEN RECORDS ──────────────────────────────────────────
    console.log('\n── TOKEN RECORDS ──');
    await probe('Credit Token Records (readMore)', 'GET', '/token/creditTokenRecord/readMore',
        { SITE_ID: SITE, FROM, TO, pageLimit: 5 });
    await probe('Credit Token Records (read POST)', 'POST', '/token/creditTokenRecord/read',
        { FROM, TO, pageSize: 5, pageNum: 1 }, { SITE_ID: SITE });

    // ── CUSTOMER / METER / TARIFF / GATEWAY ────────────────────
    console.log('\n── ENTITY DATA ──');
    await probe('Customer Read', 'POST', '/customer/read', { pageSize: 5, pageNum: 1 });
    await probe('Meter Read', 'POST', '/meter/read', { pageSize: 5, pageNum: 1 });
    await probe('Tariff Read', 'POST', '/tariff/read', { pageSize: 5, pageNum: 1 });
    await probe('Gateway Read', 'POST', '/gateway/read', { pageSize: 5, pageNum: 1 });
    await probe('Account Read', 'POST', '/account/read', { pageSize: 5, pageNum: 1 });

    // ── PREPAY REPORTS ─────────────────────────────────────────
    console.log('\n── PREPAY REPORTS ──');
    await probe('Long Non-Purchase', 'POST', '/PrepayReport/LongNonpurchaseSituation',
        { DayThreshold: 30 }, { SITE_ID: SITE });
    await probe('Low Purchase', 'POST', '/PrepayReport/LowPurchaseSituation',
        { AmountThreshold: 500 }, { SITE_ID: SITE });
    await probe('Consumption Statistics', 'POST', '/PrepayReport/ConsumptionStatistics',
        { FROM, TO }, { SITE_ID: SITE });

    // ── AMR DATA ───────────────────────────────────────────────
    console.log('\n── AMR DATA ──');
    await probe('Hourly Data (readHourly)', 'GET', '/DailyDataMeter/readHourly',
        { SITE_ID: SITE, FROM, TO, pageLimit: 5 });
    await probe('Daily Data (read)', 'POST', '/DailyDataMeter/read',
        { FROM, TO, pageSize: 5, pageNum: 1 }, { SITE_ID: SITE });

    // ── EVENTS ─────────────────────────────────────────────────
    console.log('\n── EVENTS ──');
    await probe('Event Notifications', 'POST', '/EventNotification/Read',
        { FROM, TO }, { SITE_ID: SITE });

    // ── GPRS STATUS ────────────────────────────────────────────
    console.log('\n── GPRS ──');
    await probe('GPRS Online Status', 'POST', '/GPRSOnlineStatus/Read', { SITE_ID: SITE });

    // ── DASHBOARD ──────────────────────────────────────────────
    console.log('\n── NATIVE DASHBOARD ──');
    await probe('Dashboard Panel Group', 'POST', '/dashboard/readPanelGroup', { SITE_ID: SITE });
    await probe('Dashboard Line Chart', 'POST', '/dashboard/readLineChart',
        { SITE_ID: SITE, FROM, TO });

    // ── ENERGY CURVES ──────────────────────────────────────────
    console.log('\n── ENERGY CURVES ──');
    await probe('Instantaneous Values', 'GET', '/RemoteReport/instantaneousValues',
        { SITE_ID: SITE, MeterSN: '47005309647' });

    // ── SETTINGS ───────────────────────────────────────────────
    console.log('\n── SETTINGS ──');
    await probe('Station Read', 'POST', '/station/read',
        { pageSize: 5, pageNum: 1 }, { SITE_ID: SITE });
    await probe('Role Read', 'POST', '/role/read', { pageSize: 5, pageNum: 1 });
    await probe('User Read (POST /user/read)', 'POST', '/user/read', { pageSize: 5, pageNum: 1 });
    await probe('User Read (GET /Setting/user)', 'GET', '/Setting/user');
    await probe('Log Read', 'POST', '/log/read', { pageSize: 5, pageNum: 1 });
    await probe('Log Read (capital L)', 'POST', '/Log/read', { pageSize: 5, pageNum: 1 });

    // ── SUMMARY ────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    const ok = results.filter(r => r.status === 'OK');
    const empty = results.filter(r => r.status === 'EMPTY');
    const errors = results.filter(r => r.status === 'ERROR');

    console.log(`  ✅ OK:    ${ok.length} endpoints returning data`);
    console.log(`  ⚠️ EMPTY: ${empty.length} endpoints returning no records`);
    console.log(`  ❌ ERROR: ${errors.length} endpoints failing`);

    if (errors.length > 0) {
        console.log('\n  Failed endpoints:');
        for (const e of errors) {
            console.log(`    ❌ ${e.name}: ${e.error}`);
        }
    }

    if (empty.length > 0) {
        console.log('\n  Empty endpoints (no records returned):');
        for (const e of empty) {
            console.log(`    ⚠️ ${e.name} (${e.method} ${e.path})`);
        }
    }

    // Save full results
    const fs = await import('fs');
    fs.writeFileSync('endpoint-probe-results.json', JSON.stringify(results, null, 2));
    console.log('\n  Full results saved to endpoint-probe-results.json');
}

main().catch(err => {
    console.error('Probe script failed:', err.message);
    process.exit(1);
});
