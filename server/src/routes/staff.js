import express from "express";
import { getAllStaff, getStaff, createStaff, updateStaff, deleteStaff, getStaffSchedule, updateStaffRating } from "../controllers/staffController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Staff Dashboard routes
import { getStaffAppointments, getStaffSummary, updateStaffAppointmentStatus } from "../controllers/staffController.js";
router.get("/appointments", protect, authorize('staff'), getStaffAppointments);
router.get("/dashboard/appointments", protect, authorize('staff'), getStaffAppointments);
router.get("/dashboard/summary", protect, authorize('staff'), getStaffSummary);
router.put("/dashboard/appointments/:id/status", protect, authorize('admin', 'staff'), updateStaffAppointmentStatus);

router.get("/", getAllStaff);
router.get("/:id", getStaff);
router.post("/", protect, authorize('admin'), createStaff);
router.put("/:id", protect, authorize('admin', 'staff'), updateStaff);
router.delete("/:id", protect, authorize('admin'), deleteStaff);
router.get("/:id/schedule", protect, authorize('admin', 'staff'), getStaffSchedule);
router.patch("/:staffId/rating", protect, authorize('user'), updateStaffRating);

export default router;