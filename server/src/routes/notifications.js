import express from "express";
import { broadcastNotification } from "../controllers/notificationController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/broadcast", protect, authorize('admin'), broadcastNotification);

export default router;
