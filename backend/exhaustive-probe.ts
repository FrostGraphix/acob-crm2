
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
const TOKEN = process.env.ODYSSEY_JWT_TOKEN;

const probes = [
    { name: 'Tokens', path: '/token/creditTokenRecord/readMore' },
    { name: 'Hourly', path: '/DailyDataMeter/readHourly' },
    { name: 'GPRS Status', path: '/RemoteReport/GPRSOnlineStatus' },
];

async function exhaustiveProbe() {
    console.log('--- Exhaustive Site Probe (UMAISHA) ---');
    for (const p of probes) {
        console.log(`\nProbing ${p.name}...`);
        try {
            const res = await axios.get(`${BASE_URL}${p.path}`, {
                headers: { Authorization: `Bearer ${TOKEN}` },
                params: {
                    SITE_ID: 'UMAISHA',
                    pageLimit: 5,
                    FROM: '2023-01-01T00:00:00.000Z',
                    TO: '2027-01-01T00:00:00.000Z'
                }
            });

            const records = res.data?.data || [];
            console.log(`✅ Result: ${records.length} records found.`);
            if (records.length > 0) {
                console.log('Keys:', Object.keys(records[0]).join(', '));
                console.log('Schema:', JSON.stringify(records[0], null, 2).substring(0, 500));
            }
        } catch (err: any) {
            console.log(`❌ Error: ${err.response?.status || err.message}`);
        }
    }
}

exhaustiveProbe();
