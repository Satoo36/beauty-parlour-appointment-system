import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

export const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({message: "name, email, password are required"});
        }

        const userExists = await User.findOne({email: email.toLowerCase().trim()});
        if (userExists) {
            return res.status(409).json({message: "User already exists."});
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

        return res.status(201).json({message: "User registered successfully.", user: safeUser, token});
    } catch(err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(400).json({message: "please provide email and password."});
        }

        const user = await User.findOne({email: email.toLowerCase().trim()}).select(+password);
        if (!user) {
            return res.status(401).json({message: "Invalid credentials."});
        }
        
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({message: "Invalid credentials."});
        }

        if(!user.isActive) {
            return res.status(401).json({message: "Your account has been deactivated"});
        }

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

        return res.status(200).json({message: "Login successful", user: safeUser, token});
    } catch(err) {
        next(err);
    }
};

export const getMe = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({message: "Not authenticated."});
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({message: "User not found."});
        }

        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                mail: user.mail,
                phone:user.phone,
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

        const {name, phone, currentPassword, newPassword, avatar} = req.body;
        if (!req.user || !req.user._id) {
            return res.status(401).json({message: "Not authenticated."});
        }

        const user = await User.findById(req.user._id).select(+password);
        if (!user) {
            return res.status(404).json({message: "User not found."});
        }

        if(name) user.name = name.trim();
        if(phone) user.phone = name.trim();

        if (newPassword && currentPassword) {
            const isPasswordMatch = await user.comparePassword(currentPassword);

            if(!isPasswordMatch) {
                return res.status(400).json({message: "Current password is incorrect"});
            }
            user.password = newPassword;
        }

        if(avatar) {
            if(user.avatar && user.avatar.public_id) {
                await deleteImage(user.avatar.public_id);
            }

            const uploadedImage = await uploadImage(avatar, 'beauty-parlour/avatars');
            user.avatar = uploadedImage;
        }
        await user.save();

        return res.status(200).json({message: "Profile updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch(err) {
        next(err);
    }
};

export const logout = async (req, res, next) => {
    try {
        return res.status(200).json({message: "Logged out successfully."});
    } catch(err) {
        next(err);
    }
};