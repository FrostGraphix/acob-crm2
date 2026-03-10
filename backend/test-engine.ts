import { tokenDataEngine } from './src/services/token-data-engine';

async function test() {
    try {
        const snap = await tokenDataEngine.getSnapshot();
        console.log(`Transactions: ${snap.transactions.length}`);
        if (snap.transactions.length > 0) {
            console.log(JSON.stringify(snap.transactions[0], null, 2));
        }
    } catch (err: any) {
        console.error(err.message);
    }
}
test();
