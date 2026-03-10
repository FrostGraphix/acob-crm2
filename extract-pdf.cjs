const fs = require('fs');
const pdf = require('pdf-parse');

async function main() {
  const dataBuffer = fs.readFileSync('sop.pdf');
  const data = await pdf(dataBuffer);
  console.log(data.text);
}

main().catch(console.error);
