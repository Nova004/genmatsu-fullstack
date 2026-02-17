// scripts/manual_trigger_email.js

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
            console.log(`   - 👥 [TARGET RECIPIENTS]:`);
            const emails = await submissionRepo.getApproverEmailsByLevel(pool, level);

            if (emails.length > 0) {
                emails.forEach(email => console.log(`      • ${email}`));
            } else {
                console.log(`      • (No active users found for Level ${level})`);
            }

            if (totalPending > 0) {
                console.log(`   ----------------------------------------------------------------`);
                console.log(`   📢 [DRY RUN] Found ${totalPending} pending tasks.`);
                console.log(`   🚫 Email sending is DISABLED in this script.`);
                console.log(`   ✅ If enabled, notification WOULD be sent to the list above.`);
                console.log(`   ----------------------------------------------------------------`);

                // 🛑 SAFETY: Commented out actual sending
                // await emailService.sendBacklogNotification(emails, level, totalPending);

            } else {
                console.log(`   ⚠️ No pending tasks, no action needed.`);
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
