// backend/src/controllers/report.controller.js
const { sql, poolConnect } = require("../db");
const pdfService = require("../services/pdf.service");
const config = require("../config/env");

// --- Helper Function: ดึงข้อมูล (แก้ให้ส่ง Raw Data ออกไปเลย) ---
const fetchDailyReportDataInternal = async (date, lotNoPrefix) => {
  const pool = await poolConnect;

  // 1. สร้าง Query หลัก
  let query = `
      SELECT 
        s.submission_id,
        s.form_type,
        s.lot_no,
        s.production_line,
        s.submitted_at,
        d.input_kg,
        d.output_kg,
        d.yield_percent,
        d.st_target_value,
        d.pallet_data,
        d.production_date,
        d.moisture
      FROM Form_Submissions AS s
      JOIN Form_Submission_Data AS d ON s.submission_id = d.submission_id
      WHERE s.status != 'Rejected'
  `;

  // 2. เงื่อนไข
  if (date) query += ` AND CAST(d.production_date AS DATE) = @date`;
  if (lotNoPrefix) query += ` AND s.lot_no LIKE @lotNoPrefix + '%'`;

  // 3. Order By
  query += ` ORDER BY s.lot_no ASC`;

  const request = pool.request();
  if (date) request.input("date", sql.Date, date);
  if (lotNoPrefix) request.input("lotNoPrefix", sql.NVarChar, lotNoPrefix);

  const result = await request.query(query);

  // ✅ แก้ตรงนี้: ส่ง recordset (Array) กลับไปเลย ไม่ต้องจัดกลุ่มที่นี่
  return result.recordset;
};

// --- Controller 1: API สำหรับหน้าเว็บ ---
exports.getDailyProductionReport = async (req, res) => {
  try {
    const { date, lotNoPrefix } = req.query;
    const rawData = await fetchDailyReportDataInternal(date, lotNoPrefix);

    // ✅ เปลี่ยนชื่อ Key เป็น lineD
    const reportData = {
      lineA: [],
      lineB: [],
      lineC: [],
      lineD: [], // เปลี่ยนจาก lineZE1A เป็น lineD
    };

    if (rawData && rawData.length > 0) {
      rawData.forEach((item) => {
        const formattedItem = {
          id: item.submission_id,
          productName: item.form_type,
          lotNo: item.lot_no,
          input: item.input_kg,
          output: item.output_kg,
          pallets: item.pallet_data ? JSON.parse(item.pallet_data) : [],
          stPlan: item.st_target_value,
          yield: item.yield_percent,
          moisture: item.moisture,
          production_date: item.production_date,
        };

        const lineName = item.production_line || "";

        if (lineName.includes("Line A") || lineName === "A") {
          reportData.lineA.push(formattedItem);
        } else if (lineName.includes("Line B") || lineName === "B") {
          reportData.lineB.push(formattedItem);
        } else if (lineName.includes("Line C") || lineName === "C") {
          reportData.lineC.push(formattedItem);
        } else if (lineName.includes("Line D") || lineName === "D") {
          reportData.lineD.push(formattedItem);
        }
      });
    }

    res.status(200).json(reportData);
  } catch (err) {
    console.error("Error fetching report:", err);
    res
      .status(500)
      .json({ message: "Error fetching data", error: err.message });
  }
};

const ironpowderService = require("../services/ironpowder.service");

// --- Controller 2: API Summary (แก้ไขเพื่อรวม Ironpowder) ---
exports.getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).send({ message: "Date is required" });

    const pool = await poolConnect;

    // 1. ดึง Remarks (เดิม)
    const remarksResult = await pool
      .request()
      .input("date", sql.Date, date)
      .query(
        `SELECT summary_json FROM GEN_Daily_Report_Summary WHERE report_date = @date`
      );

    let summaryData = {};
    if (remarksResult.recordset.length > 0) {
      let data = remarksResult.recordset[0].summary_json;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
          summaryData = data; // คาดหวัง { remarks: {...} }
        } catch (e) { }
      }
    }

    // 2. ดึง Ironpowder Summary (ใหม่)
    const recycleData = await ironpowderService.getIronpowderSummaryByDate(date);

    // 3. รวมร่าง
    const finalResponse = {
      ...summaryData, // remarks เดิม
      recycleData, // ข้อมูลใหม่
    };

    res.json(finalResponse);
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).send({ message: "Error fetching summary" });
  }
};

// --- Controller 3: API Save Summary (เหมือนเดิม) ---
exports.saveDailySummary = async (req, res) => {
  try {
    const { date, summaryData } = req.body;
    if (!date) return res.status(400).send({ message: "Date is required!" });

    const pool = await poolConnect;
    const jsonString = JSON.stringify(summaryData);

    const checkExist = await pool
      .request()
      .input("date", sql.Date, date)
      .query(
        `SELECT id FROM GEN_Daily_Report_Summary WHERE report_date = @date`
      );

    if (checkExist.recordset.length > 0) {
      await pool
        .request()
        .input("date", sql.Date, date)
        .input("jsonString", sql.NVarChar(sql.MAX), jsonString)
        .query(
          `UPDATE GEN_Daily_Report_Summary SET summary_json = @jsonString, updated_at = GETDATE() WHERE report_date = @date`
        );
    } else {
      await pool
        .request()
        .input("date", sql.Date, date)
        .input("jsonString", sql.NVarChar(sql.MAX), jsonString)
        .query(
          `INSERT INTO GEN_Daily_Report_Summary (report_date, summary_json, updated_at) VALUES (@date, @jsonString, GETDATE())`
        );
    }
    res.json({ message: "Saved successfully" });
  } catch (error) {
    console.error("Error saving summary:", error);
    res.status(500).send({ message: "Error saving summary" });
  }
};

// --- Controller 4: API Download PDF (เหมือนเดิม) ---
exports.downloadDailyReportPdf = async (req, res) => {
  try {
    const { date, lotNoPrefix } = req.query;
    if (!date) return res.status(400).send({ message: "Date is required" });

    // สร้าง PDF buffer
    const pdfBuffer = await pdfService.generateDailyReportPdf(
      date,
      lotNoPrefix
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Daily_Report_${date}.pdf`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send({ message: "Error generating PDF" });
  }
};
