// backend/src/repositories/ironpowder.repository.js

const { sql } = require("../db");

exports.getUserApprovalLevel = async (pool, userId) => {
  try {
    const result = await pool.request().input("userId", sql.NVarChar, userId)
      .query(`
        SELECT LV_Approvals
        FROM AGT_SMART_SY.dbo.Gen_Manu_Member
        WHERE Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT = @userId COLLATE DATABASE_DEFAULT
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0].LV_Approvals;
  } catch (error) {
    console.error("Error getting user approval level:", error);
    throw error;
  }
};

exports.createApprovalFlowSteps = async (
  transaction,
  submissionId,
  flowSteps,
  tableName = "Form_Ironpowder_Submissions"
) => {
  try {
    if (!flowSteps || flowSteps.length === 0) return;

    // 🚀 Turbo: Construct Batch Insert SQL
    const values = flowSteps
      .map((_, index) => `(@submissionId, @s${index}, @r${index}, 'Pending')`)
      .join(", ");

    const request = transaction.request();
    request.input("submissionId", sql.Int, submissionId);

    // Bind parameters for each step
    flowSteps.forEach((step, index) => {
      request.input(`s${index}`, sql.Int, step.sequence);
      request.input(`r${index}`, sql.Int, step.required_level);
    });

    await request.query(`
      INSERT INTO Form_Ironpowder_Approval_Flow (submissionId, sequence, required_level, status)
      VALUES ${values}
    `);

    console.log(
      `[Repo] Created ${flowSteps.length} approval flow steps in Form_Ironpowder_Approval_Flow (Turbo Batch)`
    );
  } catch (error) {
    console.error("Error creating approval flow steps:", error);
    throw error;
  }
};

exports.getApprovalFlowBySubmissionId = async (pool, submissionId) => {
  try {
    const result = await pool
      .request()
      .input("submissionId", sql.Int, submissionId)
      .query(`
        SELECT *
        FROM Form_Ironpowder_Approval_Flow
        WHERE submissionId = @submissionId
        ORDER BY sequence ASC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting approval flow:", error);
    throw error;
  }
};

exports.getApprovedLogs = async (pool, submissionId) => {
  try {
    const result = await pool
      .request()
      .input("submissionId", sql.Int, submissionId) // ใช้ตัวแปร submissionId ที่รับมานั่นแหละ
      .query(`
        SELECT *
        FROM Form_Ironpowder_Approved_Log  -- <-- เปลี่ยนเป็นตารางใหม่
        WHERE submissionId = @submissionId -- <-- เปลี่ยนชื่อคอลัมน์ให้ตรง
        ORDER BY created_at DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting approved logs:", error);
    throw error;
  }
};

exports.getAllIronpowder = async (pool, params) => {
  const { page, pageSize, search, startDate, endDate, status, user, formType } = params;
  const offset = (page - 1) * pageSize;

  const request = pool.request();

  let conditions = [];

  if (search) {
    request.input('search', sql.NVarChar, `%${search}%`);
    conditions.push("(fs.lot_no LIKE @search OR u.agt_member_nameEN LIKE @search)");
  }

  if (user) {
    request.input('user', sql.NVarChar, `%${user}%`);
    conditions.push("u.agt_member_nameEN LIKE @user");
  }

  if (formType) {
    request.input('formType', sql.NVarChar, formType);
    conditions.push("fs.machine_name = @formType"); // ✅ User confirmed to use machine_name
  }

  // Validate dates
  if (startDate && startDate !== 'null' && endDate && endDate !== 'null') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      request.input('startDate', sql.Date, startDate);
      request.input('endDate', sql.Date, endDate);
      conditions.push("fs.report_date BETWEEN @startDate AND @endDate");
    }
  }

  if (status) {
    request.input('status', sql.NVarChar, status);
    conditions.push("fs.status = @status");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 1. Get Total Count
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM Form_Ironpowder_Submissions fs
    LEFT JOIN AGT_SMART_SY.dbo.agt_member u ON CAST(fs.submitted_by AS NVARCHAR(50)) COLLATE Thai_CI_AS = u.agt_member_id
    ${whereClause}
  `;
  const countResult = await request.query(countQuery);
  const total = countResult.recordset[0].total;

  // 2. Get Data with Pagination
  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, pageSize);

  const dataQuery = `
      SELECT 
        fs.submissionId,
        fs.lot_no,
        fs.form_type,
        fs.submitted_by,
        u.agt_member_nameEN AS submitted_by_name,
        fs.status,
        fs.report_date,
        fs.machine_name,
        (
          SELECT TOP 1 required_level 
          FROM Form_Ironpowder_Approval_Flow f 
          WHERE f.submissionId = fs.submissionId AND f.status = 'Pending'
          ORDER BY f.sequence ASC
        ) AS pending_level,
        fs.total_input,
        fs.total_output,
        fs.diff_weight,
        fs.created_at,
        fs.updated_at
      FROM Form_Ironpowder_Submissions fs
      LEFT JOIN AGT_SMART_SY.dbo.agt_member u ON CAST(fs.submitted_by AS NVARCHAR(50)) COLLATE Thai_CI_AS = u.agt_member_id
      ${whereClause}
      ORDER BY fs.submissionId DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
  `;

  const dataResult = await request.query(dataQuery);

  return {
    data: dataResult.recordset,
    total: total
  };
};

exports.getPendingIronpowderByLevel = async (pool, userLevel) => {
  try {
    const result = await pool.request().input("userLevel", sql.Int, userLevel)
      .query(`
        SELECT 
          s.submissionId AS submission_id,
          s.lot_no,
          s.submitted_by,
          u.agt_member_nameEN AS submitted_by_name,
          s.created_at, -- ใช้ created_at สำหรับ sorting
          s.status,
          'Recycle' AS category, -- ✅ ระบุ Category ชัดเจน
          (
            SELECT TOP 1 required_level 
            FROM Form_Ironpowder_Approval_Flow 
            WHERE submissionId = s.submissionId AND status = 'Pending' 
            ORDER BY sequence ASC
          ) AS pending_level
        FROM Form_Ironpowder_Submissions s
        LEFT JOIN AGT_SMART_SY.dbo.agt_member u ON s.submitted_by COLLATE Thai_CI_AS = u.agt_member_id
        WHERE s.status = 'Pending' 
          AND (
            SELECT TOP 1 required_level 
            FROM Form_Ironpowder_Approval_Flow 
            WHERE submissionId = s.submissionId AND status = 'Pending' 
            ORDER BY sequence ASC
          ) = @userLevel
        ORDER BY s.created_at DESC
      `);


    return result.recordset;
  } catch (error) {
    console.error("Error fetching pending ironpowder tasks:", error);
    throw error;
  }
};

exports.getRejectedIronpowderByUser = async (pool, userId) => {
  try {
    const result = await pool.request().input("userId", sql.NVarChar, userId)
      .query(`
        SELECT 
          s.submissionId AS submission_id,
          s.lot_no,
          s.submitted_by,
          u.agt_member_nameEN AS submitted_by_name,
          s.created_at, 
          s.status,
          'Recycle' AS category,
          'Rejected' AS pending_level
        FROM Form_Ironpowder_Submissions s
        LEFT JOIN AGT_SMART_SY.dbo.agt_member u ON s.submitted_by COLLATE Thai_CI_AS = u.agt_member_id
        WHERE s.submitted_by COLLATE Thai_CI_AS = @userId 
          AND s.status = 'Rejected'
        ORDER BY s.created_at DESC
      `);
    return result.recordset;
  } catch (error) {
    console.error("Error fetching rejected ironpowder tasks:", error);
    throw error;
  }
};

exports.getRecentCommentsForUser = async (pool, userId) => {
  try {
    const result = await pool.request().input("userId", sql.NVarChar, userId)
      .query(`
        SELECT TOP 10
          l.log_id,
          l.submissionId AS submission_id, -- Maps to standard format
          l.comment,
          l.action, 
          l.created_at AS action_date,
          s.lot_no,
          u.agt_member_nameEN AS commenter_name,
          l.User_approver_id,
          'Recycle' AS category -- ✅ Mark as Recycle
        FROM Form_Ironpowder_Approved_Log l
        JOIN Form_Ironpowder_Submissions s ON l.submissionId = s.submissionId
        LEFT JOIN AGT_SMART_SY.dbo.agt_member u 
          ON l.User_approver_id COLLATE Thai_CI_AS = u.agt_member_id COLLATE Thai_CI_AS 
        WHERE s.submitted_by COLLATE Thai_CI_AS = @userId 
          AND l.comment IS NOT NULL 
          AND l.comment != '' 
          AND l.User_approver_id COLLATE Thai_CI_AS != @userId 
        ORDER BY l.created_at DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error fetching ironpowder comments:", error);
    throw error;
  }
};
