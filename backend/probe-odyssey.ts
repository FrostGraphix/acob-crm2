
import axios from 'axios';
import { config } from './src/config';

async function probePaths() {
    const token = config.odyssey.jwtToken;
    const baseUrl = config.odyssey.baseUrl;
    const siteId = config.odyssey.sites[0];

    const pathsToTry = [
        '/RemoteReport/GPRSOnlineStatus',
        '/RemoteReport/GprsOnlineStatus',
        '/RemoteReport/Gprsonlinestatus',
        '/RemoteReport/GPRSOnlineStatusRead',
        '/RemoteReport/GprsOnlineStatusRead',
        '/AutomaticMeterReading/DailyDataMeter',
        '/Token/CreditTokenRecord/ReadMore',
        '/token/creditTokenRecord/readMore',
    ];

    console.log('--- Odyssey API Path Discovery ---');
    console.log('Base URL:', baseUrl);
    console.log('Token (first 10 chars):', token.substring(0, 10));

    for (const path of pathsToTry) {
        try {
            console.log(`\nProbing: ${baseUrl}${path}...`);
            const res = await axios.get(`${baseUrl}${path}`, {
                params: { SITE_ID: siteId, FROM: '2025-01-01', TO: '2025-01-02' },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✅ SUCCESS [${res.status}]: ${path}`);
            // console.log('Data Sample:', JSON.stringify(Array.isArray(res.data) ? res.data.slice(0, 1) : res.data, null, 2));
        } catch (err: any) {
            console.log(`❌ FAILED [${err.response?.status}]: ${path}`);
            if (err.response?.status === 401) {
                console.log('   Reason: Unauthorized. Token might be expired or invalid.');
            }
        }
    }

    // Also try WITHOUT /api suffix if it fails a lot
    if (baseUrl.endsWith('/api')) {
        const altBase = baseUrl.replace('/api', '');
        console.log(`\n\n--- Probing WITHOUT /api suffix: ${altBase} ---`);
        for (const path of pathsToTry) {
            try {
                console.log(`Probing: ${altBase}${path}...`);
                const res = await axios.get(`${altBase}${path}`, {
                    params: { SITE_ID: siteId, FROM: '2025-01-01', TO: '2025-01-02' },
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`✅ SUCCESS [${res.status}]: ${path}`);
            } catch (err: any) {
                // Skip logging failures here unless they are not 404
                if (err.response?.status !== 404) {
                    console.log(`   [${err.response?.status}]: ${path}`);
                }
            }
        }
    }
}

probePaths();
