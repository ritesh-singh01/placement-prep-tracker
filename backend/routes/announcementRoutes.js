const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const { protect, admin } = require("../middleware/authMiddleware");

// @desc    Get all active announcements
// @route   GET /api/announcements
// @access  Private (All authenticated users)
router.get("/", protect, async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private/Admin
router.post("/", protect, admin, async (req, res) => {
  try {
    const { title, message, type } = req.body;

    const trimmedTitle = (title || "").trim();
    if (!trimmedTitle) {
      return res.status(400).json({ success: false, message: "Announcement Title is required." });
    }
    if (trimmedTitle.length < 2 || trimmedTitle.length > 100) {
      return res.status(400).json({ success: false, message: "Announcement Title must be between 2 and 100 characters." });
    }
    if (/^[+-]?\d+(\.\d+)?$/.test(trimmedTitle)) {
      return res.status(400).json({ success: false, message: "Announcement Title cannot contain only numbers." });
    }
    if (!/^[a-zA-Z0-9\s&.\-']+$/.test(trimmedTitle)) {
      return res.status(400).json({ success: false, message: "Announcement Title contains invalid characters." });
    }
    if (!/[a-zA-Z0-9]/.test(trimmedTitle)) {
      return res.status(400).json({ success: false, message: "Announcement Title cannot consist only of special characters." });
    }

    const trimmedMsg = (message || "").trim();
    if (!trimmedMsg) {
      return res.status(400).json({ success: false, message: "Announcement Message is required." });
    }
    if (trimmedMsg.length > 5000) {
      return res.status(400).json({ success: false, message: "Announcement Message must not exceed 5000 characters." });
    }
    if (/<script\b[^>]*>|javascript:|on\w+\s*=/i.test(trimmedMsg)) {
      return res.status(400).json({ success: false, message: "Announcement Message contains forbidden script content." });
    }

    const validTypes = ["info", "success", "warning", "urgent"];
    const t = (type || "info").toLowerCase();
    if (!validTypes.includes(t)) {
      return res.status(400).json({ success: false, message: "Invalid announcement type." });
    }

    const announcement = await Announcement.create({
      title: trimmedTitle,
      message: trimmedMsg,
      type: t,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Delete/Deactivate an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    // Hard delete or Soft delete? User asked for Delete.
    await Announcement.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
