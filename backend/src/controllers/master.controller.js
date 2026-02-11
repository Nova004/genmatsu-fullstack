// src/controllers/master.controller.js

const { pool, sql, poolConnect } = require("../db.js");
const activityLogRepository = require("../repositories/activityLog.repository");
const { getObjectDiff } = require("../utils/diffHelper");
const logger = require("../utils/logger"); // 🚀 Async Logger

// 🚀 Turbo: In-Memory Cache
const CACHE = {
  templates: new Map(), // Key: templateName -> Value: { template, items }
  allTemplates: null,   // Value: groupedTemplates
  standardPlans: null   // Value: Array of plans
};

// Helper to clear cache
const clearTemplateCache = () => {
  CACHE.templates.clear();
  CACHE.allTemplates = null;
  logger.info("[Cache] Template cache cleared.");
};

// --- เปลี่ยนชื่อฟังก์ชันเป็น getLatestTemplateByName ---
exports.getLatestTemplateByName = async (req, res) => {
  try {
    const { templateName } = req.params;
    const { active } = req.query; // 🚀 Check for active flag

    if (!templateName) {
      return res.status(400).json({ message: "กรุณาระบุชื่อ Template" });
    }

    // 🚀 Cache Key Strategy
    const cacheKey = active === 'true' ? `${templateName}_active` : templateName;

    // 🚀 Cache Hit? (Only use Cache if NOT checking for active time)
    // เหตุผล: ถ้า active=true ผลลัพธ์ขึ้นอยู่กับเวลา (Time-dependent) การ Cache อาจทำให้ได้เวอร์ชันเก่า
    if (active !== 'true' && CACHE.templates.has(cacheKey)) {
      logger.info(`[Cache] Hit: ${cacheKey}`);
      return res.status(200).json(CACHE.templates.get(cacheKey));
    }

    await poolConnect;

    let query;
    if (active === 'true') {
      // 📅 Active Mode: Get latest effective version (Always Live Query)
      query = `
        SELECT TOP 1 * 
        FROM Form_Master_Templates 
        WHERE template_name = @templateName 
          AND (effective_date IS NULL OR effective_date <= GETUTCDATE())
        ORDER BY version DESC
      `;
    } else {
      // 🛠️ Editor Mode: Get absolute latest (HEAD)
      query = "SELECT * FROM Form_Master_Templates WHERE template_name = @templateName AND is_latest = 1";
    }

    const templateResult = await pool
      .request()
      .input("templateName", sql.NVarChar, templateName)
      .query(query);

    if (templateResult.recordset.length === 0) {
      return res.status(404).json({ message: "ไม่พบ Template ที่ต้องการ" });
    }

    const templateData = templateResult.recordset[0];
    const templateId = templateData.template_id;

    // ... (Items fetching remains same)
    const itemsResult = await pool
      .request()
      .input("templateId", sql.Int, templateId)
      .query(
        "SELECT * FROM Form_Master_Items WHERE template_id = @templateId AND is_active = 1 ORDER BY display_order ASC"
      );

    const formattedItems = itemsResult.recordset.map((item) => {
      try {
        item.config_json = JSON.parse(item.config_json);
        return item;
      } catch (e) {
        logger.error(`Error parsing JSON for item_id: ${item.item_id}`, e);
        return { ...item, config_json: { error: "Invalid JSON format" } };
      }
    });

    const responseData = {
      template: templateData,
      items: formattedItems,
    };

    // 🚀 Save to Cache (Only for Editor Mode)
    if (active !== 'true') {
      CACHE.templates.set(cacheKey, responseData);
    }

    res.status(200).json(responseData);
  } catch (error) {
    logger.error("Error in getLatestTemplateByName:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};

exports.getAllLatestTemplates = async (req, res) => {
  try {
    // 🚀 Cache Hit?
    if (CACHE.allTemplates) {
      logger.info(`[Cache] Hit: All Templates`);
      return res.status(200).json(CACHE.allTemplates);
    }

    await poolConnect;
    // --- 👇 1. เพิ่ม form_type เข้ามาใน SELECT 👇 ---
    const result = await pool.request().query(`
      SELECT 
        template_id, 
        template_name, 
        description,
        template_category,
        form_type 
      FROM 
        Form_Master_Templates 
      WHERE 
        is_latest = 1 
      ORDER BY 
        template_category, form_type, template_name;
    `);

    // --- 👇 2. เปลี่ยน Logic การจัดกลุ่มให้เป็น 2 ชั้น 👇 ---
    const groupedTemplates = result.recordset.reduce((acc, template) => {
      const { template_category, form_type } = template;

      if (!template_category || !form_type) {
        return acc; // ข้ามรายการที่ข้อมูลไม่สมบูรณ์
      }

      // สร้าง category key ถ้ายังไม่มี (เช่น acc['GEN_B'] = {})
      if (!acc[template_category]) {
        acc[template_category] = {};
      }
      // สร้าง form_type key ภายใต้ category นั้นๆ ถ้ายังไม่มี (เช่น acc['GEN_B']['BZ'] = [])
      if (!acc[template_category][form_type]) {
        acc[template_category][form_type] = [];
      }

      // เพิ่ม template เข้าไปในกลุ่มที่ถูกต้อง
      acc[template_category][form_type].push(template);

      return acc;
    }, {});

    // 🚀 Save to Cache
    CACHE.allTemplates = groupedTemplates;

    res.status(200).json(groupedTemplates);
  } catch (error) {
    logger.error("Error fetching all latest templates:", error);
    res
      .status(500)
      .json({ message: "Error fetching templates", error: error.message });
  }
};

// =============================================================
// === ฟังก์ชันใหม่สำหรับบันทึก Template เป็นเวอร์ชันใหม่ ===
// =============================================================
exports.updateTemplateAsNewVersion = async (req, res) => {
  // --- 1. รับ userId เพิ่มเข้ามา ---
  const { templateName, items, userId } = req.body;

  // --- 2. เพิ่มการตรวจสอบ userId ---
  if (!templateName || !items || !Array.isArray(items) || !userId) {
    return res
      .status(400)
      .json({ message: "Invalid data provided. Missing userId." });
  }

  const transaction = new sql.Transaction(pool);
  try {
    await poolConnect;
    await transaction.begin();

    const currentTemplateResult = await new sql.Request(transaction)
      .input("templateName", sql.NVarChar, templateName)
      .query(
        "SELECT * FROM Form_Master_Templates WHERE template_name = @templateName AND is_latest = 1"
      );

    if (currentTemplateResult.recordset.length === 0) {
      throw new Error(`Template with name ${templateName} not found.`);
    }
    const currentTemplate = currentTemplateResult.recordset[0];

    // --- 🔍 Fetch OLD Items for Diff Log ---
    const currentItemsResult = await new sql.Request(transaction)
      .input("templateId", sql.Int, currentTemplate.template_id)
      .query("SELECT * FROM Form_Master_Items WHERE template_id = @templateId ORDER BY display_order ASC");

    // Parse JSON in old items to make comparison valid
    const currentItems = currentItemsResult.recordset.map(item => {
      try { return { ...item, config_json: JSON.parse(item.config_json) }; }
      catch (e) { return item; }
    });

    await new sql.Request(transaction)
      .input("templateId", sql.Int, currentTemplate.template_id)
      .query(
        "UPDATE Form_Master_Templates SET is_latest = 0 WHERE template_id = @templateId"
      );

    const newVersion = currentTemplate.version + 1;

    // --- 3. แก้ไขส่วน INSERT ทั้งหมด ---
    const newTemplateResult = await new sql.Request(transaction)
      .input("template_name", sql.NVarChar, currentTemplate.template_name)
      .input("template_type", sql.NVarChar, currentTemplate.template_type) // (โค้ดเดิมของคุณมีส่วนนี้อยู่แล้ว ถูกต้องครับ)
      .input("form_type", sql.NVarChar, currentTemplate.form_type) // เพิ่ม form_type เข้ามาด้วย
      .input(
        "description",
        sql.NVarChar,
        `${currentTemplate.description.split(" (v")[0]} (v${newVersion})`
      )
      .input("version", sql.Int, newVersion)
      .input("is_latest", sql.Bit, 1)

      .input("template_category", sql.NVarChar, currentTemplate.template_category)
      .input("createdBy", sql.NVarChar, userId)
      .input("change_reason", sql.NVarChar, req.body.changeReason || null)
      .input("effective_date", sql.DateTime, req.body.effectiveDate ? new Date(req.body.effectiveDate) : new Date()) // 📅 Effective Date
      .query(`
        INSERT INTO Form_Master_Templates (
          template_name, template_type, form_type, description, version, 
          is_latest, template_category, created_at, created_by, change_reason, effective_date
        )
        OUTPUT inserted.template_id
        VALUES (
          @template_name, @template_type, @form_type, @description, @version, 
          @is_latest, @template_category, GETDATE(), @createdBy, @change_reason, @effective_date
        );
      `);

    const newTemplateId = newTemplateResult.recordset[0].template_id;

    // (ส่วน for loop ไม่มีการเปลี่ยนแปลง)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const displayOrder = (i + 1) * 10;
      await new sql.Request(transaction)
        .input("template_id", sql.Int, newTemplateId)
        .input("display_order", sql.Int, displayOrder)
        .input("config_json", sql.NVarChar, JSON.stringify(item.config_json))
        .input("is_active", sql.Bit, item.is_active).query(`
            INSERT INTO Form_Master_Items (template_id, display_order, config_json, is_active)
            VALUES (@template_id, @display_order, @config_json, @is_active);
          `);
    }

    await transaction.commit();

    // --- 📝 LOGGING: Calculate Diff & Log ---
    try {
      const oldData = { items: currentItems };
      const newData = { items: items }; // items from req.body
      const differences = getObjectDiff(oldData, newData);

      if (differences.length > 0) {
        await activityLogRepository.createLog({
          userId: userId,
          actionType: "UPDATE_VERSION",
          targetModule: "MASTER_TEMPLATE",
          targetId: `${templateName} (v${newVersion})`,
          details: {
            message: `Updated template to version ${newVersion}`,
            changes: differences
          }
        });
      }
    } catch (logErr) {
      logger.error("Failed to log template update:", logErr);
    }

    // 🚀 Invalidate Cache
    clearTemplateCache();

    // 🚀 Notify Clients via Socket.io
    if (req.io) {
      req.io.emit("template_updated", {
        templateName: templateName,
        version: newVersion,
        effectiveDate: req.body.effectiveDate ? new Date(req.body.effectiveDate) : new Date(),
        message: "A new version of the template is available."
      });
    }

    res.status(201).json({
      message: "Template updated successfully as new version.",
      newTemplateId: newTemplateId,
    });
  } catch (error) {
    if (transaction._aborted === false) {
      // Only rollback if not already aborted
      // (mssql sometimes aborts automatically on error)
      try { await transaction.rollback(); } catch (e) { }
    }
    console.error("Error updating template:", error);
    res
      .status(500)
      .json({ message: "Failed to update template.", error: error.message });
  }
};
// (ในอนาคตเราจะสร้างฟังก์ชัน getTemplateById สำหรับดูฟอร์มเก่าที่นี่)

// --- ส่วนของ Standard Plan (ST. Plan) ---

exports.getStandardPlans = async (req, res) => {
  try {
    // 🚀 Cache Hit?
    if (CACHE.standardPlans) {
      console.log(`[Cache] Hit: Standard Plans`);
      return res.json(CACHE.standardPlans);
    }

    const pool = await poolConnect;
    // ดึงข้อมูลทั้งหมด และ Join เพื่อชื่อสินค้า
    const result = await pool
      .request()
      .query(`
        SELECT 
          mt.*, 
          COALESCE(p.Gen_Name, mt.form_type) AS product_name -- ✅ Fetch Name
        FROM Gen_StandardPlan_MT mt
        LEFT JOIN gen_product p ON mt.form_type = p.Gen_Id COLLATE Thai_CI_AS
        ORDER BY p.Gen_Name ASC
      `);

    // 🚀 Save to Cache
    CACHE.standardPlans = result.recordset;

    res.json(result.recordset);
  } catch (err) {
    logger.error("Error fetching ST Plans:", err);
    res.status(500).json({ message: "Error fetching ST Plans" });
  }
};

exports.saveStandardPlan = async (req, res) => {
  try {
    const { form_type, target_value, updated_by } = req.body;
    const pool = await poolConnect;

    // --- 🔍 Fetch OLD Value for Diff Log ---
    const currentPlanResult = await pool.request()
      .input("form_type", sql.NVarChar, form_type)
      .query("SELECT target_value FROM Gen_StandardPlan_MT WHERE form_type = @form_type");

    const oldTargetValue = currentPlanResult.recordset.length > 0 ? currentPlanResult.recordset[0].target_value : null;

    // ใช้ MERGE (Upsert) คือถ้ามีอยู่แล้วให้ Update ถ้าไม่มีให้ Insert
    const query = `
      MERGE Gen_StandardPlan_MT AS target
      USING (SELECT @form_type AS form_type) AS source
      ON (target.form_type = source.form_type)
      WHEN MATCHED THEN
        UPDATE SET target_value = @target_value, updated_at = GETDATE(), updated_by = @updated_by
      WHEN NOT MATCHED THEN
        INSERT (form_type, target_value, updated_at, updated_by)
        VALUES (@form_type, @target_value, GETDATE(), @updated_by);
    `;

    await pool
      .request()
      .input("form_type", sql.NVarChar, form_type)
      .input("target_value", sql.Decimal(10, 2), target_value)
      .input("updated_by", sql.NVarChar, updated_by || "Admin") // ถ้าไม่มีส่งมา ให้เป็น Admin
      .query(query);

    // --- 📝 LOGGING: Calculate Diff & Log ---
    try {
      // Compare values
      if (Number(oldTargetValue) !== Number(target_value)) {
        await activityLogRepository.createLog({
          userId: updated_by || "Admin",
          actionType: "UPDATE_STD_PLAN",
          targetModule: "MASTER_STD_PLAN",
          targetId: form_type,
          details: {
            message: `Updated Standard Plan for ${form_type}`,
            changes: [`target_value: ${oldTargetValue || '(empty)'} -> ${target_value}`]
          }
        });
      }
    } catch (logErr) {
      logger.error("Failed to log standard plan update:", logErr);
    }

    // 🚀 Invalidate Cache
    CACHE.standardPlans = null;

    res.json({ message: "Standard Plan saved successfully" });
  } catch (err) {
    logger.error("Error saving ST Plan:", err);
    res.status(500).json({ message: "Error saving ST Plan" });
  }
};

exports.deleteStandardPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolConnect;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Gen_StandardPlan_MT WHERE id = @id");

    // 🚀 Invalidate Cache
    CACHE.standardPlans = null;

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Error deleting" });
  }
};
