
import axios from 'axios';
import { config } from './src/config';

async function broadProbe() {
    const token = config.odyssey.jwtToken;
    const baseUrl = config.odyssey.baseUrl;
    const siteId = config.odyssey.sites[0];

    const modules = ['customer', 'Customer', 'relationship', 'Relationship', 'base', 'Base', 'management', 'Management'];
    const subModules = ['customer', 'Customer', 'meter', 'Meter', 'account', 'Account'];
    const actions = ['readMore', 'read', 'list', 'query'];

    console.log('--- Odyssey Broad Discovery ---');

    for (const m of modules) {
        for (const sm of subModules) {
            for (const a of actions) {
                const path = `/${m}/${sm}/${a}`;
                try {
                    const res = await axios.get(`${baseUrl}${path}`, {
                        params: { SITE_ID: siteId, offset: 0, pageLimit: 5 },
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 3000
                    });
                    console.log(`   ✅ FOUND: ${path} (Keys: ${Object.keys(res.data).join(', ')})`);
                } catch (err: any) {
                    // ignore failures
                }
            }
        }
    }
}

broadProbe();
