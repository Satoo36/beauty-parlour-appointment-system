import express from "express";
import { getAllUsers, getUser, updateUser, deleteUser, getUserStats, updateUserRole } from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats", protect, authorize('admin'), getUserStats);
router.get("/", protect, authorize('admin'), getAllUsers);
router.get("/:id", protect, authorize('admin'), getUser);
router.put("/:id", protect, authorize('admin'), updateUser);
router.delete("/:id", protect, authorize('admin'), deleteUser);
router.patch("/:id/role", protect, authorize('admin'), updateUserRole);

export default router;