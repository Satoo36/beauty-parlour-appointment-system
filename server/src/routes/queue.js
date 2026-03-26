import express from "express";
import { joinQueue, getQueue, checkQueuePosition, callNextCustomer, removeFromQueue, getActiveQueues, closeQueue } from "../controllers/queueController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/join", protect, joinQueue);
router.get("/active/today", protect, authorize('staff', 'admin'), getActiveQueues);
router.get("/:id", getQueue);
router.get("/check/:appointmentId", protect, checkQueuePosition);
router.put("/:id/next", protect, authorize('staff', 'admin'), callNextCustomer);
router.put("/:id", protect, authorize('staff', 'admin'), closeQueue);
router.delete("/:queueId/remove/:appointmentId", protect, removeFromQueue);

export default router;