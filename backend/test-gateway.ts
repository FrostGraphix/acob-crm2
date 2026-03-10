import { odysseyClient } from './src/services/odyssey-client';
import { config } from './src/config';

async function test() {
    try {
        const siteId = config.odyssey.sites[0];
        console.log(`Testing /gateway/read for site: ${siteId}`);
        const res = await odysseyClient.post<any>('/gateway/read', {
            pageSize: 100,
            pageNum: 1,
            SITE_ID: siteId
        });
        console.log("Response:", JSON.stringify(res, null, 2));
    } catch (err: any) {
        console.log('/gateway/read failed:', err.message);
        if (err.response) {
            console.log("Status:", err.response.status);
            console.log("Data:", JSON.stringify(err.response.data, null, 2));
        }
    }
}
test();
