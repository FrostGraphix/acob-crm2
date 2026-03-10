import { config } from 'dotenv';
config({ path: '.env' });
import { odysseyClient } from './src/services/odyssey-client';
import * as fs from 'fs';

async function run() {
    const results: any = {};
    try {
        const res1 = await odysseyClient.post<any>('/account/read', { pageNum: 1, pageSize: 5 });
        results['pageNum_1'] = res1?.result?.data?.map((a: any) => a.accountNo || a.customerId);

        const res2 = await odysseyClient.post<any>('/account/read', { pageNum: 2, pageSize: 5 });
        results['pageNum_2'] = res2?.result?.data?.map((a: any) => a.accountNo || a.customerId);

        fs.writeFileSync('account-results.json', JSON.stringify(results, null, 2));
        console.log('Wrote results to account-results.json');
    } catch (err: any) {
        console.error('Error:', err.message);
    }
}
run();
