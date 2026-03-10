import { config } from 'dotenv';
config({ path: '.env' });
import { odysseyClient } from './src/services/odyssey-client';
import * as fs from 'fs';

async function run() {
    const results: any = {};
    try {
        const res1 = await odysseyClient.post<any>('/customer/read', { pageNum: 1, pageSize: 5 });
        results['pageNum_1'] = res1?.result?.data?.map((c: any) => c.customerName);

        const res2 = await odysseyClient.post<any>('/customer/read', { pageNum: 2, pageSize: 5 });
        results['pageNum_2'] = res2?.result?.data?.map((c: any) => c.customerName);

        const res3 = await odysseyClient.post<any>('/customer/read', { pageIndex: 1, pageSize: 5 });
        results['pageIndex_1'] = res3?.result?.data?.map((c: any) => c.customerName);

        const res4 = await odysseyClient.post<any>('/customer/read', { pageIndex: 2, pageSize: 5 });
        results['pageIndex_2'] = res4?.result?.data?.map((c: any) => c.customerName);

        const res5 = await odysseyClient.post<any>('/customer/read', { offset: 0, pageLimit: 5 });
        results['offset_0'] = res5?.result?.data?.map((c: any) => c.customerName);

        const res6 = await odysseyClient.post<any>('/customer/read', { offset: 5, pageLimit: 5 });
        results['offset_5'] = res6?.result?.data?.map((c: any) => c.customerName);

        fs.writeFileSync('pagination-results.json', JSON.stringify(results, null, 2));
        console.log('Wrote results to pagination-results.json');
    } catch (err) {
        console.error(err);
    }
}
run();
