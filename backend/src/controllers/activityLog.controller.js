const activityLogRepo = require("../repositories/activityLog.repository");

exports.getAllLogs = async (req, res) => {
    try {
        const logs = await activityLogRepo.getAllLogs();
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching logs", error: error.message });
    }
};
