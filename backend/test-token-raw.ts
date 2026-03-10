import { odysseyClient } from './src/services/odyssey-client';
import { config } from './src/config';

async function test() {
    try {
        const fromDate = new Date();
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        const siteId = config.odyssey.sites[0]; // KYAKALE

        // Make a raw post request
        const res = await odysseyClient.post<any>('/token/creditTokenRecord/read',
            { FROM: fromDate.toISOString(), TO: new Date().toISOString(), pageNum: 1, pageLimit: 100 },
            { params: { SITE_ID: siteId } }
        );

        console.log(`TOTAL FIELD: ${res?.result?.total}`);
        console.log(`DATA LENGTH: ${res?.result?.data?.length}`);
    } catch (err: any) {
        console.error('Error:', err.message);
    }
}
test();
