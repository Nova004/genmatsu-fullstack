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
      "--font-render-hinting=none", // 👈 Fix font rendering inconsistency
      "--force-device-scale-factor=1", // 👈 Ensure consistent scale
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

// 🚀 Turbo: Warm Browser Singleton
const { PDFDocument } = require('pdf-lib'); // 📦 Install pdf-lib

// ... (getBrowser function remains the same) ...

exports.generatePdf = async (submissionId, frontendPrintUrl) => {


  try {
    // 1. Fetch data
    logger.info(`[PDF Gen] 1. Fetching data for ID: ${submissionId}`);
    const dataToInject = await submissionService.getSubmissionDataForPdf(submissionId);

    const reportName = dataToInject.submission.product_name || dataToInject.submission.form_type || "ใบรายงานการผลิต";
    const reportCategory = (dataToInject.submission.category || "Recycle").replace(/_/g, '-');
    const dynamicHeaderTemplate = `
      <div style="width: 100%; border-bottom: 1px solid #ccc; padding: 5px 20px;
                  font-size: 12px; color: #000; font-weight: bold;
                  display: flex; justify-content: center; align-items: center;">
        <span>ใบรายงานการผลิต ${reportCategory} : ${reportName} (Manufacturing ${reportName})</span>
      </div>
    `;

    const dynamicHeaderTemplateBarcode = `
      <div style="width: 100%; border-bottom: 1px solid #ccc; padding: 5px 20px;
                  font-size: 12px; color: #000; font-weight: bold;
                  display: flex; justify-content: center; align-items: center;">
        <span>Raw material Tag of ${reportCategory} : ${reportName} (Manufacturing ${reportName})</span>
      </div>
    `;

    // 🕵️‍♂️ Check if we need a Barcode Page (Lot 3-part check)
    const lotNo = dataToInject.submission.lot_no || "";
    const needsBarcodePage = /^(\d{4})([A-Z])(\d)$/.test(lotNo);

    // Helper to generate a single PDF part
    const generatePart = async (urlSuffix, options, waitTimeout = 30000) => {
      logger.info(`[PDF Gen] Generating Part: ${urlSuffix}...`);

      // Append URL Param
      const separator = frontendPrintUrl.includes('?') ? '&' : '?';
      const targetUrl = `${frontendPrintUrl}${separator}printPart=${urlSuffix}`;

      const browser = await getBrowser();
      const partPage = await browser.newPage();

      try {
        // Setup Interception (Same as before)
        await partPage.setRequestInterception(true);
        const expectedApiUrl = `/genmatsu/api/submissions/${submissionId}`;

        partPage.on("request", (request) => {
          const url = request.url();
          if (url.includes(expectedApiUrl)) {
            request.respond({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(dataToInject),
            });
          } else {
            request.continue();
          }
        });

        await partPage.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });

        // 🟢 Wait for specific selector based on part
        const waitSelector = (urlSuffix === 'barcode')
          ? "#barcode-content-ready"
          : "#pdf-content-ready";

        logger.info(`[PDF Gen] 5. Waiting for selector (${waitSelector})...`);
        await partPage.waitForSelector(waitSelector, { timeout: waitTimeout });

        // 🟢 Add Safety Delay to ensure Layout/Fonts settle
        await new Promise(r => setTimeout(r, 1500));

        // 🟢 Wait for Fonts to be ready (Critical for Server-side rendering)
        await partPage.evaluate(() => document.fonts.ready);

        return await partPage.pdf(options);
      } finally {
        await partPage.close();
      }
    };

    // --- Part 1: Main Report (With Header/Footer) ---
    const mainPdfBuffer = await generatePart('main', {
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
      margin: { top: "50px", right: "10px", bottom: "20px", left: "10px" },
      scale: 0.37,
    });

    if (!needsBarcodePage) {
      return mainPdfBuffer;
    }

    // --- Part 2: Barcode Page (With Header/Footer as requested) ---
    try {
      const barcodePdfBuffer = await generatePart('barcode', {
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true, // ✅ Custom Header/Footer enabled
        headerTemplate: dynamicHeaderTemplateBarcode, // Reuse style
        footerTemplate: `
          <div style="width: 100%; padding: 5px 20px 0;
                      font-size: 10px; color: #555;
                      display: flex; justify-content: space-between; align-items: center;">
            <span style="flex: 1; text-align: left;">FM-AS2-001 (Barcode)</span>
            <span style="flex: 1; text-align: center;">
              Page <span class="pageNumber"></span> / <span class="totalPages"></span>
            </span>
            <span style="flex: 1; text-align: right;"></span>
          </div>
        `,
        margin: { top: "50px", right: "10px", bottom: "20px", left: "10px" }, // Match Main margins
        scale: 0.37,
      }, 3000); // ⏱ Fast fail (3s)

      // --- Merge PDFs ---
      logger.info("[PDF Gen] Merging Main Report + Barcode Page...");
      const mergedPdf = await PDFDocument.create();

      const pdf1 = await PDFDocument.load(mainPdfBuffer);
      const pdf2 = await PDFDocument.load(barcodePdfBuffer);

      const copiedPages1 = await mergedPdf.copyPages(pdf1, pdf1.getPageIndices());
      copiedPages1.forEach((page) => mergedPdf.addPage(page));

      const copiedPages2 = await mergedPdf.copyPages(pdf2, pdf2.getPageIndices());
      copiedPages2.forEach((page) => mergedPdf.addPage(page));

      const mergedPdfBytes = await mergedPdf.save();
      return Buffer.from(mergedPdfBytes);

    } catch (barcodeError) {
      logger.warn(`[PDF Gen] ⚠️ Failed to generate Barcode Page for ID ${submissionId}. Returning Main Report only. Reason: ${barcodeError.message}`);
      // Fallback: Return only the main report if barcode generation fails
      return mainPdfBuffer;
    }

  } catch (error) {
    logger.error(`[PDF Gen] Error generating PDF for ID ${submissionId}:`, error);
    throw error;
  }
};

exports.generateDailyReportPdf = async (date, lotNoPrefix) => {
  let page;
  try {
    logger.info(`[PDF Gen] Starting Daily Report PDF. Date: ${date}, Lot: ${lotNoPrefix}`);

    // Default URL Logic:
    // 1. ลองใช้ค่าจาก .env (FRONTEND_URL)
    // 2. ถ้าไม่มี ให้เดาว่าเป็น Production (IIS Port 81)
    // 3. ถ้า Dev ให้ใช้ localhost:5173
    const defaultUrl = process.env.NODE_ENV === 'production'
      ? "http://localhost:81/genmatsu"
      : "http://localhost:5173/genmatsu";

    const baseUrl = config.frontendUrl || defaultUrl;
    let frontendPrintUrl = `${baseUrl}/reports/daily/print?date=${date}`;

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

    await new Promise(r => setTimeout(r, 1000));

    // 🟢 Wait for Fonts (Daily Report)
    await page.evaluate(() => document.fonts.ready);

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
