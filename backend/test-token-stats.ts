import { odysseyClient } from './src/services/odyssey-client';
import { config } from './src/config';

async function test() {
    try {
        const fromDate = new Date();
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        const siteId = config.odyssey.sites[0];

        let pageNum = 1;
        let maxPages = 5;
        const stats: any[] = [];
        while (pageNum <= maxPages) {
            const res = await odysseyClient.post<any>('/token/creditTokenRecord/read',
                { FROM: fromDate.toISOString(), TO: new Date().toISOString(), pageNum, pageLimit: 100 },
                { params: { SITE_ID: siteId } }
            );
            stats.push({
                page: pageNum,
                length: res?.result?.data?.length,
                total: res?.result?.total
            });
            pageNum++;
        }
        console.log(JSON.stringify(stats, null, 2));
    } catch (err: any) {
        console.error('Error:', err.message);
    }
}
test();
