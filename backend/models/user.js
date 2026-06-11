const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    // Shared profile fields
    phoneNumber: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    // Student specific profile fields
    collegeName: {
      type: String,
      default: "",
    },
    course: {
      type: String,
      default: "",
    },
    branch: {
      type: String,
      default: "",
    },
    graduationYear: {
      type: String,
      default: "",
    },
    skills: {
      type: String,
      default: "",
    },
    linkedinUrl: {
      type: String,
      default: "",
    },
    githubUrl: {
      type: String,
      default: "",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    // Admin specific profile fields
    department: {
      type: String,
      default: "",
    },
    designation: {
      type: String,
      default: "",
    },
    officeLocation: {
      type: String,
      default: "",
    },
    // Verification & Security
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: undefined,
    },
    verificationTokenExpires: {
      type: Date,
      default: undefined,
    },
    verificationOTP: {
      type: String,
      default: undefined,
    },
    verificationOTPExpires: {
      type: Date,
      default: undefined,
    },
    resetPasswordOTP: {
      type: String,
      default: undefined,
    },
    resetPasswordOTPExpires: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    if (this.role === "admin") {
      console.log(`[Admin Password Hashing] Hashing password for admin user: ${this.email}. Original raw password length: ${this.password ? this.password.length : 0}`);
    } else {
      console.log(`[User Pre-Save Hook] Password modification detected for user: ${this.email}, role: ${this.role}. isNew: ${this.isNew}`);
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    if (this.role === "admin") {
      console.log(`[Admin Password Hashing] Admin password successfully hashed and updated in memory. Hashed value prefix: ${this.password.substring(0, 10)}...`);
    } else {
      console.log(`[User Pre-Save Hook] Password successfully hashed and updated in memory for user: ${this.email}`);
    }
    next();
  } catch (err) {
    if (this.role === "admin") {
      console.error(`[Admin Password Hashing] Password hashing failed for admin user: ${this.email}:`, err);
    } else {
      console.error(`[User Pre-Save Hook] Password hashing failed for user: ${this.email}:`, err);
    }
    next(err);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
