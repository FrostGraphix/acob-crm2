
import axios from 'axios';
import { config } from './src/config';

async function probeCustomers() {
    const token = config.odyssey.jwtToken;
    const baseUrl = config.odyssey.baseUrl;
    const siteId = config.odyssey.sites[0];

    const paths = [
        '/Management/customer',
        '/Relationship/customer',
        '/Management/meter',
        '/Relationship/meter',
        '/Base/customer',
        '/Admin/customer'
    ];

    console.log('--- Odyssey Customer Discovery ---');

    for (const path of paths) {
        try {
            console.log(`Probing ${path}...`);
            const res = await axios.get(`${baseUrl}${path}`, {
                params: { SITE_ID: siteId, offset: 0, pageLimit: 10 },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`   ✅ SUCCESS: ${path} (Keys: ${Object.keys(res.data).join(', ')})`);
            if (Array.isArray(res.data)) console.log(`      Count: ${res.data.length}`);
            else if (res.data.data && Array.isArray(res.data.data)) console.log(`      Count: ${res.data.data.length}`);
        } catch (err: any) {
            console.log(`   ❌ FAILED: ${path} [${err.response?.status || 'network error'}]`);
        }
    }
}

probeCustomers();
