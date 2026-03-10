
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
const TOKEN = process.env.ODYSSEY_JWT_TOKEN;

const sites = ['KYAKALE', 'MUSHA', 'UMAISHA', 'TUNGA', 'OGUFA'];
const endpoints = [
    '/token/creditTokenRecord/readMore',
    '/DailyDataMeter/readHourly',
    '/DailyDataMeter/readDaily',
];

async function finalSweep() {
    console.log('--- Final Global Data Sweep ---');
    for (const s of sites) {
        for (const e of endpoints) {
            console.log(`Checking ${s} at ${e}...`);
            try {
                const res = await axios.get(`${BASE_URL}${e}`, {
                    headers: { Authorization: `Bearer ${TOKEN}` },
                    params: {
                        SITE_ID: s,
                        pageLimit: 2,
                        FROM: '2020-01-01T00:00:00.000Z',
                        TO: '2027-01-01T00:00:00.000Z'
                    }
                });
                const records = res.data?.data || [];
                if (records.length > 0) {
                    console.log(`✅ FOUND DATA IN ${s} at ${e}!`);
                    console.log('Sample:', JSON.stringify(records[0], null, 2));
                    return; // Stop once we find any data to inspect
                }
            } catch (err: any) { }
        }
    }
    console.log('No data found in entire portfolio across all checked reports.');
}

finalSweep();
