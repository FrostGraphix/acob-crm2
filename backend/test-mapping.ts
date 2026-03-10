import { config } from 'dotenv';
config({ path: '.env' });
import { odysseyClient } from './src/services/odyssey-client';

async function test() {
    let map = new Map();
    let offset = 0;
    while (offset < 3000) {
        const res = await odysseyClient.post<any>('/customer/read', { pageLimit: 500, offset });
        const data = res?.result?.data || [];
        if (data.length === 0) break;
        for (const c of data) map.set(c.customerId, c);
        offset += data.length;
    }
    console.log('Total fetched:', map.size);
    const target = '47005369138';
    console.log('Exact match:', map.get(target));
    console.log('Contains 5369138:', [...map.keys()].find(k => k.includes('5369138')));
    console.log('Contains 470005369138:', map.get('470005369138'));
    console.log('Sample IDs:', [...map.keys()].slice(100, 110));
}
test().catch(console.error);
