const { sql, poolConnect } = require("../src/db"); // Adjust path to db.js

async function migrate() {
    let pool;
    try {
        console.log("Connecting to database...");
        pool = await poolConnect;
        console.log("Connected.");

        console.log("Starting migration: Altering Form_Ironpowder_Submissions.submitted_by to NVARCHAR(50)...");

        // 1. Drop the index that depends on the column
        console.log("Dropping index IDX_Ironpowder_SubmittedBy...");
        await pool.request().query(`
      DROP INDEX IF EXISTS IDX_Ironpowder_SubmittedBy ON Form_Ironpowder_Submissions;
    `);

        // 2. Alter the column
        console.log("Altering column submitted_by to NVARCHAR(50)...");
        await pool.request().query(`
      ALTER TABLE Form_Ironpowder_Submissions
      ALTER COLUMN submitted_by NVARCHAR(50) NULL;
    `);

        // 3. Recreate the index
        console.log("Recreating index IDX_Ironpowder_SubmittedBy...");
        await pool.request().query(`
      CREATE INDEX IDX_Ironpowder_SubmittedBy ON Form_Ironpowder_Submissions(submitted_by);
    `);

        console.log("✅ Migration successful: submitted_by is now NVARCHAR(50) and index recreated.");

    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        process.exit();
    }
}

migrate();
