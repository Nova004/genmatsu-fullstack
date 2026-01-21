// local src/services/pdf.service.js

const puppeteer = require("puppeteer");
const submissionService = require("./submission.service"); // We will create this next
const config = require("../config/env");

exports.generatePdf = async (submissionId, frontendPrintUrl) => {
  let browser;
  let page;

  try {
    // 1. Fetch data
    console.log(
      `[PDF Gen] 1. Fetching data for ID: ${submissionId} BEFORE launching browser.`
    );
    const dataToInject = await submissionService.getSubmissionDataForPdf(
      submissionId
    );
    console.log(`[PDF Gen] 1. Data fetched successfully.`);

    const reportName = dataToInject.submission.form_type || "Production Report";
    const dynamicHeaderTemplate = `
      <div style="width: 100%; border-bottom: 1px solid #ccc; padding: 5px 20px;
                  font-size: 12px; color: #000; font-weight: bold;
                  display: flex; justify-content: center; align-items: center;">
        <span>ใบรายงานการผลิต: ${reportName} (Manufacturing ${reportName})</span>
      </div>
    `;

    // 2. Launch Browser
    console.log(`[PDF Gen] 2. Launching browser...`);

    // Try to use system Chrome first (more stable on Windows)
    const chromePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    ];

    let executablePath = null;
    const fs = require("fs");
    for (const path of chromePaths) {
      if (fs.existsSync(path)) {
        executablePath = path;
        console.log(`[PDF Gen] Found Chrome at: ${path}`);
        break;
      }
    }

    const launchOptions = {
      headless: true,
      args: [
        "--lang=en-GB", // 👈 เพิ่มบรรทัดนี้เข้าไปครับ (สำคัญ!)
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
      ignoreHTTPSErrors: true,
      dumpio: false,
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    browser = await puppeteer.launch(launchOptions);

    page = await browser.newPage();

    page.on("console", (msg) => {
      console.log(`[PUPPETEER-CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      console.error("[PUPPETEER-PAGE-ERROR] React Crash:", err);
    });

    // 3. Request Interception
    console.log(`[PDF Gen] 3. Setting up request interception...`);
    await page.setRequestInterception(true);

    const expectedApiUrl = `/genmatsu/api/submissions/${submissionId}`;

    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith("data:")) {
        console.log(`[PUPPETEER-REQUEST] Trying to load: ${url}`);
      }

      if (url.includes(expectedApiUrl)) {
        console.log(`[PDF Gen] 3.1. Intercepting API call: ${url}`);
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
    console.log(`[PDF Gen] 4. Navigating to: ${frontendPrintUrl}`);
    await page.goto(frontendPrintUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 5. Wait for selector
    console.log("[PDF Gen] 5. Waiting for selector (#pdf-content-ready)...");
    await page.waitForSelector(
      "#pdf-content-ready, #pdf-status-error, #pdf-status-notfound",
      { timeout: 30000 }
    );

    // 6. Generate PDF
    console.log("[PDF Gen] 6. Page is ready. Generating PDF buffer...");
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

    await browser.close();
    console.log("[PDF Gen] 7. Browser closed. Sending PDF.");
    return pdfBuffer;
  } catch (error) {
    console.error(
      `[PDF Gen] Error generating PDF for ID ${submissionId}:`,
      error
    );
    console.error(`[PDF Gen] Error name: ${error.name}`);
    console.error(`[PDF Gen] Error message: ${error.message}`);
    console.error(`[PDF Gen] Error stack:`, error.stack);

    if (error.name === "TimeoutError" && page) {
      console.error(
        "[PUPPETEER-TIMEOUT] Timeout occurred while generating PDF"
      );
      try {
        const html = await page.content();
        console.error(
          "[PUPPETEER-TIMEOUT-HTML] Page HTML on timeout:",
          html.substring(0, 500)
        );
      } catch (e) {
        console.error(
          "[PUPPETEER-TIMEOUT-HTML] Could not get page content:",
          e.message
        );
      }
    }

    if (browser) {
      await browser.close();
    }
    throw error;
  }
};

exports.generateDailyReportPdf = async (date, lotNoPrefix) => {
  let browser;
  try {
    console.log(
      `[PDF Gen] Starting Daily Report PDF. Date: ${date}, Lot: ${lotNoPrefix}`
    );

    // 1. สร้าง URL พร้อมใส่ lotNo ไปด้วย
    // (ดึง Base URL จาก config หรือถ้าไม่ได้ตั้งค่าไว้ให้ใช้ localhost)
    const baseUrl = config.frontendUrl || "http://localhost:5173";
    let frontendPrintUrl = `${baseUrl}/genmatsu/reports/daily/print?date=${date}`;

    // ✅ หัวใจสำคัญ: ถ้ามี Lot No ให้ต่อท้าย URL ไปด้วย
    if (lotNoPrefix) {
      frontendPrintUrl += `&lotNo=${lotNoPrefix}`;
    }

    console.log(`[PDF Gen] Target URL: ${frontendPrintUrl}`);

    // 2. Launch Browser
    const chromePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    ];

    let executablePath = null;
    const fs = require("fs");
    for (const path of chromePaths) {
      if (fs.existsSync(path)) {
        executablePath = path;
        break;
      }
    }

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--lang=en-GB",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      executablePath: executablePath || undefined,
    });

    const page = await browser.newPage();

    // 3. Navigate ไปยัง URL ที่เราสร้าง (ที่มี Lot No แล้ว)
    await page.goto(frontendPrintUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 4. รอให้หน้าเว็บโหลดเสร็จ (ดูจาก id="pdf-content-ready")
    try {
      await page.waitForSelector("#pdf-content-ready", { timeout: 30000 });
    } catch (e) {
      console.warn(
        "[PDF Gen] Warning: Selector #pdf-content-ready not found, creating PDF anyway."
      );
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
      scale: 0.7, // ปรับขนาดตามความเหมาะสม
    });

    return pdfBuffer;
  } catch (error) {
    console.error("[PDF Gen] Error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};
