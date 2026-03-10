
import axios from 'axios';
import { config } from './src/config';

async function probeData() {
    const token = config.odyssey.jwtToken;
    const baseUrl = config.odyssey.baseUrl;
    const siteId = config.odyssey.sites[0];

    const testCases = [
        { name: 'Tokens with ISO', path: '/Token/CreditTokenRecord/ReadMore', params: { SITE_ID: siteId, FROM: '2025-01-01T00:00:00.000Z', TO: '2025-01-02T23:59:59.000Z' } },
        { name: 'Tokens with Short Date', path: '/Token/CreditTokenRecord/ReadMore', params: { SITE_ID: siteId, FROM: '2025-01-01', TO: '2025-01-02' } },
        { name: 'Hourly with ISO', path: '/DailyDataMeter/readHourly', params: { SITE_ID: siteId, FROM: '2025-01-01T00:00:00.000Z', TO: '2025-01-02T23:59:59.000Z' } },
        { name: 'Hourly (Alternative Path)', path: '/AutomaticMeterReading/readHourly', params: { SITE_ID: siteId, FROM: '2025-01-01', TO: '2025-01-02' } },
        { name: 'Events', path: '/RemoteReport/eventNotification', params: { SITE_ID: siteId, FROM: '2025-01-01', TO: '2026-02-23' } },
    ];

    console.log('--- Odyssey API Data Probe ---');

    for (const tc of testCases) {
        try {
            console.log(`\nTesting: ${tc.name} [${tc.path}]...`);
            const res = await axios.get(`${baseUrl}${tc.path}`, {
                params: tc.params,
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✅ SUCCESS [${res.status}]`);
            const data = res.data;
            if (Array.isArray(data)) {
                console.log(`   Count: ${data.length}`);
                if (data.length > 0) console.log('   Sample:', JSON.stringify(data[0]).substring(0, 200));
            } else if (data && typeof data === 'object') {
                console.log('   Object Keys:', Object.keys(data).join(', '));
                if (data.Data) {
                    const inner = Array.isArray(data.Data) ? data.Data : [data.Data];
                    console.log(`   Internal Count: ${inner.length}`);
                    if (inner.length > 0) console.log('   Internal Sample:', JSON.stringify(inner[0]).substring(0, 200));
                }
            }
        } catch (err: any) {
            console.log(`❌ FAILED [${err.response?.status}]: ${tc.path}`);
            // if (err.response?.data) console.log('   Error Data:', JSON.stringify(err.response?.data));
        }
    }
}

probeData();
