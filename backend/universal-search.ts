
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
const TOKEN = process.env.ODYSSEY_JWT_TOKEN;

const sites = ['KYAKALE', 'MUSHA', 'UMAISHA', 'TUNGA', 'OGUFA'];
const endpoints = [
    '/Management/customer',
    '/Management/meter',
    '/Relationship/customer',
    '/token/meter/readMore',
    '/token/customer/readMore',
];

async function findAnyTable() {
    console.log('--- Universal Table Search ---');
    for (const s of sites) {
        for (const e of endpoints) {
            console.log(`Probing ${s} -> ${e}...`);
            try {
                const res = await axios.get(`${BASE_URL}${e}`, {
                    headers: { Authorization: `Bearer ${TOKEN}` },
                    params: { SITE_ID: s, pageLimit: 5 }
                });
                const records = res.data?.data || res.data;
                if (Array.isArray(records) && records.length > 0) {
                    console.log(`✅ SUCCESS! Found ${records.length} records in ${s} at ${e}`);
                    console.log('Keys:', Object.keys(records[0]).join(', '));
                    return;
                }
            } catch (err: any) {
                if (err.response?.status !== 404) {
                    console.log(`⚠️ ${e} (${s}): ${err.response?.status}`);
                }
            }
        }
    }
    console.log('No tables found.');
}

findAnyTable();
