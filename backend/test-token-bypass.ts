import { odysseyClient } from './src/services/odyssey-client';
import { config } from './src/config';
import fs from 'fs';

async function test() {
    try {
        const fromDate = new Date();
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        const siteId = config.odyssey.sites[0];

        // Testing sending no pageLimit OR a massive pageSize to fetch all at once
        const res = await odysseyClient.post<any>('/token/creditTokenRecord/read',
            { FROM: fromDate.toISOString(), TO: new Date().toISOString(), pageSize: 100000, pageNum: 1 },
            { params: { SITE_ID: siteId } }
        );
        fs.writeFileSync('bypass-out.json', JSON.stringify({
            len: res?.result?.data?.length,
            total: res?.result?.total
        }));

    } catch (err: any) {
        console.error('Error:', err.message);
    }
}
test();
