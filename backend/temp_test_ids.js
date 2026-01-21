const ironpowderService = require('./src/services/ironpowder.service');
const { sql, poolConnect } = require('./src/db');

async function main() {
    try {
        await poolConnect;
        console.log("Connected to DB...");
        const list = await ironpowderService.getAllIronpowder();
        console.log("Found Ironpowder Records:", list.length);
        if (list.length > 0) {
            console.log("Latest ID:", list[0].submissionId);
            console.log("Oldest ID:", list[list.length - 1].submissionId);
        } else {
            console.log("No records found.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
