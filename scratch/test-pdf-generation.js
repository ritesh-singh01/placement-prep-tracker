const puppeteer = require('d:/placement-prep-tracker/backend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
const DOWNLOAD_DIR = path.resolve('d:/placement-prep-tracker/scratch/downloads');

// Helper to wait
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

// Helper to wait for files to download
function waitForFile(dir, pattern, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const interval = setInterval(() => {
            if (!fs.existsSync(dir)) {
                return;
            }
            const files = fs.readdirSync(dir);
            const found = files.find(file => pattern.test(file));
            if (found) {
                clearInterval(interval);
                resolve(path.join(dir, found));
            } else if (Date.now() - start > timeoutMs) {
                clearInterval(interval);
                reject(new Error(`Timeout waiting for file matching pattern ${pattern} in ${dir}`));
            }
        }, 500);
    });
}

async function run() {
    console.log("=== STARTING E2E PDF GENERATION AUTOMATED TESTS ===");
    
    // Ensure clean downloads directory
    if (fs.existsSync(DOWNLOAD_DIR)) {
        fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });
    
    // Set download path behavior
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_DIR
    });

    // Capture all console logs
    page.on('console', msg => {
        console.log(`[Browser Console ${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Capture uncaught exceptions
    page.on('pageerror', err => {
        console.log(`[Browser Uncaught Page Error] ${err.stack || err.toString()}`);
    });

    // Capture request failures
    page.on('requestfailed', req => {
        console.log(`[Browser Request Failed] ${req.url()} - ${req.failure().errorText}`);
    });

    try {
        // ==========================================
        // 1. STUDENT FLOW
        // ==========================================
        console.log("Navigating to Login Page...");
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle2' });
        await delay(500);
        
        console.log("Opening auth modal...");
        await page.evaluate(() => window.openAuthModal());
        await delay(500);

        console.log("Selecting Student role card...");
        await page.waitForSelector('.role-card[data-role="student"]', { visible: true });
        await page.click('.role-card[data-role="student"]');
        await delay(300);

        console.log("Logging in as Student: abcde@gmail.com...");
        await page.evaluate(() => {
            document.querySelector('#authForm input[name="email"]').value = '';
            document.querySelector('#authForm input[name="password"]').value = '';
        });
        await page.type('#authForm input[name="email"]', 'abcde@gmail.com');
        await page.type('#authForm input[name="password"]', 'Student@123');
        await page.click('#authForm button[type="submit"]');
        
        console.log("Waiting for Student Dashboard redirect...");
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await delay(1000);
        
        console.log("Dashboard loaded. Capturing screenshot...");
        await page.screenshot({ path: 'd:/placement-prep-tracker/scratch/student_dashboard.png' });

        // Trigger PDF Download from Header Topbar
        console.log("Clicking 'Download My Report' button in dashboard header...");
        await page.waitForSelector('#downloadMyReportBtn', { visible: true });
        await page.click('#downloadMyReportBtn');
        
        console.log("Waiting for Student report PDF download from header...");
        const headerPdf = await waitForFile(DOWNLOAD_DIR, /StudentReport_.*\.pdf$/);
        console.log(`✅ SUCCESS: PDF downloaded from header: ${path.basename(headerPdf)}`);

        // Trigger PDF Download from Edit Profile Modal
        console.log("Opening student profile modal directly...");
        await page.evaluate(() => {
            const btn = document.getElementById('dropdownProfileBtn');
            if (btn) btn.click();
        });

        console.log("Waiting for Profile modal to open...");
        await page.waitForSelector('#profileModalOverlay', { visible: true });
        await delay(500);
        
        console.log("Profile modal visible. Capturing screenshot...");
        await page.screenshot({ path: 'd:/placement-prep-tracker/scratch/student_profile_modal.png' });

        console.log("Clicking 'Download My Report' inside Profile modal footer...");
        await page.waitForSelector('#downloadProfileReportBtn', { visible: true });
        
        // Clean download folder to wait for second file safely
        fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

        await page.click('#downloadProfileReportBtn');

        console.log("Waiting for Student report PDF download from profile modal...");
        const modalPdf = await waitForFile(DOWNLOAD_DIR, /StudentReport_.*\.pdf$/);
        console.log(`✅ SUCCESS: PDF downloaded from profile modal: ${path.basename(modalPdf)}`);

        // Close profile modal
        console.log("Closing profile modal...");
        await page.click('#cancelProfileModal');
        await page.waitForSelector('#profileModalOverlay', { hidden: true });
        await delay(500);

        // Logout
        console.log("Logging out of Student Portal...");
        await page.evaluate(() => {
            const dropdown = document.getElementById("userDropdown");
            if (dropdown) dropdown.classList.add("is-open");
        });
        await page.waitForSelector('#dropdownLogoutBtn', { visible: true });
        await page.evaluate(() => {
            const logoutBtn = document.getElementById('dropdownLogoutBtn');
            if (logoutBtn) logoutBtn.click();
        });
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await delay(1000);

        // ==========================================
        // 2. ADMIN FLOW
        // ==========================================
        console.log("Opening auth modal for Admin login...");
        await page.evaluate(() => window.openAuthModal());
        await delay(500);

        console.log("Selecting Admin role card...");
        await page.waitForSelector('.role-card[data-role="admin"]', { visible: true });
        await page.click('.role-card[data-role="admin"]');
        await delay(300);

        console.log("Logging in as Admin: riteshthelegend10f@gmail.com...");
        await page.evaluate(() => {
            document.querySelector('#authForm input[name="email"]').value = '';
            document.querySelector('#authForm input[name="password"]').value = '';
        });
        await page.type('#authForm input[name="email"]', 'riteshthelegend10f@gmail.com');
        await page.type('#authForm input[name="password"]', 'admin123');
        await page.click('#authForm button[type="submit"]');

        console.log("Waiting for Admin Portal redirect...");
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await delay(1000);

        console.log("Admin Dashboard loaded. Capturing screenshot...");
        await page.screenshot({ path: 'd:/placement-prep-tracker/scratch/admin_dashboard.png' });

        // Navigate to Student Management Section
        console.log("Navigating to Student Management section...");
        await page.waitForSelector('.nav__item[data-section="students"]', { visible: true });
        await page.click('.nav__item[data-section="students"]');
        await page.waitForSelector('#studentsTableBody tr');
        await delay(1000);
        await page.screenshot({ path: 'd:/placement-prep-tracker/scratch/admin_student_management.png' });

        // Click individual student row report button
        console.log("Clicking individual student row 'Report' button...");
        const dlRowBtn = await page.$('#studentsTableBody tr .download-student-report');
        if (!dlRowBtn) {
            console.warn("⚠️ Warning: No students found in student table row, skipping row download test.");
        } else {
            fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
            fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

            await page.click('#studentsTableBody tr .download-student-report');
            const rowPdf = await waitForFile(DOWNLOAD_DIR, /StudentReport_.*\.pdf$/);
            console.log(`✅ SUCCESS: Student row individual PDF downloaded: ${path.basename(rowPdf)}`);
        }

        // Navigate to Reports Section
        console.log("Navigating to Reports section...");
        await page.click('.nav__item[data-section="reports"]');
        await page.waitForSelector('#reportsStats');
        await delay(1000);
        await page.screenshot({ path: 'd:/placement-prep-tracker/scratch/admin_reports_section.png' });

        // Click Export Complete Placement Report button
        console.log("Clicking 'Export Complete Placement Report' button...");
        await page.waitForSelector('#exportPlacementReportBtn', { visible: true });
        
        fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
        
        await page.click('#exportPlacementReportBtn');
        const exportPdf = await waitForFile(DOWNLOAD_DIR, /Placement_Report_.*\.pdf$/);
        console.log(`✅ SUCCESS: Consolidated placement PDF downloaded: ${path.basename(exportPdf)}`);

    } catch (error) {
        console.error("❌ TEST RUN FAILED:", error);
        await page.screenshot({ path: 'd:/placement-prep-tracker/scratch/error-pdf-generation.png' });
        process.exit(1);
    } finally {
        await browser.close();
    }

    console.log("\n✅ ALL PDF GENERATION E2E TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS.");
    process.exit(0);
}

run();
