const User = require("../models/user");
const Collection = require("../models/collection");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "default_jwt_secret_for_dev_only", {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

/**
 * Validates email format according to strict production requirements
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const trimmed = email.trim();
  
  if (/\s/.test(trimmed)) return false;
  
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  
  const [local, domain] = parts;
  if (!local) return false;
  
  if (!domain || !domain.includes('.')) return false;
  
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;
  
  if (domainParts.some(p => p === "")) return false;

  return true;
};

exports.signup = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    // Validation
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    // Normalization
    email = email.trim().toLowerCase();
    name = name.trim();

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "student",
      isBlocked: false,
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Failed to create user in database" });
    }

    // Provision default collections
    await Collection.insertMany([
      { name: "General", user: user._id, icon: "sparkles", color: "muted" },
      { name: "Company-wise", user: user._id, icon: "building-2", color: "blue" },
      { name: "DSA", user: user._id, icon: "code-2", color: "good" },
      { name: "DBMS", user: user._id, icon: "database", color: "purple" },
      { name: "OS + CN", user: user._id, icon: "globe", color: "amber" },
    ]);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        token: generateToken(user._id),
      },
    });
  } catch (err) {
    console.error("[Auth] Signup Error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to sign up",
    });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Validation
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    // Normalization
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Role check validation
    const { expectedRole } = req.body;
    if (expectedRole && user.role !== expectedRole) {
      const msg = user.role === "admin"
        ? "This is an admin account. Please use Admin Login."
        : "This is a student account. Please use Student Login.";
      return res.status(400).json({
        success: false,
        message: msg,
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by admin.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        token: generateToken(user._id),
      },
    });
  } catch (err) {
    console.error("[Auth] Login Error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to log in",
    });
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

exports.getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    console.error("[Auth] Get Profile Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.body.name !== undefined) {
      const trimmedName = req.body.name.trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: "Name cannot be empty" });
      }
      user.name = trimmedName;
    }
    
    if (req.body.phoneNumber !== undefined) user.phoneNumber = req.body.phoneNumber.trim();
    if (req.body.bio !== undefined) user.bio = req.body.bio.trim();

    if (user.role === "student") {
      if (req.body.collegeName !== undefined) user.collegeName = req.body.collegeName.trim();
      if (req.body.course !== undefined) user.course = req.body.course.trim();
      if (req.body.branch !== undefined) user.branch = req.body.branch.trim();
      if (req.body.graduationYear !== undefined) user.graduationYear = req.body.graduationYear.trim();
      if (req.body.skills !== undefined) user.skills = req.body.skills.trim();
      if (req.body.linkedinUrl !== undefined) user.linkedinUrl = req.body.linkedinUrl.trim();
      if (req.body.githubUrl !== undefined) user.githubUrl = req.body.githubUrl.trim();
      if (req.body.resumeUrl !== undefined) user.resumeUrl = req.body.resumeUrl.trim();
    } else if (user.role === "admin") {
      if (req.body.department !== undefined) user.department = req.body.department.trim();
      if (req.body.designation !== undefined) user.designation = req.body.designation.trim();
      if (req.body.officeLocation !== undefined) user.officeLocation = req.body.officeLocation.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("[Auth] Update Profile Error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update profile",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all password fields",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect current password",
      });
    }

    const isSameAsCurrent = await user.matchPassword(newPassword);
    if (isSameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as current password",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("[Auth] Change Password Error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to change password",
    });
  }
};
