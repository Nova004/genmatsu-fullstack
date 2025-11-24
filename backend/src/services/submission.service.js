const sql = require("mssql");
const dbConfig = require("../config/db.config");
const submissionRepo = require("../repositories/submission.repository");

// Helper function to create approval flow
async function createApprovalFlow(pool, submissionId, submittedBy) {
  let transaction;
  try {
    console.log(
      `[Approval] Creating flow for SubID: ${submissionId}, By: ${submittedBy}`
    );

    const userLevel = await submissionRepo.getUserApprovalLevel(pool, submittedBy);

    if (userLevel === null) {
      console.error(`[Approval] User not found: ${submittedBy}`);
      return;
    }

    console.log(`[Approval] User Level is: ${userLevel}`);

    const flowSteps = [];
    if (userLevel === 0) {
      flowSteps.push({ sequence: 1, required_level: 1 });
      flowSteps.push({ sequence: 2, required_level: 2 });
      flowSteps.push({ sequence: 3, required_level: 3 });
    } else if (userLevel === 1) {
      flowSteps.push({ sequence: 1, required_level: 2 });
      flowSteps.push({ sequence: 2, required_level: 3 });
    } else if (userLevel === 2) {
      flowSteps.push({ sequence: 1, required_level: 3 });
    }

    if (flowSteps.length > 0) {
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      await submissionRepo.createApprovalFlowSteps(transaction, submissionId, flowSteps);
      
      await transaction.commit();
      console.log(
        `[Approval] Successfully created ${flowSteps.length} approval steps.`
      );
    } else {
      console.log(
        `[Approval] No approval required for this user level (${userLevel}).`
      );
    }
  } catch (error) {
    console.error("Error creating approval flow:", error.message);
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
  }
}

exports.getSubmissionDataForPdf = async (submissionId) => {
  const pool = await sql.connect(dbConfig);
  
  try {
    console.log(`[PDF-Helper] Fetching submission data for ID: ${submissionId}`);
    const submissionData = await submissionRepo.getSubmissionWithDetails(pool, submissionId);

    if (!submissionData) {
      console.error(`[PDF-Helper] Submission not found: ${submissionId}`);
      throw new Error("Submission not found.");
    }

    const versionSetId = submissionData.version_set_id;

    console.log(
      `[PDF-Helper] Fetching blueprints for VersionSetID: ${versionSetId}`
    );
    const blueprintItems = await submissionRepo.getVersionSetItems(pool, versionSetId);

    const blueprints = {};
    blueprintItems.forEach((item) => {
      const templateName = item.template_name;
      if (!blueprints[templateName]) {
        blueprints[templateName] = {
          template: {
            template_id: item.template_id,
            template_name: item.template_name,
            template_category: item.template_category,
            version: item.version,
          },
          items: [],
        };
      }
      blueprints[templateName].items.push({
        item_id: item.item_id,
        display_order: item.display_order,
        config_json: JSON.parse(item.config_json),
      });
    });

    console.log(`[PDF-Helper] Data prepared successfully.`);
    return {
      submission: {
        ...submissionData,
        form_data_json: JSON.parse(submissionData.form_data_json),
      },
      blueprints: blueprints,
    };
  } finally {
    pool.close();
  }
};

exports.createSubmission = async (data) => {
  const { formType, lotNo, templateIds, formData, submittedBy } = data;
  
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Find Category
    const correctCategory = await submissionRepo.getTemplateCategory(transaction, templateIds[0]);

    if (!correctCategory) {
      throw new Error(`Cannot find category for template ID: ${templateIds[0]}`);
    }

    // 2. Check Version Set
    let versionSetId = await submissionRepo.findExistingVersionSet(transaction, correctCategory, templateIds);

    if (!versionSetId) {
      await submissionRepo.deprecateOldVersionSet(transaction, correctCategory);
      versionSetId = await submissionRepo.createNewVersionSet(transaction, correctCategory);
      await submissionRepo.addItemsToVersionSet(transaction, versionSetId, templateIds);
    }

    // 3. Insert Submission
    const submissionId = await submissionRepo.createSubmissionRecord(transaction, {
      versionSetId,
      formType,
      lotNo,
      submittedBy
    });

    // 4. Insert Form Data
    await submissionRepo.createSubmissionData(transaction, submissionId, formData);

    await transaction.commit();
    
    // Create Approval Flow (Separate transaction/logic)
    await createApprovalFlow(pool, submissionId, submittedBy);

    return submissionId;

  } catch (error) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    throw error;
  } finally {
    if (pool) pool.close();
  }
};

exports.getAllSubmissions = async (category) => {
  const pool = await sql.connect(dbConfig);
  try {
    return await submissionRepo.getAllSubmissions(pool, category);
  } finally {
    pool.close();
  }
};

exports.getSubmissionById = async (id) => {
    return await this.getSubmissionDataForPdf(id);
};

exports.deleteSubmission = async (id) => {
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    
    const isDeleted = await submissionRepo.deleteSubmissionRelatedData(transaction, id);

    if (!isDeleted) {
      await transaction.commit();
      return false; // Not found
    }

    await transaction.commit();
    return true; // Deleted
  } catch (err) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    throw err;
  } finally {
    if (pool) pool.close();
  }
};

exports.updateSubmission = async (id, lot_no, form_data) => {
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await submissionRepo.updateSubmissionRecord(transaction, id, lot_no);
    await submissionRepo.updateSubmissionData(transaction, id, form_data);

    await transaction.commit();
  } catch (err) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    throw err;
  } finally {
    if (pool) pool.close();
  }
};

exports.resubmitSubmission = async (id, formDataJson) => {
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    
    await submissionRepo.resubmitSubmissionData(transaction, id, formDataJson);

    await transaction.commit();
  } catch (error) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    throw error;
  } finally {
    if (pool) pool.close();
  }
};
