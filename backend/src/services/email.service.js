const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

// 📧 Configure Transporter for Outlook / Office 365
// Ensure you have these values in .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.office365.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports (587 uses STARTTLS)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        // ciphers: "SSLv3", // 🔴 Removing this as Office 365 often prefers stronger ciphers (TLS 1.2+)
        rejectUnauthorized: false,
    },
});

/**
 * Sends a notification email to a list of approvers
 * @param {string[]} recipients - Array of email addresses
 * @param {string} level - Approver Level
 * @param {number} pendingCount - Number of pending tasks
 */
exports.sendBacklogNotification = async (recipients, level, pendingCount) => {
    if (!recipients || recipients.length === 0) {
        logger.warn(`[Email] No recipients for Level ${level} notification.`);
        return;
    }

    const mailOptions = {
        from: `"AGT System" <${process.env.SMTP_USER}>`,
        to: recipients.join(", "), // Send to all (can use bcc if preferred)
        subject: `🚨 [Urgent] ${pendingCount} Pending Requests Waiting for Level ${level} Approval`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
        <h2 style="color: #d9534f;">⚠️ Approval Backlog Alert</h2>
        <p>Dear Approver (Level ${level}),</p>
        <p>There are currently <strong>${pendingCount}</strong> pending requests waiting for your approval.</p>
        <p>Please log in to Genmatsu System to process them.</p>
        <br>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
           style="background-color: #0275d8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           Go to Dashboard
        </a>
        <br><br>
        <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply.</p>
      </div>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`[Email] Notification sent to Level ${level}: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`[Email] Failed to send email to Level ${level}:`, error);
        // Don't throw, just log. We don't want to crash the Cron job.
    }
};
