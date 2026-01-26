const sql = require("mssql");
const dbConfig = require("../config/db.config");

// Ensure the table exists (Optional: can be run once)
exports.initTable = async () => {
    try {
        const pool = await sql.connect(dbConfig);
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
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        await request
            .input("userId", sql.NVarChar, userId)
            .input("actionType", sql.NVarChar, actionType)
            .input("targetModule", sql.NVarChar, targetModule)
            .input("targetId", sql.NVarChar, targetId ? targetId.toString() : null)
            .input("details", sql.NVarChar, details ? JSON.stringify(details) : null)
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
