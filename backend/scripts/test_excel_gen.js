const excelService = require("../src/services/excel.service");
const fs = require("fs");
const path = require("path");

const runTest = async () => {
    console.log("🚀 Starting Excel Generation Test...");

    // Mock Data
    const monthStr = "2026-02";
    const dummyData = {
        lineA: [
            { production_date: "2026-02-01", productName: "Product A1", lotNo: "L001", input: 1000, output: 950, yield: 95 },
            { production_date: "2026-02-02", productName: "Product A1", lotNo: "L002", input: 1000, output: 960, yield: 96 },
        ],
        lineB: [
            { production_date: "2026-02-01", productName: "Product B1", lotNo: "L003", input: 2000, output: 1900, yield: 95 },
        ],
        lineC: [],
        lineD: [
            { production_date: "2026-02-05", productName: "Product D1", lotNo: "L004", input: 500, output: 480, yield: 96 },
        ]
    };

    try {
        console.log("📊 Generating Excel with Charts...");
        const buffer = await excelService.generateMonthlyReport(monthStr, dummyData);

        const outputPath = path.join(__dirname, "test_report.xlsx");
        fs.writeFileSync(outputPath, buffer);

        console.log(`✅ Excel saved to: ${outputPath}`);
        console.log("📂 Please open the file to verify Styling and Charts.");
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
};

runTest();
