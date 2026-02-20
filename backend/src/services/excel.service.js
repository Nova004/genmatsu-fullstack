// backend/src/services/excel.service.js
const ExcelJS = require("exceljs");
const QuickChart = require("quickchart-js");

/**
 * Generate a chart image buffer using QuickChart
 */
const generateChartImage = async (title, labels, data, color) => {
    const chart = new QuickChart();
    chart.setConfig({
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: title,
                    data: data,
                    backgroundColor: color, // Array of colors
                    borderColor: 'rgba(255,255,255,0.5)',
                    borderWidth: 1,
                    barPercentage: 0.7,
                },
            ],
        },
        options: {
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: title,
                    font: { size: 18, family: 'sans-serif' },
                    color: '#333'
                },
                datalabels: {
                    display: true,
                    color: 'black',
                    anchor: 'end',
                    align: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                x: {
                    grid: { display: false }
                }
            },
        },
    });
    chart.setWidth(1000);
    chart.setHeight(500);
    chart.setBackgroundColor("white");

    return await chart.toBinary();
};

/**
 * Group Data by (Date + Lot + Type)
 * Aggegates: Batch, Plan, Input, Output, NCR, Recycle, Scrap
 */
const aggregateLineData = (lineData) => {
    const groups = {};
    const datesWithData = new Set(); // To track dates that have at least one record

    // 1. First Pass: Process actual data
    lineData.forEach(item => {
        // Extract Short Lot (First 4 digits) e.g., "6005"
        const shortLot = item.lotNo ? item.lotNo.substring(0, 4) : item.lotNo;

        // Extract Line from Lot No (5th char) OR use DB production_line
        let line = "Line_Unknown";
        if (item.lotNo && item.lotNo.length >= 5) {
            const lineChar = item.lotNo.charAt(4);
            line = `Line_${lineChar}`;
        } else if (item.production_line) {
            const cleanLine = item.production_line.replace("Line ", "").replace("Line_", "").trim();
            line = `Line_${cleanLine}`;
        }

        // Create Group Key
        const dateKey = new Date(item.production_date).toISOString().split('T')[0];
        datesWithData.add(dateKey); // Mark this date as having data

        const key = `${dateKey}_${line}_${shortLot}_${item.productName}`; // Adjusted key order for logic clarity, but logic remains same

        if (!groups[key]) {
            groups[key] = {
                production_date: item.production_date,
                lotNo: shortLot,
                line: line,
                productName: item.productName,
                // Aggregates
                batchCount: 0,
                plan: 0,
                input: 0,
                output: 0,
                ncr: 0,
                recycle: 0,
                scrap: 0,
                remarks: new Set(),
                rawRecords: 0
            };
        }

        const group = groups[key];
        group.rawRecords++;

        // Sum Numerical Fields
        group.plan += parseFloat(item.target || 0);
        group.input += parseFloat(item.input || 0);
        group.output += parseFloat(item.output || 0);

        // Count Batches (1 Record = 1 Batch)
        group.batchCount += 1;

        // Parse Form Data (Recycle, Scrap)
        try {
            if (item.formData) {
                const form = typeof item.formData === 'string' ? JSON.parse(item.formData) : item.formData;
                if (form.recycle_kg) group.recycle += parseFloat(form.recycle_kg || 0);
                if (form.scrap_kg) group.scrap += parseFloat(form.scrap_kg || 0);
                else if (form.cleaning_kg) group.scrap += parseFloat(form.cleaning_kg || 0);
            }
        } catch (e) { }

        // Mix NCR Logic
        group.ncr += parseFloat(item.mixNCR || 0);

        // Mix Recycle Logic (Preferred: AZ_RGenmatsu)
        if (item.AZ_RGenmatsu) {
            group.recycle += parseFloat(item.AZ_RGenmatsu || 0);
        } else {
            // Fallback to Form Data Parsing (Old Logic)
            try {
                if (item.formData) {
                    const form = typeof item.formData === 'string' ? JSON.parse(item.formData) : item.formData;
                    if (form.recycle_kg) group.recycle += parseFloat(form.recycle_kg || 0);
                }
            } catch (e) { }
        }

        // Collect Remarks
        if (item.remarks) group.remarks.add(item.remarks);
    });

    // 2. Second Pass: Ensure ALL lines (A, B, C, D, R) exist for dates with data
    const requiredLines = ["Line_A", "Line_B", "Line_C", "Line_D", "Line_R"];

    // Helper: Find a representative Lot No for the date
    const getLotNoForDate = (targetDate) => {
        // Find ANY group that matches this date and has a Lot No
        const sampleGroup = Object.values(groups).find(g => {
            const gDate = new Date(g.production_date).toISOString().split('T')[0];
            return gDate === targetDate && g.lotNo;
        });
        return sampleGroup ? sampleGroup.lotNo : "";
    };

    datesWithData.forEach(dateStr => {
        const commonLotNo = getLotNoForDate(dateStr); // Get the Lot No to share

        requiredLines.forEach(reqLine => {
            // Check if any group exists for this date + line
            // We use .some() because keys contain LotNo & ProductName which vary
            const existingEntry = Object.values(groups).find(g => {
                const gDate = new Date(g.production_date).toISOString().split('T')[0];
                return gDate === dateStr && g.line === reqLine;
            });

            if (!existingEntry) {
                // If missing, create a dummy empty entry
                // Unique Key for dummy: Date_Line_DUMMY
                const dummyKey = `${dateStr}_${reqLine}_DUMMY`;
                groups[dummyKey] = {
                    production_date: new Date(dateStr), // Use the date we found
                    lotNo: commonLotNo, // ✅ Use the Lot No from other lines
                    line: reqLine,
                    productName: "",     // Empty
                    batchCount: 0,
                    plan: 0,
                    input: 0,
                    output: 0,
                    ncr: 0,
                    recycle: 0,
                    scrap: 0,
                    remarks: new Set(),
                    rawRecords: 0
                };
            }
        });
    });

    // Convert Groups to Array
    return Object.values(groups).sort((a, b) => {
        const dateDiff = new Date(a.production_date) - new Date(b.production_date);
        if (dateDiff !== 0) return dateDiff;

        // Custom Sort for Lines: A, B, C, D, R
        const lineOrder = { "Line_A": 1, "Line_B": 2, "Line_C": 3, "Line_D": 4, "Line_R": 5 };
        const orderA = lineOrder[a.line] || 99;
        const orderB = lineOrder[b.line] || 99;

        if (orderA !== orderB) return orderA - orderB;

        if (a.lotNo !== b.lotNo) return a.lotNo.localeCompare(b.lotNo);
        return 0;
    });
};


