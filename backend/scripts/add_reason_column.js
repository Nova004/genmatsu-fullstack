const { sql, poolConnect } = require('../src/db');

async function runMigration() {
    try {
        console.log('Connecting to database...');
        const pool = await poolConnect;
        console.log('Connected!');

        const tableName = 'Form_Master_Templates';
        const columnName = 'change_reason';

        // Check if column exists
        const checkQuery = `
      SELECT COUNT(*) AS count 
      FROM sys.columns 
      WHERE object_id = OBJECT_ID(@tableName) 
      AND name = @columnName
    `;

        const result = await pool.request()
            .input('tableName', sql.NVarChar, tableName)
            .input('columnName', sql.NVarChar, columnName)
            .query(checkQuery);

        if (result.recordset[0].count > 0) {
            console.log(`Column '${columnName}' already exists in '${tableName}'.`);
        } else {
            console.log(`Column '${columnName}' not found. Adding it...`);
            const alterQuery = `ALTER TABLE ${tableName} ADD ${columnName} NVARCHAR(MAX) NULL`;
            await pool.request().query(alterQuery);
            console.log(`Successfully added column '${columnName}' to '${tableName}'.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
