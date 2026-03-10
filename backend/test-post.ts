
import axios from 'axios';
import { config } from './src/config';

async function testPost() {
    const token = config.odyssey.jwtToken;
    const baseUrl = config.odyssey.baseUrl;
    const siteId = config.odyssey.sites[0];

    const paths = [
        '/PrepayReport/longNonpurchaseSituation',
        '/PrepayReport/lowPurchaseSituation',
        '/RemoteReport/GPRSOnlineStatus',
    ];

    console.log('--- Testing POST for 405/404 Paths ---');

    for (const path of paths) {
        try {
            console.log(`\nPOST: ${baseUrl}${path}...`);
            const res = await axios.post(`${baseUrl}${path}`, { SITE_ID: siteId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✅ SUCCESS [${res.status}]`);
            console.log('   Keys:', Object.keys(res.data).join(', '));
        } catch (err: any) {
            console.log(`❌ FAILED [${err.response?.status}]`);
        }
    }
}

testPost();
