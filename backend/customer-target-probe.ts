
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
const TOKEN = process.env.ODYSSEY_JWT_TOKEN;

const paths = [
    '/Management/customer',
    '/Management/customer/readMore',
    '/Relationship/customer',
    '/Relationship/customer/readMore',
    '/token/meter/readMore',
    '/token/customer/readMore',
    '/Management/account',
];

async function probe() {
    console.log('--- Targeted Customer Probe ---');
    for (const p of paths) {
        try {
            const res = await axios.get(`${BASE_URL}${p}`, {
                headers: { Authorization: `Bearer ${TOKEN}` },
                params: { SITE_ID: 'KYAKALE', pageLimit: 10 }
            });
            console.log(`✅ ${p}: SUCCESS (${Array.isArray(res.data?.data) ? res.data.data.length : 'object'} items)`);
            if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
                console.log('   Sample:', JSON.stringify(res.data.data[0]).substring(0, 100));
            }
        } catch (err: any) {
            console.log(`❌ ${p}: ${err.response?.status || err.message}`);
        }
    }
}

probe();
