import express from "express";
import { getAllServices, getService, createService, updateService, deleteService, toggleServices, getServicesByStaff, getCategories } from "../controllers/serviceController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllServices);
router.get("/categories/list", getCategories);
router.get("/staff/:staffId", getServicesByStaff);
router.get("/:id", getService);
router.post("/", protect, authorize('admin'), createService);
router.put("/:id", protect, authorize('admin'), updateService);
router.patch("/:id/toggle-status", protect, authorize('admin'), toggleServices);
router.delete("/:id", deleteService);

export default router;