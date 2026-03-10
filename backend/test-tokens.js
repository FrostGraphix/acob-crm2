const axios = require('axios');
async function test() {
    try {
        const res = await axios.get('http://localhost:4000/api/tokens/records?from=2025-01-01T00:00:00.000Z&to=2026-12-31T00:00:00.000Z');
        console.log(JSON.stringify(res.data.data[0], null, 2));
    } catch (err) {
        console.error(err.message);
    }
}
test();
