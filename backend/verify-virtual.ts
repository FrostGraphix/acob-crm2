
import { listVirtualCustomers } from './src/services/virtual-customer-service';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function verifyVirtual() {
    console.log('--- Virtual Customer Discovery Test ---');
    try {
        const customers = await listVirtualCustomers();
        console.log(`✅ DISCOVERED ${customers.length} VIRTUAL CUSTOMERS!`);

        if (customers.length > 0) {
            const perSite = customers.reduce((acc: any, c) => {
                acc[c.siteId] = (acc[c.siteId] || 0) + 1;
                return acc;
            }, {});
            console.log('Per Site Breakdown:', perSite);
            console.log('Sample Customer:', JSON.stringify(customers[0], null, 2));
        } else {
            console.log('⚠️ Still 0 customers - need to verify date ranges or extractArray keys.');
        }
    } catch (err: any) {
        console.log(`❌ Error: ${err.message}`);
    }
}

verifyVirtual();
