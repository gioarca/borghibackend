const express = require("express");
const {
  createVisit,
  getAllVisits,
  getPendingPayments,
  getVisitById,
  getVisitsByDoctorId,
  getVisitsByUserId,
  updateVisit,
  deleteVisit,
} = require("../controllers/visit.controller.js");
const {
  verifyToken,
  verifyAdmin,
  cloudinaryMiddleware,
} = require("../middleware/authMiddleware.js");
const { check } = require("express-validator");

const router = express.Router();

router.post(
  "/create",
  verifyToken,
  [
    check("user").notEmpty().isMongoId().withMessage("Invalid user ID format"),
    check("doctor")
      .notEmpty()
      .isMongoId()
      .withMessage("Invalid doctor ID format"),
    check("date").notEmpty().withMessage("Date is required"),
  ],
  createVisit
);

router.get("/", verifyToken, verifyAdmin, getAllVisits);
router.get("/pending-payments", verifyToken, verifyAdmin, getPendingPayments);
router.get("/:id", verifyToken, getVisitById);
router.get("/doctor/:doctorId", verifyToken, getVisitsByDoctorId);
router.get("/user/:userId", verifyToken, getVisitsByUserId);

router.put(
  "/update/:id",
  verifyToken,
  cloudinaryMiddleware,
  [
    check("paid")
      .optional()
      .isBoolean()
      .withMessage("Paid must be a boolean value"),
    check("amount")
      .optional()
      .isNumeric()
      .toFloat()
      .withMessage("amount must be a valid number"),
    check("paymentMethod")
      .optional()
      .isIn(["cash", "credit card", "paypal", "bank transfer", "debit card"])
      .withMessage("Invalid payment method"),
  ],
  updateVisit
);

router.delete("/delete/:id", verifyToken, deleteVisit);

module.exports = router;
