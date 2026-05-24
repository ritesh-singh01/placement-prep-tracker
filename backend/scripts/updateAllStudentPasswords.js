const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user');

dotenv.config();

async function updateAllStudentPasswords() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} student accounts.`);

    let updatedCount = 0;
    for (const student of students) {
      student.password = 'Passcode235';
      // The user model pre-save hook will automatically hash this using bcrypt
      await student.save();
      updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} student passwords to Passcode235.`);

  } catch (err) {
    console.error("Error updating passwords:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

updateAllStudentPasswords();
