const mongoose = require("mongoose");

const placementDriveSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
    },
    package: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    eligibility: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
    },
    driveDate: {
      type: Date,
    },
    mode: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      default: "Online",
    },
    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlacementDrive", placementDriveSchema);
