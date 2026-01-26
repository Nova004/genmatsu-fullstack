const activityLogRepo = require("../src/repositories/activityLog.repository");

(async () => {
    console.log("Initializing Activity Log Table...");
    await activityLogRepo.initTable();
    process.exit(0);
})();
