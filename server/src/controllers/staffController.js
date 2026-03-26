import Staff from "../models/Staff.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import mongoose from "mongoose";

export const getAllStaff = async (req, res, next) => {
    try {
        const { service, isAvailable } = req.query;
        let query = {};

        if (service) {
            query.services = service.trim();
        }
        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable === 'true';
        }

        const staff = await Staff.find(query)
            .populate('user', 'name email phone avatar isActive')
            .populate('services', 'name duration price category')
            .sort({ createdAt: -1 });

        const activeStaff = staff.filter(s => s.user && s.user.isActive);

        return res.status(200).json({ count: activeStaff.length, data: activeStaff });
    } catch (err) {
        next(err);
    }
};

export const getStaff = async (req, res, next) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findOne({ user: id })
            .populate('user', 'name email phone avatar')
            .populate('staff', 'name duration price category description');

        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        // Add performance metrics
        const stats = await mongoose.model('Appointment').aggregate([
            { $match: { staff: staff.user._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' }
                }
            }
        ]);

        const performance = {
            totalAppointments: stats.reduce((acc, curr) => acc + curr.count, 0),
            completed: stats.find(s => s._id === 'completed')?.count || 0,
            cancelled: stats.find(s => s._id === 'cancelled')?.count || 0,
            revenue: stats.filter(s => s._id === 'completed' || s.paymentStatus === 'paid').reduce((acc, curr) => acc + curr.revenue, 0)
        };

        return res.status(200).json({ data: { ...staff.toObject(), performance } });
    } catch (err) {
        next(err);
    }
};

export const createStaff = async (req, res, next) => {
    try {
        const { userId, email, name, password, phone, specialization, experience, services, workingHours } = req.body;

        let finalUserId = userId;

        // If no userId but email/name provided, create new user
        if (!userId && email && name) {
            const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
            if (existingUser) {
                return res.status(409).json({ message: "User with this email already exists." });
            }

            const newUser = await User.create({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: password || 'Staff@123', // Default password if not provided
                phone: phone || '',
                role: 'staff',
                isActive: true
            });
            finalUserId = newUser._id;
        }

        if (!finalUserId) {
            return res.status(400).json({ message: "User ID or User details (name, email) are required." });
        }

        const user = await User.findById(finalUserId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingStaff = await Staff.findOne({ user: finalUserId });
        if (existingStaff) {
            return res.status(409).json({ message: "Staff profile already exists for this user" });
        }

        if (user.role !== 'staff') {
            user.role = 'staff';
            await user.save();
        }

        let formattedSpecialization = [];
        if (Array.isArray(specialization)) {
            formattedSpecialization = specialization.map(item => item.trim());
        } else if (typeof specialization === 'string') {
            formattedSpecialization = specialization.split(",").map(item => item.trim());
        }

        const staff = await Staff.create({
            user: finalUserId,
            specialization: formattedSpecialization,
            experience: experience ? Number(experience) : 0,
            services: services || [],
            workingHours: workingHours,
            isAvailable: true,
            rating: 0,
            totalRatings: 0
        });

        const populatedStaff = await Staff.findById(staff._id)
            .populate('user', 'name email phone avatar')
            .populate('services', 'name duration price category');

        return res.status(201).json({ success: true, message: "Staff profile created successfully", data: populatedStaff });
    } catch (err) {
        next(err);
    }
};

export const updateStaff = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { specialization, experience, services, workingHours, isAvailable } = req.body;

        // Try finding by Staff ID first, then by User ID for backward compatibility
        let staff = await Staff.findById(id);
        if (!staff) {
            staff = await Staff.findOne({ user: id });
        }

        if (!staff) {
            return res.status(404).json({ message: "Staff profile not found" });
        }

        console.log(`Updating staff: ${staff._id}`);

        if (req.user.role === 'staff' && staff.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this profile" });
        }

        if (specialization !== undefined) {
            if (Array.isArray(specialization)) {
                staff.specialization = specialization.map(item => item.trim());
            } else if (typeof specialization === 'string') {
                staff.specialization = specialization.split(",").map(item => item.trim());
            }
        }
        if (experience !== undefined) staff.experience = Number(experience);
        if (services !== undefined) staff.services = services;
        if (workingHours !== undefined && typeof workingHours === "object") {
            staff.workingHours = workingHours;
        }
        if (isAvailable !== undefined) staff.isAvailable = isAvailable;

        await staff.save();

        const populatedStaff = await Staff.findById(staff._id)
            .populate('user', 'name email phone avatar')
            .populate('services', 'name duration price category');

        return res.status(200).json({ message: 'Staff profile updated successfully', data: populatedStaff });
    } catch (err) {
        console.error("Error in updateStaff:", err);
        next(err);
    }
};

