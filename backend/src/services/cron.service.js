const cron = require("node-cron");
const logger = require("../utils/logger");
const { poolConnect } = require("../db");
const submissionRepo = require("../repositories/submission.repository");
const ironpowderRepo = require("../repositories/ironpowder.repository");
const emailService = require("./email.service");

// Config
const THRESHOLD = 5; // มากกว่า 5 งาน ส่งเมล
const LEVELS = [1, 2, 3]; // Level ที่ต้องการตรวจสอบ

exports.init = () => {
    // ⏰ Schedule: ทุกๆ 1 ชั่วโมง (User can adjust later)
    // Format: "0 * * * *" means "Every hour at minute 0"
    cron.schedule("0 * * * *", async () => {
        logger.info("[Cron] Starting Approval Backlog Check...");

        try {
            const pool = await poolConnect;

            for (const level of LEVELS) {
                try {
                    // 1. Count Pending Tasks (Standard)
                    const stdCount = await submissionRepo.countPendingTasksByLevel(pool, level);

                    // 2. Count Pending Tasks (Recycle)
                    const recCount = await ironpowderRepo.countPendingIronpowderByLevel(pool, level);

                    const totalPending = stdCount + recCount;

                    logger.info(`[Cron] Level ${level}: Standard=${stdCount}, Recycle=${recCount}, Total=${totalPending}`);

                    // 3. Check Threshold
                    if (totalPending > THRESHOLD) {
                        // 4. Get Approvers Emails
                        // const emails = await submissionRepo.getApproverEmailsByLevel(pool, level);

                        // 🟡 TEST MODE: Send ONLY to Tester
                        const emails = ['aukkharapon_@ageless.co.th'];
                        logger.info(`[Cron] [TEST MODE] Sending notification to ${emails[0]} (Original Recipient Logic bypassed)`);

                        if (emails.length > 0) {
                            // 5. Send Email
                            await emailService.sendBacklogNotification(emails, level, totalPending);
                        } else {
                            logger.warn(`[Cron] Level ${level} has backlog but NO emails found.`);
                        }
                    }
                } catch (lvlErr) {
                    logger.error(`[Cron] Error processing Level ${level}:`, lvlErr);
                }
            }
        } catch (error) {
            logger.error("[Cron] Critical Error in Backlog Check Job:", error);
        }
    });

    logger.info("[Cron] Approval Backlog Scheduler Initialized ('0 * * * *')");
};
