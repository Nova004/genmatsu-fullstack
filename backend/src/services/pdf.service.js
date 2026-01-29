// local src/services/pdf.service.js

const puppeteer = require("puppeteer");
const submissionService = require("./submission.service"); // We will create this next
const config = require("../config/env");
const logger = require("../utils/logger"); // 🚀 Async Logger
// 🚀 Turbo: Warm Browser Singleton
let browserInstance = null;

const getBrowser = async () => {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  logger.info("[PDF Gen] Launching new 'WARM' browser instance...");

  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
  ];

  const fs = require("fs"); // ✅ Re-import fs

  // ...



  let executablePath = null;
  for (const path of chromePaths) {
    if (fs.existsSync(path)) {
      executablePath = path;
      break;
    }
  }

  browserInstance = await puppeteer.launch({
    headless: true, // or "new"
    args: [
      "--lang=en-GB",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
    executablePath: executablePath || undefined,
    ignoreHTTPSErrors: true,
    dumpio: false,
  });

  browserInstance.on('disconnected', () => {
    logger.warn("[PDF Gen] Browser disconnected! Resetting instance.");
    browserInstance = null;
  });

  return browserInstance;
};

exports.generatePdf = async (submissionId, frontendPrintUrl) => {
  let page;

  try {
    // 1. Fetch data
    logger.info(`[PDF Gen] 1. Fetching data for ID: ${submissionId}`);
    const dataToInject = await submissionService.getSubmissionDataForPdf(submissionId);

    const reportName = dataToInject.submission.form_type || "ใบรายงานการผลิต";
    const dynamicHeaderTemplate = `
      <div style="width: 100%; border-bottom: 1px solid #ccc; padding: 5px 20px;
                  font-size: 12px; color: #000; font-weight: bold;
                  display: flex; justify-content: center; align-items: center;">
        <span>ใบรายงานการผลิต: ${reportName} (Manufacturing ${reportName})</span>
      </div>
    `;

    // 2. Reuse Browser
    const browser = await getBrowser(); // � Use Warm Browser
    page = await browser.newPage();

    page = await browser.newPage();

    page.on("console", (msg) => {
      logger.info(`[PUPPETEER-CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      logger.error("[PUPPETEER-PAGE-ERROR] React Crash:", err);
    });

    // 3. Request Interception
    logger.info(`[PDF Gen] 3. Setting up request interception...`);
    await page.setRequestInterception(true);

    const expectedApiUrl = `/genmatsu/api/submissions/${submissionId}`;

    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith("data:")) {
        logger.info(`[PUPPETEER-REQUEST] Trying to load: ${url}`);
      }

      if (url.includes(expectedApiUrl)) {
        logger.info(`[PDF Gen] 3.1. Intercepting API call: ${url}`);
        request.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(dataToInject),
        });
      } else {
        request.continue();
      }
    });

    // 4. Navigate
    logger.info(`[PDF Gen] 4. Navigating to: ${frontendPrintUrl}`);
    await page.goto(frontendPrintUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 5. Wait for selector
    logger.info("[PDF Gen] 5. Waiting for selector (#pdf-content-ready)...");
    await page.waitForSelector(
      "#pdf-content-ready, #pdf-status-error, #pdf-status-notfound",
      { timeout: 30000 }
    );

    // 6. Generate PDF
    logger.info("[PDF Gen] 6. Page is ready. Generating PDF buffer...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: dynamicHeaderTemplate,
      footerTemplate: `
        <div style="width: 100%; padding: 5px 20px 0;
                    font-size: 10px; color: #555;
                    display: flex; justify-content: space-between; align-items: center;">
          <span style="flex: 1; text-align: left;">FM-AS2-001</span>
          <span style="flex: 1; text-align: center;">
            Page <span class="pageNumber"></span> / <span class="totalPages"></span>
          </span>
          <span style="flex: 1; text-align: right;"></span>
        </div>
      `,
      margin: {
        top: "50px",
        right: "10px",
        bottom: "20px",
        left: "10px",
      },
      scale: 0.37,
    });

    // Do not close browser!
    logger.info("[PDF Gen] 7. Page closed. Keeping browser warm.");
    return pdfBuffer;
  } catch (error) {
    logger.error(`[PDF Gen] Error generating PDF for ID ${submissionId}:`, error);
    throw error;
  } finally {
    if (page) await page.close(); // 🚀 Only close the page
  }
};

exports.generateDailyReportPdf = async (date, lotNoPrefix) => {
  let page;
  try {
    logger.info(`[PDF Gen] Starting Daily Report PDF. Date: ${date}, Lot: ${lotNoPrefix}`);

    const baseUrl = config.frontendUrl || "http://localhost:5173";
    let frontendPrintUrl = `${baseUrl}/genmatsu/reports/daily/print?date=${date}`;

    if (lotNoPrefix) {
      frontendPrintUrl += `&lotNo=${lotNoPrefix}`;
    }

    logger.info(`[PDF Gen] Target URL: ${frontendPrintUrl}`);

    // 🚀 Reuse Warm Browser
    const browser = await getBrowser();
    page = await browser.newPage();

    // 3. Navigate
    await page.goto(frontendPrintUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 4. Wait for content
    try {
      await page.waitForSelector("#pdf-content-ready", { timeout: 30000 });
    } catch (e) {
      logger.warn("[PDF Gen] Warning: Selector #pdf-content-ready not found, creating PDF anyway.");
    }

    // 5. Create PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
      scale: 0.7,
    });

    return pdfBuffer;
  } catch (error) {
    logger.error("[PDF Gen] Error:", error);
    throw error;
  } finally {
    if (page) await page.close(); // 🚀 Only close page
  }
};
