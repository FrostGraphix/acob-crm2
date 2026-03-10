
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
const TOKEN = process.env.ODYSSEY_JWT_TOKEN;

async function inspectData() {
    console.log('--- Raw Data Inspection (Tokens with Range) ---');
    try {
        const res = await axios.get(`${BASE_URL}/token/creditTokenRecord/readMore`, {
            headers: { Authorization: `Bearer ${TOKEN}` },
            params: {
                SITE_ID: 'KYAKALE',
                pageLimit: 5,
                FROM: '2025-01-01T00:00:00.000Z',
                TO: '2026-12-31T23:59:59.000Z'
            }
        });

        const records = res.data?.data || [];
        if (records.length === 0) {
            console.log('No records found even with wide range.');
            return;
        }

        console.log(`Found ${records.length} sample records.`);
        records.forEach((r: any, i: number) => {
            console.log(`\nRecord ${i + 1}:`);
            console.log(JSON.stringify(r, null, 2));
        });

    } catch (err: any) {
        console.log(`❌ Error: ${err.response?.status || err.message}`);
    }
}

inspectData();
