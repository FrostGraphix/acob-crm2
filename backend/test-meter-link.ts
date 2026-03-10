import { config } from 'dotenv';
config({ path: '.env' });
import { odysseyClient } from './src/services/odyssey-client';

async function test() {
    console.log('Fetching...');
    const res = await odysseyClient.post<any>('/meter/read', { pageSize: 1, pageNum: 1 });
    console.log(`Total meters available from API: ${res?.result?.total}`);
}
test().catch(console.error);
