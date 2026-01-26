// backend/src/controllers/approval.controller.js

const sql = require("mssql");
const dbConfig = require("../config/db.config");
const activityLogRepo = require("../repositories/activityLog.repository"); // ✅ Import Logger

// Helper to get table names and column names based on category
const getTables = (category) => {
  if (category === 'Recycle' || category === 'Ironpowder') {
    return {
      flowTable: 'Form_Ironpowder_Approval_Flow',
      logTable: 'Form_Ironpowder_Approved_Log',
      submissionTable: 'Form_Ironpowder_Submissions',
      submissionIdCol: 'submissionId' // Ironpowder uses camelCase
    };
  }
  return {
    flowTable: 'Gen_Approval_Flow',
    logTable: 'Gen_Approved_log',
    submissionTable: 'Form_Submissions',
    submissionIdCol: 'submission_id' // Generic uses snake_case
  };
};

// ----------------------------------------------------------------
// 1. API สำหรับ "อ่าน" (GET /api/approvals/flow/:submissionId)
// ----------------------------------------------------------------
const getApprovalFlow = async (req, res) => {
  const { submissionId } = req.params;
  const { category } = req.query; // รับ category จาก query string

  const { flowTable, logTable, submissionIdCol } = getTables(category);

  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const request = new sql.Request(pool);

    const query = `
        SELECT 
            gaf.flow_id,
            gaf.${submissionIdCol} as submission_id,
            gaf.sequence,
            gaf.required_level,
            gaf.status,
            gaf.approver_user_id,
            gaf.updated_at,

            am.agt_member_nameEN AS approver_name, 

            gal.comment -- 1. [เพิ่ม] ดึง comment จากตาราง Log

        FROM ${flowTable} gaf

        LEFT JOIN AGT_SMART_SY.dbo.Gen_Manu_Member us 
            ON gaf.approver_user_id COLLATE DATABASE_DEFAULT = us.Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT

        LEFT JOIN AGT_SMART_SY.dbo.agt_member am
            ON us.Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT = am.agt_member_id COLLATE DATABASE_DEFAULT
                  
        -- 2. [เพิ่ม] JOIN ตาราง Log
        LEFT JOIN ${logTable} gal
            -- กุญแจที่ 1: ต้องเป็น Submission เดียวกัน
            ON gaf.${submissionIdCol} = gal.${submissionIdCol} 
            -- กุญแจที่ 2: ต้องเป็น Level เดียวกัน
            AND gaf.required_level = gal.level 
            
            -- กุญแจที่ 3 (optional but good practice): เลือก Log ล่าสุด หรือ Log ที่ตรงกับ action ปัจจุบัน
            -- (ในที่นี้เรา assume ว่า Log ล่าสุดคืออันที่ถูกต้อง)

        WHERE gaf.${submissionIdCol} = @submissionId
        ORDER BY gaf.sequence ASC;
    `;

    const result = await request
      .input("submissionId", sql.Int, submissionId)
      .query(query);

    // Map result to ensure consistent camelCase/snake_case for frontend if needed
    // But aligning the AS alias in SQL is better

    res.status(200).send(result.recordset);
  } catch (error) {
    console.error("Error fetching approval flow:", error.message);
    res
      .status(500)
      .send({ message: "เกิดข้อผิดพลาดที่ Server", error: error.message });
  } finally {
    if (pool) {
      pool.close();
    }
  }
};

