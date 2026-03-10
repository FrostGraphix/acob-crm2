
import axios from 'axios';
import { config } from './src/config';

async function probeDiscovery() {
    const token = config.odyssey.jwtToken;
    const baseUrl = config.odyssey.baseUrl;
    const siteId = config.odyssey.sites[0];

    const paths = [
        '/Management/Gateway',
        '/Management/Gateway/Read',
        '/Management/gateway/readMore',
        '/Management/Gateway/ReadMore',
        '/RemoteReport/EventNotification/readMore',
        '/RemoteReport/Event/readMore',
        '/RemoteReport/EventNotification',
        '/AutomaticMeterReading/DailyDataMeter/readMore',
        '/DailyDataMeter/readMore',
    ];

    console.log('--- Odyssey API Discovery Probe ---');

    for (const path of paths) {
        try {
            console.log(`\nProbing: ${baseUrl}${path}...`);
            const res = await axios.get(`${baseUrl}${path}`, {
                params: { SITE_ID: siteId, FROM: '2025-01-01', TO: '2025-01-02' },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✅ SUCCESS [${res.status}]`);
            console.log('   Keys:', Object.keys(res.data).join(', '));
        } catch (err: any) {
            console.log(`❌ FAILED [${err.response?.status}]: ${path}`);
        }
    }
}

probeDiscovery();
