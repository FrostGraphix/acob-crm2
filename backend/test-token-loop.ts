import { odysseyClient } from './src/services/odyssey-client';
import { config } from './src/config';

async function test() {
    try {
        const fromDate = new Date();
        fromDate.setFullYear(fromDate.getFullYear() - 1);

        const siteId = config.odyssey.sites[0];
        console.log('Testing single site token fetch for:', siteId);

        const allData = await odysseyClient.fetchAllPagesPostPageNum<any>(
            '/token/creditTokenRecord/read',
            { FROM: fromDate.toISOString(), TO: new Date().toISOString() },
            100, // pageLimit
            { SITE_ID: siteId },
            50 // maxPages
        );

        console.log(`Successfully fetched ${allData.length} total records from ${siteId}`);
    } catch (err: any) {
        console.error('Error:', err.message);
    }
}
test();
