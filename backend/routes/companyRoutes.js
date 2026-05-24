const express = require("express");
const {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getAnalytics,
  seedDemoData,
  clearDemoData,
} = require("../controllers/companyController");

const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

router.route("/analytics").get(protect, getAnalytics);
router.route("/demo-seed").post(protect, seedDemoData);
router.route("/demo-clear").delete(protect, clearDemoData);
router.route("/").get(protect, getCompanies).post(protect, createCompany);
router.route("/:id").put(protect, updateCompany).delete(protect, deleteCompany);

module.exports = router;
