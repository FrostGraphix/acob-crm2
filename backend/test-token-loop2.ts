import { odysseyClient } from './src/services/odyssey-client';
import { config } from './src/config';

async function test() {
    try {
        const fromDate = new Date();
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        const siteId = config.odyssey.sites[0];

        // We will run the loop manually to print exactly what happens
        let pageNum = 1;
        let maxPages = 5;
        while (pageNum <= maxPages) {
            console.log(`Fetching page ${pageNum}...`);
            const res = await odysseyClient.post<any>('/token/creditTokenRecord/read',
                { FROM: fromDate.toISOString(), TO: new Date().toISOString(), pageNum, pageLimit: 100 },
                { params: { SITE_ID: siteId } }
            );
            console.log(`Page ${pageNum} returned ${res?.result?.data?.length} records`);
            pageNum++;
        }
    } catch (err: any) {
        console.error('Error:', err.message);
    }
}
test();
