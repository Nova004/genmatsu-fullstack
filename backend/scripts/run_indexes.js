const fs = require('fs');
const path = require('path');
const { pool, poolConnect } = require('../src/db');

async function runMigration() {
    try {
        console.log("🔌 Connecting to Database...");
        await poolConnect;
        console.log("✅ Connected.");

        const sqlPath = path.join(__dirname, 'add_indexes.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split by 'GO' case-insensitive, as mssql driver queries don't support batch separators
        const commands = sqlContent
            .split(/\nGO\s*(\n|$)/i)
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0);

        console.log(`📜 Found ${commands.length} SQL batches to execute.`);

        for (const [index, cmd] of commands.entries()) {
            console.log(`\n--- Executing Batch ${index + 1} ---`);
            // Remove 'USE ...' if present as we are likely already connected to the DB, 
            // but keeping it usually throws duplicate context warning or error in some drivers.
            // We will try running it.

            try {
                await pool.request().query(cmd);
                console.log(`✅ Batch ${index + 1} Success`);
            } catch (err) {
                console.error(`❌ Batch ${index + 1} Failed:`, err.message);
                // Don't exit, try next batch (idempotency check in SQL usually handles logic)
            }
        }

        console.log("\n🎉 Migration Complete.");
        process.exit(0);

    } catch (err) {
        console.error("🔥 Fatal Error:", err);
        process.exit(1);
    }
}

runMigration();
