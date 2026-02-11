const { sql, poolConnect } = require("../src/db");
const excelService = require("../src/services/excel.service");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const runTest = async () => {
    console.log("🚀 Starting Real Data Excel Test...");

    const year = 2026;
    const month = 1; // February
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    try {
        const pool = await poolConnect;
        console.log("✅ Database Connected");

        // Start Date: 1st of Month
        const startDate = new Date(year, month - 1, 1);
        startDate.setHours(0, 0, 0, 0);

        // End Date: 1st of Next Month (Exclusive)
        const endDate = new Date(year, month, 1);
        endDate.setHours(0, 0, 0, 0);

        console.log(`🔎 Querying Data for: ${monthStr} (${startDate.toISOString()} - ${endDate.toISOString()})`);

        let query = `
          SELECT * FROM (
            SELECT 
                s.submission_id, s.form_type, s.lot_no, s.production_line, s.submitted_at,
                d.input_kg, d.output_kg, d.yield_percent, d.st_target_value, d.pallet_data, d.production_date, d.form_data_json,
                d.AZ_RGenmatsu, -- ✅ Fetch Mix Recycle Data
                (d.st_target_value - COALESCE(mt.target_value, 0)) AS mix_ncr
            FROM Form_Submissions AS s
            JOIN Form_Submission_Data AS d ON s.submission_id = d.submission_id
            LEFT JOIN Gen_StandardPlan_MT AS mt ON s.form_type = mt.form_type COLLATE Thai_CI_AS
            WHERE s.status != 'Rejected'
                AND d.production_date >= @startDate AND d.production_date < @endDate

            UNION ALL

            SELECT 
                ip.submissionId AS submission_id,
                ip.machine_name AS form_type,
                ip.lot_no,
                'Line R' AS production_line,
                ip.created_at AS submitted_at,
                ip.total_input AS input_kg,
                ip.total_genmatsu_a AS output_kg,
                0 AS yield_percent,
                COALESCE(mt.target_value, 0) AS st_target_value, -- ✅ Fetch Plan from Master Table
                NULL AS pallet_data, 
                ip.report_date AS production_date,
                ip.form_data_json,
                0 AS AZ_RGenmatsu,
                0 AS mix_ncr 
            FROM Form_Ironpowder_Submissions AS ip
            LEFT JOIN Gen_StandardPlan_MT AS mt ON ip.machine_name = mt.form_type COLLATE Thai_CI_AS -- Match machine_name with form_type
            WHERE ip.status != 'Rejected'
                AND ip.report_date >= @startDate AND ip.report_date < @endDate
          ) AS UnifiedReport
            ORDER BY production_date ASC, production_line ASC
        `;

        const result = await pool.request()
            .input("startDate", sql.DateTime, startDate)
            .input("endDate", sql.DateTime, endDate)
            .query(query);

        console.log(`✅ Found ${result.recordset.length} records.`);

        // Map Raw Data to Formatted Items (Flat Array)
        const reportData = result.recordset.map(item => ({
            productName: item.form_type,
            lotNo: item.lot_no,
            production_line: item.production_line,
            input: item.input_kg,
            output: item.output_kg,
            yield: item.yield_percent,
            production_date: item.production_date,
            target: item.st_target_value,
            palletData: item.pallet_data,
            formData: item.form_data_json,
            mixNCR: item.mix_ncr, // ✅ Passed from SQL
            AZ_RGenmatsu: item.AZ_RGenmatsu // ✅ Passed to Service
        }));

        console.log("📊 Generating Excel...");
        const buffer = await excelService.generateMonthlyReport(monthStr, reportData);

        const timestamp = new Date().getTime();
        const outputPath = path.join(__dirname, `real_data_report_${monthStr}_${timestamp}.xlsx`);
        fs.writeFileSync(outputPath, buffer);

        console.log(`✅ Excel saved to: ${outputPath}`);
        console.log("📂 Please open the file to verify Data and Charts.");

    } catch (error) {
        console.error("❌ Test Failed:", error);
    } finally {
        process.exit(0);
    }
};

runTest();
