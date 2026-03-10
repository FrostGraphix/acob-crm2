
import { odysseyClient } from './src/services/odyssey-client';
import { config } from './src/config';

async function verifyFinal() {
    const from = '2025-01-01T00:00:00.000Z';
    const to = '2025-01-02T23:59:59.000Z';
    const siteId = config.odyssey.sites[0];

    console.log('--- Odyssey Client Verification ---');

    try {
        console.log('\n1. Verifying Token Records (Robust extraction)...');
        const tokens = await odysseyClient.getCreditTokenRecords(siteId, from, to);
        console.log(`Tokens Array Length: ${tokens.length}`);
        if (tokens.length > 0) console.log('Sample:', JSON.stringify(tokens[0]).substring(0, 100));

        console.log('\n2. Verifying Hourly Data (Robust extraction)...');
        const hourly = await odysseyClient.getHourlyData(siteId, from, to);
        console.log(`Hourly Array Length: ${hourly.length}`);
        if (hourly.length > 0) console.log('Sample:', JSON.stringify(hourly[0]).substring(0, 100));

        console.log('\n3. Verifying Non-Purchase (POST check)...');
        const nonPurchase = await odysseyClient.getLongNonPurchase(siteId, 30);
        console.log(`Non-Purchase Array Length: ${nonPurchase.length}`);

        console.log('\nSUCCESS: Odyssey Client is robustly extracting data.');
    } catch (err: any) {
        console.error('\n!!! VERIFICATION FAILED !!!');
        console.error('Status:', err.response?.status);
        console.error('Data:', JSON.stringify(err.response?.data));
        console.error('Message:', err.message);
    }
}

verifyFinal();
