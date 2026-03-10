
import { odysseyClient } from './src/services/odyssey-client';
import { config } from './src/config';
import axios from 'axios';

async function verifyFocused() {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const siteId = config.odyssey.sites[0];
    const token = config.odyssey.jwtToken;
    const baseUrl = config.odyssey.baseUrl;

    console.log('--- Focused Odyssey Verification ---');
    console.log('Range:', `${from} -> ${to}`);

    console.log('\n1. Testing GET with robust extraction (Hourly)...');
    try {
        const hourly = await odysseyClient.getHourlyData(siteId, from, to);
        console.log(`   Hourly Count: ${hourly.length}`);
    } catch (err: any) {
        console.log(`   Hourly FAILED: ${err.message}`);
    }

    console.log('\n2. Debugging POST (Non-Purchase) - Body only...');
    try {
        const res = await axios.post(`${baseUrl}/PrepayReport/longNonpurchaseSituation`,
            { SITE_ID: siteId, DayThreshold: 30 },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('   ✅ Body-only SUCCESS');
    } catch (err: any) {
        console.log(`   ❌ Body-only FAILED [${err.response?.status}]`);
    }

    console.log('\n3. Debugging POST (Non-Purchase) - SiteID in Query, Threshold in Body...');
    try {
        const res = await axios.post(`${baseUrl}/PrepayReport/longNonpurchaseSituation`,
            { DayThreshold: 30 },
            {
                params: { SITE_ID: siteId },
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        console.log('   ✅ Query-params-for-SiteID SUCCESS');
    } catch (err: any) {
        console.log(`   ❌ Query-params-for-SiteID FAILED [${err.response?.status}]`);
    }

    console.log('\n4. Debugging POST (Non-Purchase) - Everything in Query (POST method)...');
    try {
        const res = await axios.post(`${baseUrl}/PrepayReport/longNonpurchaseSituation`,
            null,
            {
                params: { SITE_ID: siteId, DayThreshold: 30 },
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        console.log('   ✅ Everything-in-Query SUCCESS');
    } catch (err: any) {
        console.log(`   ❌ Everything-in-Query FAILED [${err.response?.status}]`);
    }
}

verifyFocused();
