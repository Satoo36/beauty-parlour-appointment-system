import User from "../models/User.js";
import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Payment from "../models/Payment.js";

export const getAllUsers = async (req, res, next) => {
    try {
        const { role, isActive, search } = req.query;

        let query = {};
        if (role && role !== 'All' && role !== "") {
            query.role = role.trim();
        }
        if (isActive !== undefined && isActive !== "" && isActive !== 'All') {
            query.isActive = isActive === 'true';
        }
        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { name: { $regex: searchRegex } },
                { email: { $regex: searchRegex } },
                { phone: { $regex: searchRegex } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        // Enforce Activity Metrics Calculation on Backend
        const usersWithActivity = await Promise.all(users.map(async (u) => {
            const visitCount = await Appointment.countDocuments({
                user: u._id,
                status: "completed"
            });

            const paymentResult = await Payment.aggregate([
                { $match: { user: u._id, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const userObj = u.toObject();
            userObj.visits = visitCount;
            userObj.spent = paymentResult[0]?.total || 0;
            return userObj;
        }));

        return res.status(200).json(usersWithActivity);
    } catch (err) {
        console.error("Error in getAllUsers:", err);
        next(err);
    }
};

export const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({ meesage: "User not found" });
        }

        return res.status(200).json({ data: user });
    } catch (err) {
        next(err);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, isActive } = req.body;

        const user = await User.findById(id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
        }

        if (email && email !== user.email) {
            const sanitizedEmail = email.toLowerCase().trim();
            const emailExists = await User.findOne({
                email: sanitizedEmail,
                id: { $ne: id }
            });

            if (emailExists) {
                return res.status(409).json({ message: "Email already in use" });
            }
        }

        if (name !== undefined) user.name = name.trim();
        if (email !== undefined) user.email = email.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (role !== undefined) user.role = role.trim();
        if (isActive !== undefined) user.isActive = isActive;
        await user.save();

        return res.status(200).json({
            message: "User updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (err) {
        next(err);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (req.user && req.user._id && req.user._id.toString() === id) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        await user.deleteOne();

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        next(err);
    }
};

export const getUserStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const inActiveUsers = totalUsers - activeUsers;

        const usersByRole = await User.aggregate([
            {
                $group: { _id: '$role', count: { $sum: 1 } }
            },
            { $sort: { _id: 1 } }
        ]);

        const recentUsers = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
                $project: {
                    _id: 0,
                    period: {
                        $concat: [
                            { $toString: '$_id.year' },
                            '-',
                            { $toString: '$_id.month' }
                        ]
                    },
                    count: 1
                }
            }
        ]);

        const stats = { totalUsers, activeUsers, inActiveUsers, usersByRole, recentUsers, monthlyGrowth };
        return res.status(200).json({ data: stats });
    } catch (err) {
        next(err);
    }
};

export const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ message: "Role is required" });
        }

        const validRoles = ['user', 'staff', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` })
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (req.user && req.user._id && req.user._id.toString() === id) {
            return res.status(400).json({ message: "You cannot change your own rule" });
        }

        user.role = role.trim();
        await user.save();

        return res.status(200).json({
            message: `User role updated to ${role}`,
            data: {
                id: user._id,
                role: user.role,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        next(err);
    }
};