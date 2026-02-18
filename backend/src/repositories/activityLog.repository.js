// backend/src/repositories/activityLog.repository.js
const { sql, poolConnect } = require("../db");

exports.getAllLogs = async () => {
    try {
        const pool = await poolConnect;
        const result = await pool.request().query(`
            SELECT TOP 1000 
                l.*,
                t.change_reason AS extra_change_reason
            FROM Gen_Activity_Logs l
            LEFT JOIN Form_Master_Templates t ON 
                l.target_module = 'MASTER_TEMPLATE' 
                AND l.target_id = t.template_name + ' (v' + CAST(t.version AS NVARCHAR(10)) + ')'
            ORDER BY l.timestamp DESC
        `);
        return result.recordset;
    } catch (err) {
        console.error("Error getting all activity logs:", err);
        throw err;
    }
};

// Ensure the table exists (Optional: can be run once)
exports.initTable = async () => {
    try {
        const pool = await poolConnect;
        const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Gen_Activity_Logs' AND xtype='U')
      CREATE TABLE Gen_Activity_Logs (
          log_id INT IDENTITY(1,1) PRIMARY KEY,
          user_id NVARCHAR(50),
          action_type NVARCHAR(50),
          target_module NVARCHAR(50),
          target_id NVARCHAR(50),
          details NVARCHAR(MAX),
          timestamp DATETIME DEFAULT GETDATE()
      );
    `;
        await pool.request().query(query);
        console.log("Gen_Activity_Logs table checked/created.");
    } catch (err) {
        console.error("Error creating Gen_Activity_Logs table:", err);
    }
};

exports.createLog = async ({ userId, actionType, targetModule, targetId, details }) => {
    try {
        const pool = await poolConnect;

        // Check if details is an object/array, stringify it. If it's a string, use as is.
        const detailsData = (details && (typeof details === 'object' || Array.isArray(details)))
            ? JSON.stringify(details)
            : details;

        await pool.request()
            .input("userId", sql.NVarChar, userId)
            .input("actionType", sql.NVarChar, actionType)
            .input("targetModule", sql.NVarChar, targetModule)
            .input("targetId", sql.NVarChar, targetId ? targetId.toString() : null)
            .input("details", sql.NVarChar, detailsData)
            .query(`
        INSERT INTO Gen_Activity_Logs (user_id, action_type, target_module, target_id, details)
        VALUES (@userId, @actionType, @targetModule, @targetId, @details)
      `);

        // console.log(`Activity Logged: ${actionType} on ${targetModule} by ${userId}`);
    } catch (err) {
        console.error("Failed to create activity log:", err);
        // Don't throw logic error, logging failure shouldn't stop the main process
    }
};
