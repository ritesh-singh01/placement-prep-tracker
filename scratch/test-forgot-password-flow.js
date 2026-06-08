const puppeteer = require('d:/placement-prep-tracker/backend/node_modules/puppeteer');
const mongoose = require('d:/placement-prep-tracker/backend/node_modules/mongoose');
const dotenv = require('d:/placement-prep-tracker/backend/node_modules/dotenv');
const fs = require('fs');
const User = require('d:/placement-prep-tracker/backend/models/user');

dotenv.config({ path: 'd:/placement-prep-tracker/backend/.env' });

const BASE_URL = 'http://localhost:5000';

async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function run() {
  console.log("=== STARTING FORGOT PASSWORD E2E FLOW TEST ===");
  let browser;
  let page;
  try {
    console.log("Connecting to database to verify setup...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected.");

    // Check student user exists
    let student = await User.findOne({ email: 'abcde@gmail.com' });
    if (!student) {
      student = await User.create({
        name: "E2E Student",
        email: "abcde@gmail.com",
        password: "StudentPassword123!",
        role: "student",
        isVerified: true
      });
      console.log("Created student user: abcde@gmail.com");
    }

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
    // TEST 1: ADMIN FORGOT PASSWORD FLOW
    // ============================================
    console.log("\n--- TEST 1: Admin Forgot Password ---");
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle2' });
    await delay(500);

    // Open Auth Modal via window function
    console.log("Opening auth modal...");
    await page.evaluate(() => window.openAuthModal());
    await delay(500);

    // Select Admin Role
    console.log("Selecting Admin role card...");
    await page.waitForSelector('.role-card[data-role="admin"]', { visible: true });
    await page.click('.role-card[data-role="admin"]');
    await delay(300);

    // Click Forgot Password
    await page.waitForSelector('#forgotPassword', { visible: true });
    await page.click('#forgotPassword');
    await delay(500);

    // Check input prefilled and readonly
    const adminEmailVal = await page.evaluate(() => {
      const input = document.getElementById('forgotEmailInput');
      return {
        value: input.value,
        readonly: input.readOnly || input.hasAttribute('readonly')
      };
    });
    console.log("Admin email prefilled:", adminEmailVal.value);
    console.log("Admin email readonly:", adminEmailVal.readonly);

    if (adminEmailVal.value !== 'riteshthelegend10f@gmail.com') {
      throw new Error(`Expected admin email prefilled to be riteshthelegend10f@gmail.com, got ${adminEmailVal.value}`);
    }
    if (!adminEmailVal.readonly) {
      throw new Error("Expected admin email to be readonly.");
    }

    // Check background & color of readonly input in dark and light mode
    console.log("Checking readonly input styles (Dark Mode)...");
    const darkStyles = await page.evaluate(() => {
      const input = document.getElementById('forgotEmailInput');
      const style = window.getComputedStyle(input);
      return {
        background: style.backgroundColor || style.background,
        color: style.color
      };
    });
    console.log("Dark Mode styles for readonly email:", darkStyles);

    // Switch to Light Mode
    console.log("Switching to Light Mode...");
    await page.evaluate(() => {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
    });
    await delay(300);

    console.log("Checking readonly input styles (Light Mode)...");
    const lightStyles = await page.evaluate(() => {
      const input = document.getElementById('forgotEmailInput');
      const style = window.getComputedStyle(input);
      return {
        background: style.backgroundColor || style.background,
        color: style.color
      };
    });
    console.log("Light Mode styles for readonly email:", lightStyles);

    // Switch back to Dark Mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
    });
    await delay(100);

    // Submit Admin forgot password request
    console.log("Submitting admin forgot password...");
    await page.click('#forgotForm button[type="submit"]');
    await delay(2000); // Wait for API response and OTP generation

    // Confirm that it went to the OTP Verification screen (Step 2)
    const isOtpStateVisible = await page.evaluate(() => {
      const otpState = document.getElementById('forgotOtpState');
      const inputState = document.getElementById('forgotInputState');
      return otpState.style.display !== 'none' && inputState.style.display === 'none';
    });
    console.log("Transitioned to Step 2 OTP verification state:", isOtpStateVisible);
    if (!isOtpStateVisible) {
      throw new Error("Admin forgot password did not transition to Step 2 OTP verification.");
    }
    console.log("✅ Admin Forgot Password transitioned to Step 2 OTP Verification successfully!");

    // Close forgot password modal
    await page.click('#forgotClose');
    await delay(300);

    // ============================================
    // TEST 2: STUDENT FORGOT PASSWORD FLOW
    // ============================================
    console.log("\n--- TEST 2: Student Forgot Password ---");
    // Open Auth Modal again
    console.log("Re-opening auth modal...");
    await page.evaluate(() => window.openAuthModal());
    await delay(500);

    // Click back to role if role Selection is not visible
    const isRoleSelectionVisible = await page.evaluate(() => {
      const el = document.getElementById('roleSelection');
      return el && el.style.display !== 'none';
    });
    console.log("Is role selection visible:", isRoleSelectionVisible);
    if (!isRoleSelectionVisible) {
      console.log("Clicking back to role button...");
      await page.waitForSelector('#backToRole', { visible: true });
      await page.click('#backToRole');
      await delay(300);
    }

    // Select Student Role
    console.log("Selecting Student role card...");
    await page.waitForSelector('.role-card[data-role="student"]', { visible: true });
    await page.click('.role-card[data-role="student"]');
    await delay(300);

    // Click Forgot Password
    await page.waitForSelector('#forgotPassword', { visible: true });
    await page.click('#forgotPassword');
    await delay(500);

    // Check input is empty and not readonly
    const studentEmailVal = await page.evaluate(() => {
      const input = document.getElementById('forgotEmailInput');
      return {
        value: input.value,
        readonly: input.readOnly || input.hasAttribute('readonly')
      };
    });
    console.log("Student email value:", studentEmailVal.value);
    console.log("Student email readonly:", studentEmailVal.readonly);

    if (studentEmailVal.value !== '') {
      throw new Error(`Expected student email to be empty, got ${studentEmailVal.value}`);
    }
    if (studentEmailVal.readonly) {
      throw new Error("Expected student email NOT to be readonly.");
    }

    // Type student email
    await page.type('#forgotEmailInput', 'abcde@gmail.com');

    // Submit Student forgot password
    console.log("Submitting student forgot password...");
    await page.click('#forgotForm button[type="submit"]');
    await delay(2000); // Wait for API response

    // Confirm that it went to the Success screen (Step 3) directly
    const isSuccessStateVisible = await page.evaluate(() => {
      const successState = document.getElementById('forgotSuccessState');
      const inputState = document.getElementById('forgotInputState');
      const otpState = document.getElementById('forgotOtpState');
      const title = document.getElementById('forgotSuccessTitle');
      const text = document.getElementById('forgotSuccessText');
      return {
        visible: successState.style.display !== 'none' && inputState.style.display === 'none' && otpState.style.display === 'none',
        title: title.textContent,
        text: text.textContent
      };
    });
    console.log("Transitioned directly to Step 3 Success state:", isSuccessStateVisible.visible);
    console.log("Success Title:", isSuccessStateVisible.title);
    console.log("Success Text:", isSuccessStateVisible.text);

    if (!isSuccessStateVisible.visible) {
      throw new Error("Student forgot password did not transition directly to Step 3 Success confirmation.");
    }
    if (isSuccessStateVisible.title !== "Request Submitted!") {
      throw new Error(`Expected student success title "Request Submitted!", got "${isSuccessStateVisible.title}"`);
    }
    if (isSuccessStateVisible.text.includes("OTP") || isSuccessStateVisible.text.includes("verification code")) {
      throw new Error("Student success screen leaked admin OTP references.");
    }
    console.log("✅ Student Forgot Password transitioned directly to Step 3 Success state successfully!");

    console.log("\n==========================================");
    console.log("🎉 SUCCESS! FORGOT PASSWORD E2E TEST PASSED!");
    console.log("==========================================");

  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
    if (page) {
      await page.screenshot({ path: 'd:/placement-prep-tracker/scratch/error-screenshot.png' });
      const html = await page.content();
      fs.writeFileSync('d:/placement-prep-tracker/scratch/error-page.html', html);
      console.log("Saved error-screenshot.png and error-page.html");
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
    await mongoose.disconnect();
  }
}

run();
