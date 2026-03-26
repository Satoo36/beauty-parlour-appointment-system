import express from "express";
import { getAvailableSlots, generateSlotsForService, toggleSlotAvailability, deleteSlot, getStaffSlots, bulkGenerateSlots, getSlotStats } from "../controllers/slotController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/available", getAvailableSlots);
router.post("/generate", protect, authorize('admin', 'staff'), generateSlotsForService);
router.post("/bulk-generate", protect, authorize('admin'), bulkGenerateSlots);
router.patch("/:id/availability", protect, authorize('admin', 'staff'), toggleSlotAvailability);
router.delete("/:id", protect, authorize('admin'), deleteSlot);
router.get("/staff/:staffId", protect, authorize('admin', 'staff'), getStaffSlots);
router.get("/stats", protect, authorize('admin'), getSlotStats);

export default router;