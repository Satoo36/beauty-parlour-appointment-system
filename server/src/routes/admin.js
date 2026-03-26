import express from "express";
import { getAdminSummary, getAdminStaff } from "../controllers/AdminController.js";
import { getAllUsers } from "../controllers/userController.js";
import {
    getStaffSlots,
    generateSlotsForService,
    toggleSlotAvailability,
    deleteSlot
} from "../controllers/slotController.js";
import { protect, authorize } from "../middleware/auth.js";

import {
    getAllPayments,
    exportPaymentsCSV,
    generateInvoicePDF,
    initiateRefund
} from "../controllers/paymentController.js";

const router = express.Router();

// Middleware to log admin route access
router.use((req, res, next) => {
    console.log(`[ADMIN ROUTE] ${req.method} ${req.originalUrl}`);
    next();
});

router.get("/summary", protect, authorize('admin'), getAdminSummary);
router.get("/users", protect, authorize('admin'), getAllUsers);
router.get("/staff", protect, authorize('admin'), getAdminStaff);

// Payment Management Routes
router.get("/payments", protect, authorize('admin'), getAllPayments);
router.get("/payments/export", protect, authorize('admin'), exportPaymentsCSV);
router.get("/payments/:id/invoice", protect, authorize('admin'), generateInvoicePDF);
router.post("/payments/:id/refund", protect, authorize('admin'), initiateRefund);

// Slot Management Routes
router.get("/slots/:staffId", protect, authorize('admin', 'staff'), (req, res, next) => {
    console.log(`[SLOT FETCH] Staff: ${req.params.staffId}, Date: ${req.query.date}`);
    getStaffSlots(req, res, next);
});

router.post("/slots/generate", protect, authorize('admin', 'staff'), (req, res, next) => {
    console.log(`[SLOT GENERATE] Body:`, req.body);
    generateSlotsForService(req, res, next);
});

router.patch("/slots/:id/availability", protect, authorize('admin', 'staff'), toggleSlotAvailability);
router.delete("/slots/:id", protect, authorize('admin'), deleteSlot);

export default router;
