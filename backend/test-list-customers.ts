import { config } from 'dotenv';
config({ path: '.env' });

import { listCustomers } from './src/services/management-service';

async function test() {
    try {
        const result = await listCustomers();
        console.log("SUCCESS:", JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error("ERROR:", e);
    }
}
test();
