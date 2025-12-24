const puppeteer = require("puppeteer");
const submissionService = require("./submission.service"); // We will create this next

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

// ✅ เพิ่มฟังก์ชันนี้ต่อท้ายไฟล์ครับ
exports.generateDailyReportPdf = async (
  dailyReportData,
  date,
  frontendPrintUrl
) => {
  let browser;
  let page;

  try {
    console.log(`[PDF Gen] Starting Daily Report PDF for date: ${date}`);

    // 1. Launch Browser (ใช้ config เดียวกับของเดิม)
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
      headless: true,
      args: [
        "--lang=en-GB",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      executablePath: executablePath || undefined,
    });

    page = await browser.newPage();

    // 2. Intercept Request: ดักจับการเรียก API จากหน้า Frontend
    // เพื่อยัดข้อมูลที่เรามีอยู่แล้วลงไป (จะได้ไม่ต้อง query ซ้ำและเร็วกว่า)
    await page.setRequestInterception(true);

    // URL ที่ Frontend (DailyReportPrint.tsx) จะเรียก
    // ต้องตรงกับใน axios.get ของไฟล์ frontend เป๊ะๆ
    const targetApiUrl = `/genmatsu/api/submissions/reports/daily`;

    page.on("request", (request) => {
      const url = request.url();
      // ถ้า URL มีคำว่า /reports/daily และมีวันที่ตรงกัน (หรือเช็คแค่ path ก็พอ)
      if (url.includes(targetApiUrl)) {
        console.log(`[PDF Gen] Intercepting data for: ${url}`);
        request.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(dailyReportData), // <--- ยัดข้อมูลที่เราเตรียมไว้ให้เลย
        });
      } else {
        request.continue();
      }
    });

    // 3. Navigate ไปยังหน้า Frontend
    console.log(`[PDF Gen] Navigating to: ${frontendPrintUrl}`);
    await page.goto(frontendPrintUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 4. รอจนกว่า React จะ render เสร็จ (เช็คจาก id="pdf-content-ready" ที่เราทำไว้)
    await page.waitForSelector("#pdf-content-ready", { timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      displayHeaderFooter: false,
      // ✅ แก้ไข: ปรับ Margin ให้ชิดขอบสุดๆ (แนะนำ 5px - 10px)
      margin: {
        top: "0px", // เดิม 50px -> ลดเหลือ 10px
        right: "0px", // เดิม 10px -> ลดเหลือ 5px
        bottom: "0px", // เดิม 20px -> ลดเหลือ 10px
        left: "0px", // เดิม 10px -> ลดเหลือ 5px
      },
      // ✅ ปรับ Scale: ถ้าชิดขอบแล้วเนื้อหาดูเล็กไป ลองขยับเป็น 0.75 หรือ 0.8 ดูได้ครับ
      scale: 0.70,
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    if (browser) await browser.close();
    console.error("[PDF Gen] Error:", error);
    throw error;
  }
};
