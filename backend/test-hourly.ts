import { config } from 'dotenv';
config({ path: '.env' });

import axios from 'axios';
import * as fs from 'fs';

const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
const TOKEN = process.env.ODYSSEY_JWT_TOKEN;

async function probeHourly() {
    const sites = ['KYAKALE', 'MUSHA', 'UMAISHA', 'TUNGA', 'OGUFA'];

    // Try different date ranges
    const dateRanges = [
        { label: 'Last 7 days', FROM: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), TO: new Date().toISOString() },
        { label: 'Last 30 days', FROM: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), TO: new Date().toISOString() },
        { label: 'Last 90 days', FROM: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), TO: new Date().toISOString() },
        { label: 'Full year 2025', FROM: '2025-01-01T00:00:00.000Z', TO: '2025-12-31T00:00:00.000Z' },
        { label: 'Full year 2026', FROM: '2026-01-01T00:00:00.000Z', TO: '2026-12-31T00:00:00.000Z' },
    ];

    const results: any[] = [];

    for (const site of sites) {
        for (const range of dateRanges) {
            try {
                const res = await axios.get(`${BASE_URL}/DailyDataMeter/readHourly`, {
                    headers: { Authorization: `Bearer ${TOKEN}` },
                    params: { SITE_ID: site, pageLimit: 10, FROM: range.FROM, TO: range.TO },
                    timeout: 10000,
                });

                const data = res.data;
                const readings = data?.readings ?? data?.data ?? [];
                const total = data?.total ?? readings.length;

                results.push({ site, range: range.label, status: res.status, total, readingCount: readings.length, topKeys: Object.keys(data) });

                if (readings.length > 0) {
                    console.log(`✅ ${site} | ${range.label}: ${readings.length} readings (total: ${total})`);
                    console.log(`   Keys: ${Object.keys(readings[0]).join(', ')}`);
                    console.log(`   Sample: ${JSON.stringify(readings[0]).substring(0, 200)}`);
                }
            } catch (err: any) {
                results.push({ site, range: range.label, status: err.response?.status ?? 'ERR', total: 0, readingCount: 0 });
            }
        }
    }

    // Summary
    const withData = results.filter(r => r.readingCount > 0);
    const withTotal = results.filter(r => r.total > 0);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Combos with readings: ${withData.length}/${results.length}`);
    console.log(`Combos with total > 0: ${withTotal.length}/${results.length}`);

    if (withTotal.length > 0) {
        console.log("\nSites with data:");
        for (const r of withTotal) {
            console.log(`  ${r.site} | ${r.range}: total=${r.total}, readings=${r.readingCount}`);
        }
    }

    fs.writeFileSync('hourly-probe-results.json', JSON.stringify(results, null, 2));
    console.log("\nFull results saved to hourly-probe-results.json");
}

probeHourly();
