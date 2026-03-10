
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
const TOKEN = process.env.ODYSSEY_JWT_TOKEN;

async function probeKYAKALE() {
    console.log('--- Focused KYAKALE Probe ---');
    try {
        const res = await axios.get(`${BASE_URL}/token/creditTokenRecord/readMore`, {
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            params: {
                SITE_ID: 'KYAKALE',
                pageLimit: 10,
                FROM: '2020-01-01T00:00:00.000Z',
                TO: new Date().toISOString()
            }
        });

        // Some Odyssey endpoints return data inside an object with a key, let's see EVERYTHING
        console.log('Response Structure:', Object.keys(res.data));
        const data = res.data?.data || res.data?.records || res.data;
        console.log(`✅ Success! Found: ${Array.isArray(data) ? data.length + ' records' : 'non-array'}`);
        if (Array.isArray(data) && data.length > 0) {
            console.log('Fields:', Object.keys(data[0]));
            console.log('Example MeterSN:', data[0].MeterSN || data[0].meterSN);
            console.log('Example CustomerName:', data[0].CustomerName || data[0].customerName);
        }
    } catch (err: any) {
        console.log(`❌ Error: ${err.response?.status || err.message}`);
        if (err.response?.data) console.log('Error Data:', err.response.data);
    }
}

probeKYAKALE();
