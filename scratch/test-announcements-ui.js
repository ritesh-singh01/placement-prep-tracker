const puppeteer = require('d:/placement-prep-tracker/backend/node_modules/puppeteer');
const mongoose = require('d:/placement-prep-tracker/backend/node_modules/mongoose');
const dotenv = require('d:/placement-prep-tracker/backend/node_modules/dotenv');
const fs = require('fs');
const User = require('d:/placement-prep-tracker/backend/models/user');
const Announcement = require('d:/placement-prep-tracker/backend/models/Announcement');

dotenv.config({ path: 'd:/placement-prep-tracker/backend/.env' });

const BASE_URL = 'http://localhost:5000';

async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function run() {
  console.log("=== STARTING ADMIN ANNOUNCEMENTS UI E2E TEST ===");
  let browser;
  let page;
  try {
    console.log("Connecting to database to verify setup...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected.");

    // Clean up prior test announcements
    await Announcement.deleteMany({ title: /^E2E Test/ });

    // Check admin user exists
    let admin = await User.findOne({ email: 'riteshthelegend10f@gmail.com' });
    if (!admin) {
      admin = await User.create({
        name: "Admin Legend",
        email: "riteshthelegend10f@gmail.com",
        password: "admin123",
        role: "admin",
        isVerified: true
      });
      console.log("Created admin user: riteshthelegend10f@gmail.com");
    }

    // Create a test announcement
    const testAnn = await Announcement.create({
      title: "E2E Test Announcement",
      message: "This is a test announcement to check the visual alignment, design system integration, and responsive layout.",
      type: "info",
      isActive: true,
      createdBy: admin._id,
      createdAt: new Date()
    });
    console.log("Created test announcement.");

    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });

    // ============================================
    // STEP 1: LOGIN AS ADMIN
    // ============================================
    console.log("Navigating to index...");
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle2' });
    await delay(500);

    console.log("Opening auth modal...");
    await page.evaluate(() => window.openAuthModal());
    await delay(500);

    console.log("Logging in as Admin...");
    await page.waitForSelector('.role-card[data-role="admin"]', { visible: true });
    await page.click('.role-card[data-role="admin"]');
    await delay(300);

    await page.evaluate(() => {
      document.querySelector('#authForm input[name="email"]').value = '';
      document.querySelector('#authForm input[name="password"]').value = '';
    });
    await page.type('#authForm input[name="email"]', 'riteshthelegend10f@gmail.com');
    await page.type('#authForm input[name="password"]', 'admin123');
    await page.click('#authForm button[type="submit"]');

    console.log("Waiting for navigation to admin platform...");
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await delay(1000);

    // ============================================
    // STEP 2: NAVIGATE TO ANNOUNCEMENTS
    // ============================================
    console.log("Navigating to Announcements section...");
    await page.waitForSelector('.nav__item[data-section="announcements"]', { visible: true });
    await page.click('.nav__item[data-section="announcements"]');
    await delay(1000); // Wait for announcements to render

    // ============================================
    // STEP 3: DESKTOP VIEWPORT & CARD STYLES VERIFICATION
    // ============================================
    console.log("\n--- Verification: Desktop Viewport ---");
    await page.setViewport({ width: 1200, height: 900 });
    await delay(300);

    const desktopProps = await page.evaluate(() => {
      const grid = document.querySelector('.announcements-grid');
      const card = document.querySelector('.announcement-card');
      const title = document.querySelector('.announcement-card__title');
      const message = document.querySelector('.announcement-card__message');
      
      const gridStyle = window.getComputedStyle(grid);
      const cardStyle = window.getComputedStyle(card);
      const titleStyle = window.getComputedStyle(title);
      const msgStyle = window.getComputedStyle(message);

      return {
        gridCols: gridStyle.gridTemplateColumns,
        gridGap: gridStyle.gap,
        cardBg: cardStyle.backgroundColor,
        cardBorder: cardStyle.borderColor || cardStyle.borderTopColor,
        cardPadding: cardStyle.padding,
        titleSize: titleStyle.fontSize,
        titleWeight: titleStyle.fontWeight,
        msgSize: msgStyle.fontSize,
        msgLineHeight: msgStyle.lineHeight
      };
    });

    console.log("Desktop Grid columns template:", desktopProps.gridCols);
    console.log("Desktop Grid gap:", desktopProps.gridGap);
    console.log("Card padding:", desktopProps.cardPadding);
    console.log("Card Title Font size:", desktopProps.titleSize);
    console.log("Card Message Font size:", desktopProps.msgSize);

    const colsCountDesktop = desktopProps.gridCols.split(/\s+/).filter(Boolean).length;
    if (colsCountDesktop !== 3) {
      throw new Error(`Expected 3 columns on desktop, got: ${desktopProps.gridCols}`);
    }
    if (desktopProps.cardPadding !== '20px') {
      throw new Error(`Expected card padding to be 20px, got ${desktopProps.cardPadding}`);
    }
    console.log("✅ Desktop Grid and Card proportions are perfect!");

    // ============================================
    // STEP 4: LIGHT MODE VERIFICATION
    // ============================================
    console.log("\n--- Verification: Light Mode Colors ---");
    // Switch to Light Mode
    await page.evaluate(() => {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
    });
    await delay(300);

    const lightProps = await page.evaluate(() => {
      const card = document.querySelector('.announcement-card');
      const title = document.querySelector('.announcement-card__title');
      const style = window.getComputedStyle(card);
      const titleStyle = window.getComputedStyle(title);
      return {
        bg: style.backgroundColor,
        color: titleStyle.color
      };
    });
    console.log("Light Mode Card background:", lightProps.bg);
    console.log("Light Mode Card Title color:", lightProps.color);

    if (lightProps.bg !== 'rgb(255, 255, 255)') {
      throw new Error(`Expected card background to be solid white (rgb(255, 255, 255)) in light mode, got ${lightProps.bg}`);
    }
    if (lightProps.color !== 'rgb(15, 23, 42)' && lightProps.color !== 'rgb(0, 0, 0)') {
      throw new Error(`Expected dark text title color in light mode, got ${lightProps.color}`);
    }
    console.log("✅ Light Mode contrast verified successfully!");

    // Switch back to Dark Mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
    });
    await delay(100);

    // ============================================
    // STEP 5: TABLET VIEWPORT VERIFICATION
    // ============================================
    console.log("\n--- Verification: Tablet Viewport ---");
    await page.setViewport({ width: 768, height: 1024 });
    await delay(300);

    const tabletGridCols = await page.evaluate(() => {
      const grid = document.querySelector('.announcements-grid');
      return window.getComputedStyle(grid).gridTemplateColumns;
    });
    console.log("Tablet Grid columns template:", tabletGridCols);
    const colsCountTablet = tabletGridCols.split(/\s+/).filter(Boolean).length;
    if (colsCountTablet !== 2) {
      throw new Error(`Expected 2 columns on tablet, got: ${tabletGridCols}`);
    }
    console.log("✅ Tablet Grid columns layout is perfect!");

    // ============================================
    // STEP 6: MOBILE VIEWPORT VERIFICATION
    // ============================================
    console.log("\n--- Verification: Mobile Viewport ---");
    await page.setViewport({ width: 375, height: 667 });
    await delay(300);

    const mobileGridCols = await page.evaluate(() => {
      const grid = document.querySelector('.announcements-grid');
      return window.getComputedStyle(grid).gridTemplateColumns;
    });
    console.log("Mobile Grid columns template:", mobileGridCols);
    const colsCountMobile = mobileGridCols.split(/\s+/).filter(Boolean).length;
    if (colsCountMobile !== 1) {
      throw new Error(`Expected 1 column on mobile, got: ${mobileGridCols}`);
    }
    console.log("✅ Mobile Grid stacks perfectly in a single column!");

    // ============================================
    // STEP 7: CREATE ANNOUNCEMENT ACTION VERIFICATION
    // ============================================
    console.log("\n--- Action Test: Create Announcement ---");
    await page.setViewport({ width: 1200, height: 900 });
    await delay(300);

    console.log("Clicking 'New Announcement' button...");
    await page.click('#newAnnouncementBtn');
    await delay(500);

    console.log("Checking that New Announcement Modal is open...");
    const isModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('announcementModal');
      return modal && !modal.classList.contains('hidden') && window.getComputedStyle(modal).display !== 'none';
    });
    if (!isModalOpen) {
      throw new Error("New Announcement Modal is not open.");
    }

    console.log("Filling announcement form...");
    await page.type('#announcementTitle', 'E2E Test Created Announcement');
    await page.type('#announcementMessage', 'This announcement was created dynamically during E2E verification test.');
    await page.select('#announcementType', 'success');

    console.log("Clicking Publish Announcement...");
    await page.click('#publishAnnouncementBtn');
    await delay(2000); // Wait for API response and render

    // Verify it is rendered on the page
    const hasNewAnn = await page.evaluate(() => {
      const titles = Array.from(document.querySelectorAll('.announcement-card__title')).map(t => t.textContent);
      return titles.includes('E2E Test Created Announcement');
    });
    console.log("Created announcement is rendered in list:", hasNewAnn);
    if (!hasNewAnn) {
      throw new Error("Created announcement was not found in the rendered list.");
    }
    console.log("✅ Announcement creation action verified successfully!");

    // ============================================
    // STEP 8: DELETE ANNOUNCEMENT ACTION VERIFICATION
    // ============================================
    console.log("\n--- Action Test: Delete Announcement ---");
    
    // Accept dialog confirm
    page.on('dialog', async dialog => {
      console.log('Dialog opened:', dialog.message());
      await dialog.accept();
    });

    console.log("Finding and clicking Delete button for test announcement...");
    
    // Click delete on the newly created announcement
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.announcement-card'));
      const targetCard = cards.find(c => c.querySelector('.announcement-card__title').textContent === 'E2E Test Created Announcement');
      if (targetCard) {
        targetCard.querySelector('.delete-announcement').click();
      }
    });

    await delay(2000); // Wait for delete API & rerender

    // Verify it is removed from the page
    const hasDeletedAnn = await page.evaluate(() => {
      const titles = Array.from(document.querySelectorAll('.announcement-card__title')).map(t => t.textContent);
      return titles.includes('E2E Test Created Announcement');
    });
    console.log("Deleted announcement is still in list:", hasDeletedAnn);
    if (hasDeletedAnn) {
      throw new Error("Deleted announcement is still rendered on the page.");
    }
    console.log("✅ Announcement deletion action verified successfully!");

    console.log("\n=============================================");
    console.log("🎉 SUCCESS! ADMIN ANNOUNCEMENTS UI TEST PASSED!");
    console.log("=============================================");

  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
    if (page) {
      await page.screenshot({ path: 'd:/placement-prep-tracker/scratch/error-announcements.png' });
      console.log("Saved error-announcements.png screenshot.");
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
    // Clean up database records
    await Announcement.deleteMany({ title: /^E2E Test/ });
    await mongoose.disconnect();
  }
}

run();
