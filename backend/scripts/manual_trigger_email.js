const { sql, poolConnect } = require("../src/db");
const submissionRepo = require("../src/repositories/submission.repository");
const ironpowderRepo = require("../src/repositories/ironpowder.repository");
const emailService = require("../src/services/email.service");
require("dotenv").config();

const logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
};

const LEVELS = [1, 2, 3];

const runTest = async () => {
    console.log("🚀 Starting Manual Email Trigger Test...");
    console.log("----------------------------------------");

    try {
        const pool = await poolConnect;
        console.log("✅ Database Connected");

        for (const level of LEVELS) {
            console.log(`\n🔍 Checking Level ${level}...`);

            // 1. Count Pending Tasks (Standard)
            const stdCount = await submissionRepo.countPendingTasksByLevel(pool, level);

            // 2. Count Pending Tasks (Recycle)
            const recCount = await ironpowderRepo.countPendingIronpowderByLevel(pool, level);

            const totalPending = stdCount + recCount;
            console.log(`   - Standard Pending: ${stdCount}`);
            console.log(`   - Recycle Pending:  ${recCount}`);
            console.log(`   - Total Pending:    ${totalPending}`);

            // 4. Get Approvers Emails
            console.log(`   - 👥 [CHECKING REAL RECIPIENTS]:`);
            const realApprovers = await submissionRepo.getApproverEmailsByLevel(pool, level);
            if (realApprovers.length > 0) {
                realApprovers.forEach(email => console.log(`      • ${email}`));
            } else {
                console.log(`      • (No active users found for Level ${level})`);
            }

            // [TEST MODE] Override (ยังคงส่งหาคุณคนเดียวเหมือนเดิม เพื่อความปลอดภัย)
            const emails = ['aukkharapon@ageless.co.th'];
            console.log(`   - 🛡️ [TEST MODE ACTIVE]: Email will be sent ONLY to: ${emails[0]}`);

            if (totalPending > 0) { // Force trigger if > 0 (Ignore Threshold 5 for test)
                console.log(`   📧 Sending Email...`);
                try {
                    const result = await emailService.sendBacklogNotification(emails, level, totalPending);

                    if (result) {
                        console.log(`   ✅ Email Sent Successfully! MessageID: ${result.messageId}`);
                    } else {
                        console.log(`   ❌ Email FAILED. The service returned undefined.`);
                        console.log(`   🔎 Check the [ERROR] logs above for details.`);
                        console.log(`   💡 Check .env credentials, Port 587, or Firewall.`);
                    }
                } catch (error) {
                    console.error(`   ❌ Failed to send email:`, error.message);
                }
            } else {
                console.log(`   ⚠️ No pending tasks, skipping email.`);
            }
        }

    } catch (error) {
        console.error("❌ Critical Error:", error);
    } finally {
        console.log("\n----------------------------------------");
        console.log("🏁 Test Completed. Press Ctrl+C to exit.");
        process.exit(0);
    }
};

runTest();
