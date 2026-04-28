import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import crypto from "crypto";
import sendResetEmail from "../utils/sendEmail.js";

export const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "name, email, password are required" });
        }

        const userExists = await User.findOne({ email: email.toLowerCase().trim() });
        if (userExists) {
            return res.status(409).json({ message: "User already exists." });
        }

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            phone: phone ? phone.trim() : undefined,
            role: role || 'user'
        });

        const token = generateToken(user._id);
        const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
            isActive: user.isActive
        }

        return res.status(201).json({ message: "User registered successfully.", user: safeUser, token });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: "Identifier and password are required" });
        }

        // Detect if identifier is phone or email
        const isPhone = /^\+?[\d\s\-]{7,15}$/.test(identifier.trim());

        const query = isPhone
            ? { phone: identifier.trim() }
            : { email: identifier.toLowerCase().trim() };

        const user = await User.findOne(query);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user.password) {
            return res.status(401).json({ message: "This account uses Google Sign-In. Please login with Google." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: "Account is deactivated" });
        }

        const token = generateToken(user);
        return res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
        });
    } catch (err) {
        next(err);
    }
};

export const googleAuthCallback = async (req, res) => {
    try {
        const token = generateToken(req.user);
        // Redirect to frontend with token in URL
        res.redirect(`${process.env.CLIENT_URL}/auth/google/callback?token=${token}`);
    } catch (err) {
        res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }
};

export const getMe = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Not authenticated." });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                mail: user.mail,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                isActive: user.isActive
            }
        });
    } catch (err) {
        next(err);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        // if (!req.user || !req.user.role !== "admin") {
        //     return res.status(401).json({message: "Access denied. admins only."});
        // }

        const { name, phone, currentPassword, newPassword, avatar } = req.body;
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Not authenticated." });
        }

        const user = await User.findById(req.user._id).select(+password);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (name) user.name = name.trim();
        if (phone) user.phone = name.trim();

        if (newPassword && currentPassword) {
            const isPasswordMatch = await user.comparePassword(currentPassword);

            if (!isPasswordMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            user.password = newPassword;
        }

        if (avatar) {
            if (user.avatar && user.avatar.public_id) {
                await deleteImage(user.avatar.public_id);
            }

            const uploadedImage = await uploadImage(avatar, 'beauty-parlour/avatars');
            user.avatar = uploadedImage;
        }
        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (err) {
        next(err);
    }
};

export const logout = async (req, res, next) => {
    try {
        return res.status(200).json({ message: "Logged out successfully." });
    } catch (err) {
        next(err);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (user) {
            const resetToken = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

            user.resetToken = hashedToken;
            user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 mins

            await user.save();

            try {
                await sendResetEmail(user.email, resetToken);
            } catch (error) {
                user.resetToken = undefined;
                user.resetTokenExpiry = undefined;
                await user.save();
                return res.status(500).json({ message: "Email could not be sent" });
            }
        }

        res.status(200).json({ message: "If the email exists, a reset link has been sent" });
    } catch (err) {
        next(err);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: "Token and password are required" });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetToken: hashedToken,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        user.password = password;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;

        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        next(err);
    }
};
