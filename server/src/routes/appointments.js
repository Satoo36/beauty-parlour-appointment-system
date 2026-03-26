import express from "express";
import { createAppointment, getAllAppointments, getAppointment, updateAppointmentStatus, cancelAppointment, addReview, getAppointmentStats } from "../controllers/appointmentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats", protect, authorize('admin', 'staff'), getAppointmentStats);
router.post("/", protect, createAppointment);
router.get("/", protect, getAllAppointments);
router.get("/:id", protect, getAppointment);
router.patch("/:id/status", protect, authorize('admin', 'staff'), updateAppointmentStatus);
router.patch("/:id/cancel", protect, cancelAppointment);
router.patch("/:id/review", protect, authorize('user'), addReview);

export default router;

