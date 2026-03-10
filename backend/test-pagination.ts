import { config } from 'dotenv';
config({ path: '.env' });
import { odysseyClient } from './src/services/odyssey-client';

async function test() {
    console.log('Testing pageLimit=500');
    let res = await odysseyClient.post<any>('/customer/read', { pageLimit: 500, offset: 0 });
    console.log('pageLimit=500 -> returned:', res?.result?.data?.length);

    console.log('Testing limit=500');
    res = await odysseyClient.post<any>('/customer/read', { limit: 500, offset: 0 });
    console.log('limit=500 -> returned:', res?.result?.data?.length);

    console.log('Testing PAGE_LIMIT=500');
    res = await odysseyClient.post<any>('/customer/read', { PAGE_LIMIT: 500, OFFSET: 0 });
    console.log('PAGE_LIMIT=500 -> returned:', res?.result?.data?.length);

    console.log('Testing pageSize=500');
    res = await odysseyClient.post<any>('/customer/read', { pageSize: 500, pageNum: 1 });
    console.log('pageSize=500 -> returned:', res?.result?.data?.length);

    console.log('Testing length=500, start=0');
    res = await odysseyClient.post<any>('/customer/read', { length: 500, start: 0 });
    console.log('length=500 -> returned:', res?.result?.data?.length);
}
test().catch(console.error);