/**
 * Generate Monthly Production Report Excel
 */
exports.generateMonthlyReport = async (monthStr, reportData) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monthly Report", {
        views: [{ state: "frozen", ySplit: 5 }] // Freeze Headers
    });

    // --- 1. Aesthetics Config ---
    const corporateBlue = { argb: "FF2F75B5" }; // Professional Blue
    const corporateDark = { argb: "FF1F4E78" };
    const stripeColor = { argb: "FFF2F2F2" };   // Light Grey for Zebra
    const whiteColor = { argb: "FFFFFFFF" };

    // --- 2. Title Section ---
    worksheet.mergeCells("A2:N2");
    const titleCell = worksheet.getCell("A2");
    titleCell.value = `MONTHLY PRODUCTION REPORT: ${monthStr}`;
    titleCell.font = { name: "Arial", size: 20, bold: true, color: corporateDark };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };

    worksheet.mergeCells("A3:N3");
    const subTitle = worksheet.getCell("A3");
    subTitle.value = `Generated on: ${new Date().toLocaleString('en-GB')} | Genmatsu`;
    subTitle.font = { name: "Calibri", size: 11, italic: true, color: { argb: "FF555555" } };

    // --- 3. Define Columns ---
    worksheet.getRow(5).values = [
        "No.", "Date", "Lot No.", "Line", "Product Type", "Batch",
        "Plan (kg)", "Input (kg)", "Output (kg)", "% Yield",
        "Scrap (kg)", "Mix NCR (kg)", "Mix Recycle (kg)", "Remarks"
    ];

    worksheet.columns = [
        { key: "no", width: 6 },
        { key: "date", width: 14 },
        { key: "lot", width: 10 },
        { key: "line", width: 10 },
        { key: "type", width: 18 },
        { key: "batch", width: 8 },
        { key: "plan", width: 14 },
        { key: "input", width: 14 },
        { key: "output", width: 14 },
        { key: "yield", width: 10 },
        { key: "scrap", width: 14 },
        { key: "ncr", width: 14 },
        { key: "recycle", width: 14 },
        { key: "remark", width: 25 },
    ];

    // --- 4. Styling Headers ---
    const headerRow = worksheet.getRow(5);
    headerRow.height = 35;

    // Headers to be yellow (1-based index)
    const yellowColumns = [5, 6, 8, 9, 11, 12, 13]; // Type, Batch, Input, Output, Scrap, NCR, Recycle
    const yellowColor = { argb: "FFFFFF00" }; // Standard Excel Bright Yellow

    headerRow.eachCell((cell, colNum) => {
        if (yellowColumns.includes(colNum)) {
            // Yellow Header: Black Text
            cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF000000" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: yellowColor };
        } else {
            // Standard Header: White Text + Corporate Blue
            cell.font = { name: "Arial", size: 11, bold: true, color: whiteColor };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: corporateBlue };
        }

        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = {
            top: { style: "medium", color: corporateDark },
            bottom: { style: "medium", color: corporateDark },
            left: { style: "thin", color: whiteColor },
            right: { style: "thin", color: whiteColor }
        };
    });

    // --- 5. Data Population ---
    let currentRow = 6;
    let runningNo = 1;

    // Use passed data directly (it's already an array now)
    const allLineData = Array.isArray(reportData) ? reportData : [];

    // Aggregation
    const aggregatedGroups = aggregateLineData(allLineData);

    // Chart Data Accumulator
    const lineTotals = {};

    // Color Setup for Alternate Dates
    const colorBlue = { argb: "FFE1EEF4" };   // Light Blue (Updated)
    const colorOrange = { argb: "FFFDE9D9" }; // Light Orange (Updated)
    let currentDateStr = "";
    let isBlue = true; // Start with Blue

    aggregatedGroups.forEach((group) => {
        // Accumulate Chart Data
        const lineName = group.line || "Unknown";
        if (!lineTotals[lineName]) lineTotals[lineName] = 0;
        lineTotals[lineName] += group.output;

        // Calculate Yield
        const yieldPercent = group.input > 0 ? (group.output / group.input) * 100 : 0;

        // Check Date Change for Color Switching
        const thisDateStr = new Date(group.production_date).toISOString().split('T')[0];
        if (thisDateStr !== currentDateStr) {
            isBlue = !isBlue; // Flip Color
            currentDateStr = thisDateStr;
        }
        const rowColor = isBlue ? colorBlue : colorOrange;

        // Row Value
        const row = worksheet.addRow({
            no: runningNo++,
            date: new Date(group.production_date),
            lot: group.lotNo,
            line: group.line.replace("Line_", ""),
            type: group.productName,
            batch: group.batchCount > 0 ? group.batchCount : "",
            plan: group.plan > 0 ? group.plan : "",
            input: group.input > 0 ? group.input : "",
            output: group.output > 0 ? group.output : "",
            yield: group.input > 0 ? (yieldPercent / 100) : "",
            scrap: group.scrap > 0 ? group.scrap : "",
            ncr: group.ncr > 0 ? group.ncr : "",
            recycle: group.recycle > 0 ? group.recycle : "",
            remark: Array.from(group.remarks).join(", ")
        });

        row.height = 24;

        // Styling Row
        row.eachCell((cell, colNum) => {
            cell.font = { name: "Calibri", size: 11 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { bottom: { style: 'thin', color: { argb: "FFCCCCCC" } } };

            // Apply Alternate Date Color
            cell.fill = { type: "pattern", pattern: "solid", fgColor: rowColor };

            // Number Formats
            if ([7, 8, 9, 11, 12, 13].includes(colNum)) { // Plan, Input, Output, Scrap, NCR, Recycle
                cell.numFmt = '#,##0.00';
                if (colNum === 9) cell.font = { bold: true, color: corporateDark }; // Output Bold Blue
            }

            // Date Format
            if (colNum === 2) cell.numFmt = 'd-mmm-yy';

            // Yield Conditional Formatting
            if (colNum === 10) {
                cell.numFmt = '0.00%';
                if (cell.value >= 0.98) {
                    cell.font = { color: { argb: 'FF006100' }, bold: true }; // Dark Green
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: 'FFC6EFCE' } }; // Light Green
                } else if (cell.value < 0.95) {
                    cell.font = { color: { argb: 'FF9C0006' }, bold: true }; // Dark Red
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: 'FFFFC7CE' } }; // Light Red
                }
            }

            // NCR / Scrap Red Alert
            if ((colNum === 11 || colNum === 12) && cell.value > 0) {
                cell.font = { color: { argb: 'FFFF0000' } }; // Red Text
            }
        });

        currentRow++;
    });

    // --- 6. Dynamic Chart Generation ---
    const sortedLines = Object.keys(lineTotals).sort();
    const chartLabels = sortedLines.map(l => l.replace("_", " "));
    const chartDataValues = sortedLines.map(l => lineTotals[l]);

    // Professional Soft Palette
    const chartColors = [
        'rgba(47, 117, 181, 0.7)',  // Corp Blue
        'rgba(192, 0, 0, 0.7)',     // Deep Red
        'rgba(112, 173, 71, 0.7)',  // Green
        'rgba(237, 125, 49, 0.7)',  // Orange
        'rgba(165, 165, 165, 0.7)'  // Grey
    ];

    currentRow += 3;
    try {
        const chartBuffer = await generateChartImage(
            `Total Output by Line (${monthStr})`,
            chartLabels,
            chartDataValues,
            chartColors.slice(0, sortedLines.length)
        );
        const imageId = workbook.addImage({ buffer: chartBuffer, extension: "png" });
        worksheet.addImage(imageId, {
            tl: { col: 1, row: currentRow },
            ext: { width: 800, height: 400 },
        });
    } catch (error) { console.error("Chart error", error); }

    return await workbook.xlsx.writeBuffer();
};
