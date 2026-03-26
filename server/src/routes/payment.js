import express from "express";
import { createOrder, verifyPayment, getPayment, getAllPayments, getUserPayments, initiateRefund, getPaymentStats, webhookHandler, exportPaymentsCSV } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/webhook", webhookHandler);
router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/my-payments", protect, getUserPayments);
router.get("/stats", protect, authorize('admin'), getPaymentStats);
router.get("/all", protect, authorize('admin'), getAllPayments);
router.get("/:id", protect, getPayment);
router.get("/export-csv", protect, authorize('admin'), exportPaymentsCSV);
router.post("/refund", protect, authorize('admin'), initiateRefund);

export default router;
