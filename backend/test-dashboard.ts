import { config } from 'dotenv';
config({ path: '.env' });

import { odysseyClient } from './src/services/odyssey-client';
import { logger } from './src/config/logger';

async function test() {
    const from = "2025-01-01T00:00:00.000Z";
    const to = new Date().toISOString();
    const MAX_DASHBOARD_PAGES = 5;

    console.log("Testing individual endpoints...");

    try {
        console.time("Tokens");
        const allTokens = await odysseyClient.fetchAllSites<any>(
            '/token/creditTokenRecord/readMore',
            { FROM: from, TO: to },
            'GET',
            MAX_DASHBOARD_PAGES
        );
        console.timeEnd("Tokens");
        console.log("Tokens sites:", allTokens.length);

        console.time("Hourly");
        const allHourly = await odysseyClient.fetchAllSites<any>(
            '/DailyDataMeter/readHourly',
            { FROM: from, TO: to },
            'GET',
            MAX_DASHBOARD_PAGES
        );
        console.timeEnd("Hourly");
        console.log("Hourly sites:", allHourly.length);

        console.time("Events");
        await odysseyClient.getEventNotifications("KYAKALE", from, to);
        console.timeEnd("Events");

        console.time("LongNonPurchase");
        await odysseyClient.getLongNonPurchase("KYAKALE");
        console.timeEnd("LongNonPurchase");

        console.time("LowPurchase");
        await odysseyClient.getLowPurchase("KYAKALE");
        console.timeEnd("LowPurchase");

    } catch (e) {
        console.error("Failed:", e);
    }
}

test();
