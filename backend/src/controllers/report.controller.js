// backend/src/controllers/report.controller.js
const { sql, poolConnect } = require("../db");

exports.getDailyProductionReport = async (req, res) => {
  try {
    const { date, lotNoPrefix } = req.query;
    const pool = await poolConnect;

    // แก้ไข Query: ใช้ชื่อคอลัมน์ให้ตรงกับ Database จริง 100%
    let query = `
      SELECT 
        s.submission_id,        -- แก้จาก s.id เป็น s.submission_id
        s.form_type,
        s.lot_no,
        s.production_line,
        s.submitted_at,         -- เพิ่มมาเผื่อใช้ debug
        d.input_kg,
        d.output_kg,
        d.yield_percent,
        d.st_target_value,
        d.pallet_data,
        d.production_date,
        d.moisture
      FROM Form_Submissions AS s
      JOIN Form_Submission_Data AS d ON s.submission_id = d.submission_id -- แก้เงื่อนไข JOIN
      WHERE s.status != 'Rejected'
    `;

    // กรองตามวันที่ผลิต
    if (date) {
      query += ` AND CAST(d.production_date AS DATE) = @date`;
    }
    // กรองตามเลข Lot (4 ตัวหน้า)
    if (lotNoPrefix) {
      query += ` AND s.lot_no LIKE @lotNoPrefix + '%'`;
    }

    // เรียงลำดับตามวันที่กดส่ง (submitted_at) หรือ id ก็ได้
    query += ` ORDER BY s.submission_id ASC`;

    const request = pool.request();
    if (date) request.input("date", sql.Date, date);
    if (lotNoPrefix) request.input("lotNoPrefix", sql.NVarChar, lotNoPrefix);

    const result = await request.query(query);
    const rawData = result.recordset;

    const reportData = {
      lineA: [],
      lineB: [],
      lineC: [],
    };

    rawData.forEach((item) => {
      const formattedItem = {
        id: item.submission_id, // ใช้ submission_id เป็น id หลัก
        productName: item.form_type,
        lotNo: item.lot_no,
        input: item.input_kg,
        output: item.output_kg,
        pallets: item.pallet_data ? JSON.parse(item.pallet_data) : [],
        stPlan: item.st_target_value,
        yield: item.yield_percent,
        moisture: item.moisture,
      };

      // จัดกลุ่มตาม production_line
      if (item.production_line === "A") {
        reportData.lineA.push(formattedItem);
      } else if (item.production_line === "B") {
        reportData.lineB.push(formattedItem);
      } else if (item.production_line === "C") {
        reportData.lineC.push(formattedItem);
      }
    });

    res.json(reportData);
  } catch (err) {
    console.error("Error fetching report:", err);
    res
      .status(500)
      .json({ message: "Error fetching report data", error: err.message });
  }
};

// ✅ เพิ่มส่วนนี้ต่อท้ายไฟล์
exports.getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const pool = await poolConnect;
    const result = await pool
      .request()
      .input("date", sql.Date, date)
      .query(
        `SELECT TOP 1 summary_json FROM GEN_Daily_Report_Summary WHERE report_date = @date`
      );

    if (result.recordset.length > 0) {
      let data = result.recordset[0].summary_json;
      if (typeof data === "string")
        try {
          data = JSON.parse(data);
        } catch (e) {}
      res.json(data);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).send({ message: "Error fetching summary" });
  }
};

exports.saveDailySummary = async (req, res) => {
  try {
    const { date, summaryData } = req.body;
    if (!date) {
      return res.status(400).send({ message: "Date is required!" });
    }
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
