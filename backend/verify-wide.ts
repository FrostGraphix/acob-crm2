
import { odysseyClient } from './src/services/odyssey-client';
import { config } from './src/config';

async function verifyWide() {
    const from = '2025-01-01T00:00:00.000Z';
    const to = new Date().toISOString();

    console.log('--- Wider Odyssey Verification ---');

    for (const siteId of config.odyssey.sites) {
        console.log(`\n>>> Testing Site: ${siteId} <<<`);
        try {
            const tokens = await odysseyClient.getCreditTokenRecords(siteId, from, to);
            console.log(`   Tokens: ${tokens.length}`);

            const hourly = await odysseyClient.getHourlyData(siteId, from, to);
            console.log(`   Hourly: ${hourly.length}`);

            if (tokens.length === 0 && hourly.length === 0) {
                console.log('   (No data found for this site in this range)');
            }
        } catch (err: any) {
            console.log(`   ❌ FAILED: ${err.message}`);
        }
    }

    // Debug the POST issue - try with BOTH params and body
    console.log('\n--- Debugging POST for Non-Purchase ---');
    try {
        // @ts-ignore - accessing private to debug
        const res = await odysseyClient['http'].post('/PrepayReport/longNonpurchaseSituation',
            { DayThreshold: 30 },
            { params: { SITE_ID: config.odyssey.sites[0] } }
        );
        console.log('✅ POST with query params succeeded!');
        console.log('   Keys:', Object.keys(res.data).join(', '));
    } catch (err: any) {
        console.log(`❌ POST with query params failed [${err.response?.status}]`);
    }
}

verifyWide();
