import express from "express";
import { register, login, googleAuthCallback, getMe, updateProfile, logout, forgotPassword, resetPassword } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import passport from "passport";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    googleAuthCallback
);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/logout", protect, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router; 
