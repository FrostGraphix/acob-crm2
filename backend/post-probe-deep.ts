import { config } from 'dotenv';
config({ path: '.env' });

import axios from 'axios';
import * as fs from 'fs';

const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
const TOKEN = process.env.ODYSSEY_JWT_TOKEN;
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function probe() {
    const output: Record<string, any> = {};

    // Key endpoints to inspect full response
    const endpoints = [
        { path: '/customer/read', body: { SITE_ID: 'KYAKALE' } },
        { path: '/meter/read', body: { SITE_ID: 'KYAKALE' } },
        { path: '/tariff/read', body: { SITE_ID: 'KYAKALE' } },
        { path: '/station/read', body: { SITE_ID: 'KYAKALE' } },
        { path: '/role/read', body: { SITE_ID: 'KYAKALE' } },
        { path: '/dashboard/readPanelGroup', body: { SITE_ID: 'KYAKALE' } },
        { path: '/dashboard/readLineChart', body: { SITE_ID: 'KYAKALE' } },
        { path: '/GPRSOnlineStatus/Read', body: { SITE_ID: 'KYAKALE' } },
        { path: '/item/read', body: { SITE_ID: 'KYAKALE' } },
        { path: '/Log/read', body: { SITE_ID: 'KYAKALE' } },
        // With dates
        { path: '/DailyDataMeter/readMore', body: { SITE_ID: 'KYAKALE', FROM: '2026-01-01T00:00:00.000Z', TO: '2026-02-23T23:59:59.000Z', pageLimit: 5 } },
        { path: '/PrepayReport/ConsumptionStatistics', body: { SITE_ID: 'KYAKALE', FROM: '2026-01-01T00:00:00.000Z', TO: '2026-02-23T23:59:59.000Z' } },
    ];

    for (const ep of endpoints) {
        try {
            const res = await axios.post(`${BASE_URL}${ep.path}`, ep.body, { headers, timeout: 10000 });
            output[ep.path] = { status: res.status, data: res.data };
        } catch (err: any) {
            output[ep.path] = { status: err.response?.status ?? 'ERR', data: err.response?.data ?? null, error: err.message?.substring(0, 100) };
        }
    }

    fs.writeFileSync('full-post-responses.json', JSON.stringify(output, null, 2));
    console.log('Done! Saved to full-post-responses.json');
}

probe();
