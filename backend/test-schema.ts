import { config } from 'dotenv';
config({ path: '.env' });

import axios from 'axios';
import * as fs from 'fs';

async function test() {
    const BASE_URL = process.env.ODYSSEY_API_BASE_URL || 'http://8.208.16.168:9310/api';
    const TOKEN = process.env.ODYSSEY_JWT_TOKEN;
    const sites = ['KYAKALE', 'MUSHA', 'UMAISHA', 'TUNGA', 'OGUFA'];
    const FROM = '2025-01-01T00:00:00.000Z';
    const TO = '2027-01-01T00:00:00.000Z';

    const allRecords: any[] = [];
    for (const site of sites) {
        const res = await axios.get(`${BASE_URL}/token/creditTokenRecord/readMore`, {
            headers: { Authorization: `Bearer ${TOKEN}` },
            params: { SITE_ID: site, pageLimit: 5, FROM, TO },
        });
        const records = res.data?.payments ?? [];
        console.log(`${site}: ${records.length} payments | top keys: ${Object.keys(res.data).join(', ')}`);
        if (records.length > 0) {
            allRecords.push({ site, record: records[0] });
        }
    }

    if (allRecords.length > 0) {
        fs.writeFileSync('raw-token-samples.json', JSON.stringify(allRecords, null, 2));
        console.log("\nFirst record keys:", Object.keys(allRecords[0].record).join(', '));
        console.log("\nFull first record:", JSON.stringify(allRecords[0].record, null, 2));
    } else {
        console.log("No records found from any site!");
    }
}

test();