export const deleteStaff = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Try finding by Staff ID first, then by User ID
        let staff = await Staff.findById(id);
        if (!staff) {
            staff = await Staff.findOne({ user: id });
        }

        if (!staff) {
            return res.status(404).json({ message: "Staff profile not found" });
        }

        console.log(`Deleting staff profile: ${staff._id} (User: ${staff.user})`);
        await staff.deleteOne();

        return res.status(200).json({ message: "Staff profile deleted successfully" });
    } catch (err) {
        console.error("Error in deleteStaff:", err);
        next(err);
    }
};

export const getStaffSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        let dateQuery = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
            }

            dateQuery = { date: { $gte: start, $lte: end } };
        }

        let actualStaffId = id;
        let staffDoc = await Staff.findById(id);
        if (!staffDoc) {
            staffDoc = await Staff.findOne({ user: id });
            if (staffDoc) actualStaffId = staffDoc._id;
        }

        const appointments = await Appointment.find({
            staff: actualStaffId, ...dateQuery, status: { $nin: ['cancelled'] }
        })
            .populate('user', 'name phone')
            .populate('service', 'name duration')
            .sort({ date: 1, startTime: 1 });

        return res.status(200).json({ count: appointments.length, data: appointments });
    } catch (err) {
        next(err);
    }
};

export const updateStaffRating = async (staffId, rating) => {
    try {
        const staff = await Staff.findById(staffId);

        if (!staff) {
            throw new Error("Staff not found");
        }

        const currentTotal = staff.rating * staff.totalRatings;
        staff.totalRatings += 1;
        staff.rating = (currentTotal + rating) / staff.totalRatings;

        await staff.save();
        return staff;
    } catch (error) {
        console.error("Error updating staff rating:", error);
        throw error;
    }
};

// Staff Dashboard Endpoints

export const getStaffAppointments = async (req, res, next) => {
    try {
        const { status, timeframe } = req.query;
        const userId = req.user._id;

        let query = { staff: userId };

        if (status && status !== 'All') {
            query.status = status.toLowerCase();
        }

        if (timeframe === 'Today') {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            // Use range match to be safe
            query.date = { $gte: start, $lte: end };
        }

        const appointments = await Appointment.find(query)
            .populate('user', 'name email phone avatar')
            .populate('service', 'name duration price category')
            .sort({ date: 1, startTime: 1 });

        return res.status(200).json({ success: true, count: appointments.length, data: appointments });
    } catch (err) {
        next(err);
    }
};

export const getStaffSummary = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const stats = await Appointment.aggregate([
            { $match: { staff: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayCount = await Appointment.countDocuments({
            staff: userId,
            date: { $gte: todayStart, $lte: todayEnd }
        });

        const summary = {
            total: stats.reduce((acc, curr) => acc + curr.count, 0),
            today: todayCount,
            pending: stats.find(s => s._id === 'pending')?.count || 0,
            completed: stats.find(s => s._id === 'completed')?.count || 0,
            confirmed: stats.find(s => s._id === 'confirmed')?.count || 0
        };

        return res.status(200).json({ success: true, data: summary });
    } catch (err) {
        next(err);
    }
};

export const updateStaffAppointmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        if (req.user.role !== 'admin' && appointment.staff.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to update this appointment" });
        }

        appointment.status = status;
        await appointment.save();

        return res.status(200).json({ success: true, message: `Appointment marked as ${status}`, data: appointment });
    } catch (err) {
        next(err);
    }
};