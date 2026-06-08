const puppeteer = require('d:/placement-prep-tracker/backend/node_modules/puppeteer');
const mongoose = require('d:/placement-prep-tracker/backend/node_modules/mongoose');
const dotenv = require('d:/placement-prep-tracker/backend/node_modules/dotenv');

dotenv.config({ path: 'd:/placement-prep-tracker/backend/.env' });

const BASE_URL = 'http://localhost:5000';

async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function run() {
  console.log("=== STARTING STUDENT COMPANY PORTAL UI E2E TEST ===");
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });

    // ============================================
    // STEP 1: LOGIN AS STUDENT
    // ============================================
    console.log("Navigating to index...");
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle2' });
    await delay(500);

    console.log("Opening auth modal...");
    await page.evaluate(() => window.openAuthModal());
    await delay(500);

    console.log("Logging in as Student...");
    await page.waitForSelector('.role-card[data-role="student"]', { visible: true });
    await page.click('.role-card[data-role="student"]');
    await delay(300);

    await page.evaluate(() => {
      document.querySelector('#authForm input[name="email"]').value = '';
      document.querySelector('#authForm input[name="password"]').value = '';
    });
    await page.type('#authForm input[name="email"]', 'abcde@gmail.com');
    await page.type('#authForm input[name="password"]', 'Student@123');
    await page.click('#authForm button[type="submit"]');

    console.log("Waiting for navigation to student dashboard...");
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await delay(1000);

    // ============================================
    // STEP 2: NAVIGATE TO COMPANIES PORTAL
    // ============================================
    console.log("Navigating to Company page...");
    await page.goto(`${BASE_URL}/company.html`, { waitUntil: 'networkidle2' });
    await delay(1000); // Wait for API calls & layout rendering

    // ============================================
    // STEP 3: DESKTOP VIEWPORT & STYLES VERIFICATION
    // ============================================
    console.log("\n--- Verification: Desktop Viewport ---");
    await page.setViewport({ width: 1440, height: 900 });
    await delay(300);

    const desktopProps = await page.evaluate(() => {
      const stats = document.querySelector('.companyStats');
      const grid = document.querySelector('.companyGrid');
      const table = document.querySelector('.companyTable');
      const firstRow = document.querySelector('#companyTableBody tr');
      const statCard = document.querySelector('.companyStat');

      const statsStyle = window.getComputedStyle(stats);
      const gridStyle = window.getComputedStyle(grid);
      const tableStyle = window.getComputedStyle(table);
      const firstRowTd = firstRow ? window.getComputedStyle(firstRow.querySelector('td')) : null;
      const statCardStyle = window.getComputedStyle(statCard);

      return {
        statsGridCols: statsStyle.gridTemplateColumns,
        mainGridCols: gridStyle.gridTemplateColumns,
        tableMinWith: tableStyle.minWidth,
        statCardBorder: statCardStyle.borderColor || statCardStyle.borderTopColor,
        statCardBg: statCardStyle.backgroundColor,
        statCardPadding: statCardStyle.padding,
        rowBg: firstRowTd ? firstRowTd.backgroundColor : null,
        rowPadding: firstRowTd ? firstRowTd.padding : null
      };
    });

    console.log("Stats columns:", desktopProps.statsGridCols);
    console.log("Main Layout Grid columns:", desktopProps.mainGridCols);
    console.log("Table min-width:", desktopProps.tableMinWith);
    console.log("Stat card padding:", desktopProps.statCardPadding);
    console.log("Row TD cell padding:", desktopProps.rowPadding);

    const statColsCount = desktopProps.statsGridCols.split(/\s+/).filter(Boolean).length;
    if (statColsCount !== 4) {
      throw new Error(`Expected 4 columns for stats on desktop, got: ${desktopProps.statsGridCols}`);
    }
    console.log("✅ Stats cards correctly aligned in 4 columns on desktop!");

    // ============================================
    // STEP 4: LIGHT MODE VERIFICATION
    // ============================================
    console.log("\n--- Verification: Light Mode Overrides ---");
    await page.evaluate(() => {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
    });
    await delay(300);

    const lightProps = await page.evaluate(() => {
      const statCard = document.querySelector('.companyStat');
      const firstRow = document.querySelector('#companyTableBody tr');
      const selectEl = document.querySelector('.companySelect');

      const statCardStyle = window.getComputedStyle(statCard);
      const rowTdStyle = firstRow ? window.getComputedStyle(firstRow.querySelector('td')) : null;
      const selectStyle = window.getComputedStyle(selectEl);

      return {
        statCardBg: statCardStyle.backgroundColor,
        rowBg: rowTdStyle ? rowTdStyle.backgroundColor : null,
        selectBg: selectStyle.backgroundColor
      };
    });

    console.log("Light Mode Stat Card background:", lightProps.statCardBg);
    console.log("Light Mode Row background:", lightProps.rowBg);
    console.log("Light Mode Select background:", lightProps.selectBg);

    if (lightProps.statCardBg !== 'rgb(255, 255, 255)') {
      throw new Error(`Expected solid white stat card background in light mode, got ${lightProps.statCardBg}`);
    }
    if (lightProps.rowBg && lightProps.rowBg !== 'rgb(255, 255, 255)') {
      throw new Error(`Expected solid white table row background in light mode, got ${lightProps.rowBg}`);
    }
    console.log("✅ Light Mode contrast checks passed!");

    // Reset back to Dark mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
    });
    await delay(100);

    // ============================================
    // STEP 5: STATUS PILL DYNAMIC DROPDOWN
    // ============================================
    console.log("\n--- Verification: Status Dropdown Pill Visuals ---");
    const statusPillProps = await page.evaluate(() => {
      const badge = document.querySelector('.statusCell .statusBadge');
      const selectWrap = document.querySelector('.statusSelectWrap');
      const select = document.querySelector('.statusSelect');

      const badgeDisplay = badge ? window.getComputedStyle(badge).display : null;
      const wrapStyle = window.getComputedStyle(selectWrap);
      const selectStyle = window.getComputedStyle(select);

      return {
        badgeDisplay,
        wrapShadow: wrapStyle.boxShadow,
        selectBorderRadius: selectStyle.borderRadius,
        selectPadding: selectStyle.padding,
        selectColor: selectStyle.color
      };
    });

    console.log("Badge display property (should be none):", statusPillProps.badgeDisplay);
    console.log("Select Wrapper Box Shadow:", statusPillProps.wrapShadow);
    console.log("Select element border-radius:", statusPillProps.selectBorderRadius);
    console.log("Select color:", statusPillProps.selectColor);

    if (statusPillProps.badgeDisplay !== 'none') {
      throw new Error(`Expected redundant static statusBadge to be hidden (display: none), got ${statusPillProps.badgeDisplay}`);
    }
    if (statusPillProps.selectBorderRadius !== '999px') {
      throw new Error(`Expected statusSelect element to have pill border-radius (999px), got ${statusPillProps.selectBorderRadius}`);
    }
    console.log("✅ Status pill select badge verified successfully!");

    // ============================================
    // STEP 6: TABLET VIEWPORT RESPONSIVENESS
    // ============================================
    console.log("\n--- Verification: Tablet Viewport ---");
    await page.setViewport({ width: 768, height: 1024 });
    await delay(300);

    const tabletGridCols = await page.evaluate(() => {
      const stats = document.querySelector('.companyStats');
      return window.getComputedStyle(stats).gridTemplateColumns;
    });
    console.log("Tablet Stats grid columns:", tabletGridCols);
    const tabletStatColsCount = tabletGridCols.split(/\s+/).filter(Boolean).length;
    if (tabletStatColsCount !== 2) {
      throw new Error(`Expected 2 columns for stats on tablet (<=1200px), got: ${tabletGridCols}`);
    }
    console.log("✅ Tablet responsiveness verified successfully!");

    console.log("\n=============================================");
    console.log("🎉 SUCCESS! STUDENT COMPANY PORTAL UI TEST PASSED!");
    console.log("=============================================");

  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
    if (page) {
      await page.screenshot({ path: 'd:/placement-prep-tracker/scratch/error-company.png' });
      console.log("Saved error-company.png screenshot.");
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run();
