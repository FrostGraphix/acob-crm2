import { config } from 'dotenv';
config({ path: '.env' });
import { odysseyClient } from './src/services/odyssey-client';

async function test() {
    let r1, r2;

    r1 = await odysseyClient.post<any>('/customer/read', { pageLimit: 10, offset: 0 });
    r2 = await odysseyClient.post<any>('/customer/read', { pageLimit: 10, offset: 10 });
    console.log('customer pageLimit/offset:', r1?.result?.data?.[0]?.customerId, 'vs', r2?.result?.data?.[0]?.customerId);

    r1 = await odysseyClient.post<any>('/customer/read', { pageSize: 10, pageNum: 1 });
    r2 = await odysseyClient.post<any>('/customer/read', { pageSize: 10, pageNum: 2 });
    console.log('customer pageSize/pageNum:', r1?.result?.data?.[0]?.customerId, 'vs', r2?.result?.data?.[0]?.customerId);
}
test().catch(console.error);
