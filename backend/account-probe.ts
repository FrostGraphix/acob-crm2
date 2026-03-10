import { odysseyClient } from './src/services/odyssey-client';

async function main() {
    try {
        const res: any = await odysseyClient.post('/account/read', { pageSize: 1, pageNum: 1 });
        const data = res.result.data;
        if (data && data.length > 0) {
            console.log('--- FIRST ACCOUNT DATA ---');
            console.log(JSON.stringify(data[0], null, 2));
        } else {
            console.log('No data found');
        }
    } catch (err) {
        console.error('Error fetching accounts:', err);
    }
}

main();
