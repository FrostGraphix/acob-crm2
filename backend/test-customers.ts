import { config } from 'dotenv';
config({ path: '.env' });
import { odysseyClient } from './src/services/odyssey-client';

async function testCustomerPagination() {
    console.log('Testing Page 1 with pageNum/pageSize...');
    const res1 = await odysseyClient.post<any>('/customer/read', {
        pageNum: 1,
        pageIndex: 1,
        pageSize: 5,
        pageLimit: 5,
    });
    console.log('Page 1 result count:', res1?.result?.data?.length);
    if (res1?.result?.data?.[0]) console.log('Page 1 first item:', res1.result.data[0].customerName);

    console.log('\nTesting Page 2 with pageNum/pageSize...');
    const res2 = await odysseyClient.post<any>('/customer/read', {
        pageNum: 2,
        pageIndex: 2,
        pageSize: 5,
        pageLimit: 5,
    });
    console.log('Page 2 result count:', res2?.result?.data?.length);
    if (res2?.result?.data?.[0]) console.log('Page 2 first item:', res2.result.data[0].customerName);

    console.log('\nTesting Page 2 with offset/pageLimit...');
    const res3 = await odysseyClient.post<any>('/customer/read', {
        offset: 5,
        pageLimit: 5,
    });
    console.log('Page 2 (offset) count:', res3?.result?.data?.length);
    if (res3?.result?.data?.[0]) console.log('Page 2 (offset) first item:', res3.result.data[0].customerName);

    console.log('\nDone.');
}

testCustomerPagination().catch(console.error);
