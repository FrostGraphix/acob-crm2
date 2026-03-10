import { config } from 'dotenv';
config({ path: '.env' });
import { odysseyClient } from './src/services/odyssey-client';
import * as fs from 'fs';

async function run() {
    const results: any = {};
    try {
        // Test 1: Query Params (offset/pageLimit)
        const res1 = await odysseyClient['http'].post('/customer/read', {}, { params: { offset: 0, pageLimit: 5 } });
        results['query_offset_0'] = res1.data?.result?.data?.map((c: any) => c.customerName) || [];

        const res2 = await odysseyClient['http'].post('/customer/read', {}, { params: { offset: 5, pageLimit: 5 } });
        results['query_offset_5'] = res2.data?.result?.data?.map((c: any) => c.customerName) || [];

        // Test 2: Uppercase Body Params (OFFSET/PAGE_LIMIT)
        const res3 = await odysseyClient.post<any>('/customer/read', { OFFSET: 0, PAGE_LIMIT: 5 });
        results['body_OFFSET_0'] = res3?.result?.data?.map((c: any) => c.customerName) || [];

        const res4 = await odysseyClient.post<any>('/customer/read', { OFFSET: 5, PAGE_LIMIT: 5 });
        results['body_OFFSET_5'] = res4?.result?.data?.map((c: any) => c.customerName) || [];

        // Test 3: Uppercase Query Params
        const res5 = await odysseyClient['http'].post('/customer/read', {}, { params: { OFFSET: 0, PAGE_LIMIT: 5 } });
        results['query_OFFSET_0'] = res5.data?.result?.data?.map((c: any) => c.customerName) || [];

        const res6 = await odysseyClient['http'].post('/customer/read', {}, { params: { OFFSET: 5, PAGE_LIMIT: 5 } });
        results['query_OFFSET_5'] = res6.data?.result?.data?.map((c: any) => c.customerName) || [];

        fs.writeFileSync('pagination-query-results.json', JSON.stringify(results, null, 2));
        console.log('Wrote results to pagination-query-results.json');
    } catch (err: any) {
        console.error('Error:', err.message);
    }
}
run();
