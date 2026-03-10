import { odysseyClient } from './src/services/odyssey-client';
import { config } from './src/config';

async function test() {
    try {
        const siteId = config.odyssey.sites[0];
        const res = await odysseyClient.post<any>('/token/creditTokenRecord/read', {
            pageLimit: 10,
            pageNum: 1
        }, {
            params: { SITE_ID: siteId, FROM: '2025-01-01', TO: '2025-01-02' }
        });
        console.log("Read with params:");
        console.log(`Total: ${res.result?.total}`);
        if (res.result?.data?.length > 0) {
            console.log("Date 0:", res.result.data[0].createDate);
        }
    } catch (err: any) {
        console.log('/token/creditTokenRecord/read failed:', err.message);
    }
}
test();
