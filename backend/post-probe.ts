import { config } from 'dotenv';
config({ path: '.env' });

import axios from 'axios';
import * as fs from 'fs';

const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
const TOKEN = process.env.ODYSSEY_JWT_TOKEN;

const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

// Critical POST endpoint probes — using correct POST method this time
const PROBES = [
    // Customer
    { path: '/customer/read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // Meter
    { path: '/meter/read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // Gateway
    { path: '/gateway/read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // Tariff
    { path: '/tariff/read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // Debt
    { path: '/debt/read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // Station
    { path: '/station/read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // Role
    { path: '/role/read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // DailyData
    { path: '/DailyData/read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    { path: '/DailyData/readMore', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    { path: '/DailyData/readMonthly', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // DailyDataMeter
    { path: '/DailyDataMeter/read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    { path: '/DailyDataMeter/readMore', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    { path: '/DailyDataMeter/readMonthly', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // Dashboard
    { path: '/dashboard/readPanelGroup', method: 'POST', payload: { SITE_ID: 'KYAKALE' } },
    { path: '/dashboard/readLineChart', method: 'POST', payload: { SITE_ID: 'KYAKALE' } },
    // Events
    { path: '/EventNotification/Read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // GPRS
    { path: '/GPRSOnlineStatus/Read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // PrepayReport
    { path: '/PrepayReport/LongNonpurchaseSituation', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    { path: '/PrepayReport/LowPurchaseSituation', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    { path: '/PrepayReport/ConsumptionStatistics', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // Log
    { path: '/Log/read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // Item
    { path: '/item/read', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    // LoadProfile
    { path: '/LoadProfile/DailyData', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
    { path: '/LoadProfile/MonthlyData', method: 'POST', payload: { SITE_ID: 'KYAKALE', pageLimit: 5 } },
];

async function probe() {
    const results: any[] = [];

    for (const p of PROBES) {
        try {
            const res = await axios.post(`${BASE_URL}${p.path}`, p.payload, { headers, timeout: 10000 });
            const data = res.data;
            const topKeys = Object.keys(data);

            // Try to find the data array
            let recordCount = 0;
            let sampleRecord: any = null;
            let sampleKeys: string[] = [];
            for (const key of ['data', 'payments', 'readings', 'records', 'events', 'items', 'customers', 'meters', 'gateways']) {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    recordCount = data[key].length;
                    sampleRecord = data[key][0];
                    sampleKeys = Object.keys(data[key][0]);
                    break;
                }
            }

            const total = data.total ?? data.Total ?? recordCount;

            results.push({
                path: p.path,
                status: res.status,
                total,
                recordCount,
                topKeys,
                sampleKeys,
                hasData: recordCount > 0,
            });

            const marker = recordCount > 0 ? '✅' : '⚠️';
            console.log(`${marker} POST ${p.path}: ${res.status} | total=${total} | records=${recordCount} | keys=[${topKeys.join(',')}]`);
            if (sampleKeys.length > 0) {
                console.log(`   Record keys: ${sampleKeys.join(', ')}`);
            }
        } catch (err: any) {
            const status = err.response?.status ?? 'ERR';
            results.push({ path: p.path, status, total: 0, recordCount: 0, hasData: false, error: err.message?.substring(0, 100) });
            console.log(`❌ POST ${p.path}: ${status}`);
        }
    }

    // Summary
    const working = results.filter(r => r.hasData);
    const responsive = results.filter(r => r.status === 200);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Responsive (200): ${responsive.length}/${results.length}`);
    console.log(`With data: ${working.length}/${results.length}`);

    if (working.length > 0) {
        console.log("\n✅ Endpoints with live data:");
        for (const r of working) {
            console.log(`  POST ${r.path}: ${r.total} total, ${r.recordCount} records | Keys: ${r.sampleKeys.join(', ')}`);
        }
    }

    fs.writeFileSync('post-probe-results.json', JSON.stringify(results, null, 2));
    console.log("\nFull results → post-probe-results.json");

    // Also save sample records for endpoints with data
    if (working.length > 0) {
        const samples: any = {};
        for (const r of working) {
            const res = await axios.post(`${BASE_URL}${r.path}`, { SITE_ID: 'KYAKALE', pageLimit: 2 }, { headers, timeout: 10000 });
            const data = res.data;
            for (const key of ['data', 'payments', 'readings', 'records', 'events', 'items', 'customers', 'meters', 'gateways']) {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    samples[r.path] = { keys: Object.keys(data), firstRecord: data[key][0] };
                    break;
                }
            }
        }
        fs.writeFileSync('post-probe-samples.json', JSON.stringify(samples, null, 2));
        console.log("Sample records → post-probe-samples.json");
    }
}

probe();