// ----------------------------------------------------------------
// 2. API สำหรับ "กระทำ" (POST /api/approvals/action)
// ----------------------------------------------------------------
const performApprovalAction = async (req, res) => {
  // ข้อมูลที่ Frontend ต้องส่งมา
  let { submissionId, action, comment, approverUserId, category } = req.body; // รับ category

  // ✅ 0. Sanitize submissionId (Fix "516.00" issue)
  submissionId = parseInt(submissionId);

  const { flowTable, logTable, submissionTable, submissionIdCol } = getTables(category);

  // ตรวจสอบข้อมูล
  if (!submissionId || !action || !approverUserId) {
    return res
      .status(400)
      .send({
        message:
          "ข้อมูลที่ส่งมาไม่ครบถ้วน (submissionId, action, approverUserId)",
      });
  }
  if (action !== "Approved" && action !== "Rejected") {
    return res
      .status(400)
      .send({ message: "Action ต้องเป็น 'Approved' หรือ 'Rejected' เท่านั้น" });
  }

  let pool;
  let transaction;

  try {
    pool = await sql.connect(dbConfig);
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = new sql.Request(transaction);

    // --- 1. ตรวจสอบสิทธิ์ (Permission Check) ---

    // 1a. ดึง "LV ของผู้กด" (Approver)
    // (เราต้องแก้ Collate Conflict ที่นี่ด้วย)
    const userResult = await request.input(
      "approverUserId",
      sql.NVarChar,
      approverUserId
    ).query(`
        SELECT LV_Approvals FROM AGT_SMART_SY.dbo.Gen_Manu_Member 
        WHERE Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT = @approverUserId COLLATE DATABASE_DEFAULT
      `);

    if (userResult.recordset.length === 0) {
      throw new Error(`ไม่พบผู้ใช้งาน (Approver) ID: ${approverUserId}`);
    }
    const approverLevel = userResult.recordset[0].LV_Approvals;

    // 1b. ดึง "งานที่ต้องทำ" (Step ที่กำลัง Pending)
    const flowResult = await request.input(
      "submissionId",
      sql.Int,
      submissionId
    ).query(`
        SELECT TOP 1 * FROM ${flowTable} 
        WHERE ${submissionIdCol} = @submissionId AND status = 'Pending'
        ORDER BY sequence ASC
      `);

    if (flowResult.recordset.length === 0) {
      // ไม่มีงาน Pending (อาจจะอนุมัติครบแล้ว หรือถูก Reject ไปแล้ว)
      await transaction.rollback();
      return res
        .status(400)
        .send({ message: "เอกสารนี้ไม่อยู่ในสถานะรอดำเนินการ (Pending)" });
    }

    const currentStep = flowResult.recordset[0];

    // 1c. ตรวจสอบ LV (ตาคุณหรือยัง?)
    if (currentStep.required_level !== approverLevel) {
      await transaction.rollback();
      return res
        .status(403)
        .send({
          message: `สิทธิ์ไม่ถูกต้อง: เอกสารนี้กำลังรอ LV ${currentStep.required_level}, แต่คุณคือ LV ${approverLevel}`,
        });
    }

    // --- 2. ถ้าสิทธิ์ถูกต้อง (UPDATE State) ---
    // (อัปเดตตาราง Gen_Approval_Flow หรือ Ironpowder Flow)
    const updateStateRequest = new sql.Request(transaction);
    await updateStateRequest
      .input("actionStatus", sql.NVarChar, action) // 'Approved' หรือ 'Rejected'
      .input("flowId", sql.Int, currentStep.flow_id)
      .input("approverUserId", sql.NVarChar, approverUserId) // (เราต้องใช้ input() เพื่อความปลอดภัย)
      .query(`
        UPDATE ${flowTable} 
        SET 
          status = @actionStatus, 
          approver_user_id = @approverUserId, 
          updated_at = GETDATE()
        WHERE flow_id = @flowId
      `);

    // --- 3. (INSERT Log) ---
    // (เพิ่มประวัติลงใน Gen_Approved_log หรือ Ironpowder Log)
    const insertLogRequest = new sql.Request(transaction);
    await insertLogRequest
      .input("submissionId", sql.Int, submissionId)
      .input("approverUserId", sql.NVarChar, approverUserId)
      .input("approverLevel", sql.Int, approverLevel)
      .input("actionStatus", sql.NVarChar, action)
      .input("comment", sql.NVarChar, comment || null) // รับ comment (ถ้ามี)
      .query(`
        INSERT INTO ${logTable} 
          (${submissionIdCol}, User_approver_id, [level], [action], [comment], created_at)
        VALUES 
          (@submissionId, @approverUserId, @approverLevel, @actionStatus, @comment, GETDATE())
      `);

    // --- 4. (Check Overall Status) ---
    // (อัปเดตตารางแม่ Form_Submissions หรือ Form_Ironpowder_Submissions)

    let overallStatus = null; // (ค่าเริ่มต้น = ยังไม่ทำอะไร)

    if (action === "Rejected") {
      overallStatus = "Rejected"; // ถ้ากด Reject -> เอกสารนี้ Rejected ทันที
    } else {
      // ถ้ากด Approved, เช็คว่านี่คือ "ขั้นสุดท้าย" หรือยัง?
      const remainingRequest = new sql.Request(transaction);
      const remainingResult = await remainingRequest.input(
        "submissionId",
        sql.Int,
        submissionId
      ).query(`
          SELECT COUNT(*) as pendingCount 
          FROM ${flowTable} 
          WHERE ${submissionIdCol} = @submissionId AND status = 'Pending'
        `);

      if (remainingResult.recordset[0].pendingCount === 0) {
        // ไม่มี Pending เหลือแล้ว -> อนุมัติสมบูรณ์
        overallStatus = "Approved";
      }
    }

    if (overallStatus) {
      // ถ้ามีสถานะใหม่ (Rejected หรือ Approved)
      const updateOverallRequest = new sql.Request(transaction);
      await updateOverallRequest
        .input("overallStatus", sql.NVarChar, overallStatus)
        .input("submissionId", sql.Int, submissionId).query(`
          UPDATE ${submissionTable} 
          SET status = @overallStatus 
          WHERE ${submissionIdCol} = @submissionId
        `);
    }

    // ✅ Get Lot No & Form Type for better logging
    const infoRequest = new sql.Request(transaction);
    const infoResult = await infoRequest
      .input("submissionId", sql.Int, submissionId)
      .query(`SELECT lot_no, form_type FROM ${submissionTable} WHERE ${submissionIdCol} = @submissionId`);

    const lotNo = infoResult.recordset[0]?.lot_no || 'Unknown';
    const formType = infoResult.recordset[0]?.form_type || 'Submission';

    // --- 5. Commit Transaction ---
    await transaction.commit();

    if (req.io) {
      console.log(`[Approval] Emitting 'refresh_data' for Submission ID: ${submissionId}`);
      req.io.emit("server-action", { action: "refresh_data", updatedId: submissionId });
    }

    // ✅ Log Activity for Approval/Rejection
    const reasonText = comment ? `. Reason: ${comment}` : '';
    await activityLogRepo.createLog({
      userId: approverUserId,
      actionType: action.toUpperCase(), // 'APPROVED' or 'REJECTED'
      targetModule: formType, // ✅ Use specific form type (GEN-A, Ironpowder, etc.)
      targetId: submissionId, // ✅ Already parseInt-ed
      details: `${action} Lot No: ${lotNo}${reasonText}`
    });

    res.status(200).send({ message: `ดำเนินการ ${action} สำเร็จ!` });
  } catch (error) {
    console.error("Error performing approval action:", error.message);
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    res
      .status(500)
      .send({ message: "เกิดข้อผิดพลาดที่ Server", error: error.message });
  } finally {
    if (pool) {
      pool.close();
    }
  }
};

module.exports = {
  getApprovalFlow,
  performApprovalAction,
};
