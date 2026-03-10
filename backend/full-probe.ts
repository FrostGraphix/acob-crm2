import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
const TOKEN = process.env.ODYSSEY_JWT_TOKEN;

interface ProbeResult {
    name: string;
    path: string;
    method: string;
    status: number | string;
    recordCount: number;
    sampleKeys: string[];
    error?: string;
}

// All endpoints derived from JWT scope analysis + known Odyssey REST patterns
const probes = [
    // ── Token Records ──
    { name: 'Credit Token Records', path: '/token/creditTokenRecord/readMore', method: 'GET' },
    { name: 'Clear Tamper Token Records', path: '/token/clearTamperTokenRecord/readMore', method: 'GET' },
    { name: 'Clear Credit Token Records', path: '/token/clearCreditTokenRecord/readMore', method: 'GET' },
    { name: 'MaxPower Limit Token Records', path: '/token/setMaximumPowerLimitTokenRecord/readMore', method: 'GET' },
    { name: 'Change Meter Key Token Records', path: '/token/changeMeterKeyTokenRecord/readMore', method: 'GET' },

    // ── Meter Data (AMR) ──
    { name: 'Hourly Meter Data', path: '/DailyDataMeter/readHourly', method: 'GET' },
    { name: 'Daily Data', path: '/DailyDataMeter/readDaily', method: 'GET' },
    { name: 'Monthly Data', path: '/DailyDataMeter/readMonthly', method: 'GET' },

    // ── Remote Reports ──
    { name: 'GPRS Online Status', path: '/RemoteReport/GPRSOnlineStatus', method: 'GET' },
    { name: 'Event Notification', path: '/RemoteReport/eventNotification', method: 'GET' },
    { name: 'Electric Energy Curve', path: '/RemoteReport/electricEnergyCurve', method: 'GET' },
    { name: 'Instantaneous Value Curve', path: '/RemoteReport/instantaneousValueCurve', method: 'GET' },
    { name: 'Remote Daily Data', path: '/RemoteReport/dailyData', method: 'GET' },
    { name: 'Remote Monthly Data', path: '/RemoteReport/monthlyData', method: 'GET' },

    // ── Prepay Reports ──
    { name: 'Long Non-Purchase', path: '/PrepayReport/longNonpurchaseSituation', method: 'POST' },
    { name: 'Low Purchase', path: '/PrepayReport/lowPurchaseSituation', method: 'POST' },
    { name: 'Consumption Statistics', path: '/PrepayReport/consumptionStatistics', method: 'GET' },

    // ── Management ──
    { name: 'Management: Meters', path: '/Management/meter', method: 'GET' },
    { name: 'Management: Customers', path: '/Management/customer', method: 'GET' },
    { name: 'Management: Gateways', path: '/Management/gateway', method: 'GET' },
    { name: 'Management: Tariffs', path: '/Management/tariff', method: 'GET' },
    { name: 'Management: Debts', path: '/Management/debt', method: 'GET' },
    { name: 'Management: Accounts', path: '/Management/account', method: 'GET' },

    // ── Settings ──
    { name: 'Setting: Stations', path: '/Setting/station', method: 'GET' },
    { name: 'Setting: Roles', path: '/Setting/role', method: 'GET' },
    { name: 'Setting: Users', path: '/Setting/user', method: 'GET' },
    { name: 'Setting: Logs', path: '/Setting/log', method: 'GET' },
    { name: 'Setting: Items', path: '/Setting/item', method: 'GET' },

    // ── Remote Tasks ──
    { name: 'Remote Task Records (Reading)', path: '/RemoteMeterTaskRecord/getReadingTask', method: 'GET' },
];

async function fullProbe() {
    const results: ProbeResult[] = [];
    const SITE = 'KYAKALE';
    const FROM = '2025-01-01T00:00:00.000Z';
    const TO = '2026-12-31T00:00:00.000Z';

    console.log('============================================================');
    console.log('FULL ODYSSEY API ENDPOINT PROBE');
    console.log(`Site: ${SITE} | From: ${FROM} | To: ${TO}`);
    console.log('============================================================\n');

    for (const p of probes) {
        try {
            let res;
            if (p.method === 'POST') {
                res = await axios.post(`${BASE_URL}${p.path}`, {}, {
                    headers: { Authorization: `Bearer ${TOKEN}` },
                    params: { SITE_ID: SITE, pageLimit: 5 },
                    timeout: 10000
                });
            } else {
                res = await axios.get(`${BASE_URL}${p.path}`, {
                    headers: { Authorization: `Bearer ${TOKEN}` },
                    params: { SITE_ID: SITE, pageLimit: 5, FROM, TO },
                    timeout: 10000
                });
            }

            // Extract records from response
            let records: any[] = [];
            const data = res.data;
            if (Array.isArray(data)) {
                records = data;
            } else if (data && typeof data === 'object') {
                for (const key of ['payments', 'readings', 'records', 'events', 'data', 'Data', 'items', 'meter', 'customer', 'gateway', 'tariff', 'debt', 'account', 'station', 'role', 'user', 'log']) {
                    if (Array.isArray(data[key])) { records = data[key]; break; }
                }
                if (records.length === 0) {
                    const arrKey = Object.keys(data).find(k => Array.isArray(data[k]));
                    if (arrKey) records = data[arrKey];
                }
            }

            const sampleKeys = records.length > 0 ? Object.keys(records[0]) : (typeof data === 'object' && data !== null ? Object.keys(data) : []);

            const result: ProbeResult = {
                name: p.name,
                path: p.path,
                method: p.method,
                status: res.status,
                recordCount: records.length,
                sampleKeys,
            };
            results.push(result);
            console.log(`✅ ${p.name} → ${res.status} | ${records.length} records | Keys: [${sampleKeys.slice(0, 8).join(', ')}]`);

        } catch (err: any) {
            const status = err.response?.status || err.code || 'TIMEOUT';
            const result: ProbeResult = {
                name: p.name,
                path: p.path,
                method: p.method,
                status,
                recordCount: 0,
                sampleKeys: [],
                error: err.message?.substring(0, 100),
            };
            results.push(result);
            console.log(`❌ ${p.name} → ${status} | ${err.message?.substring(0, 60)}`);
        }
    }

    // Summary
    console.log('\n\n============================================================');
    console.log('PROBE SUMMARY');
    console.log('============================================================');
    const working = results.filter(r => r.status === 200);
    const broken = results.filter(r => r.status !== 200);
    console.log(`\n✅ WORKING (${working.length}):`);
    working.forEach(r => console.log(`   ${r.name} → ${r.recordCount} records [${r.sampleKeys.slice(0, 5).join(', ')}]`));
    console.log(`\n❌ BROKEN/404 (${broken.length}):`);
    broken.forEach(r => console.log(`   ${r.name} → ${r.status} ${r.error?.substring(0, 50) || ''}`));

    // Write full results for reference
    const fs = require('fs');
    fs.writeFileSync(
        path.resolve(__dirname, 'probe-results.json'),
        JSON.stringify(results, null, 2)
    );
    console.log('\nFull results saved to probe-results.json');
}

fullProbe();
