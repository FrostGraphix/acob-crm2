import { config } from 'dotenv';
config({ path: '.env' });

import { getDashboardData } from './src/services/dashboard-service';
import { logger } from './src/config/logger';

async function test() {
    console.log("Starting full dashboard integration test...");
    const from = "2025-01-01T00:00:00.000Z";
    const to = new Date().toISOString();

    try {
        console.time("getDashboardData");
        const data = await getDashboardData(from, to);
        console.timeEnd("getDashboardData");
        console.log("SUCCESS!");
    } catch (e: any) {
        console.error("FAILED at top level:");
        console.error(e.message ?? e);
        if (e.response) {
            console.error("Response logic:", e.response.status, e.response.data);
        }
    }
}

test();
