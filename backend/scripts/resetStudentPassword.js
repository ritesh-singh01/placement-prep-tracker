/**
 * Reset Password Script for abcde@gmail.com
 * 
 * Purpose: Resets the password for abcde@gmail.com to Student@123 safely
 * using Mongoose model save (triggering pre-save password hashing).
 * Then verifies the credentials by testing login.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load backend .env configuration
dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/user");

async function main() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in the backend .env file.");
    }

    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const email = "abcde@gmail.com";
    const newPassword = "Student@123";

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.log(`Account ${email} does not exist. Creating new student account...`);
      user = await User.create({
        name: "You",
        email: email,
        password: newPassword, // Raw password, will be hashed once by pre-save hook
        role: "student",
        isBlocked: false
      });
      console.log("Account created successfully.");
    } else {
      console.log(`Account ${email} found. Resetting password to: ${newPassword}`);
      user.password = newPassword; // Triggers pre-save hashing
      user.role = "student";
      user.isBlocked = false;
      await user.save();
      console.log("Password reset successfully.");
    }

    // Verify Password by matching
    console.log("\n--- VERIFICATION TESTS ---");
    
    // Fetch user again with password field included
    const verifiedUser = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    
    // Test 1: Test login with new password (Student@123)
    const isMatchCorrect = await verifiedUser.matchPassword(newPassword);
    console.log(`Test 1 (Password: "${newPassword}"): ${isMatchCorrect ? "✅ SUCCESS (Logged in)" : "❌ FAILED"}`);

    // Test 2: Test login with "passcode" (expected to fail)
    const isMatchIncorrect = await verifiedUser.matchPassword("passcode");
    console.log(`Test 2 (Password: "passcode"): ${isMatchIncorrect ? "❌ FAILED (Logged in with wrong password)" : "✅ SUCCESS (Access Denied as expected)"}`);

    console.log("\nVerification completed successfully.");

  } catch (error) {
    console.error("Reset failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

main();
