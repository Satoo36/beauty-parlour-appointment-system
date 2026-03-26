import mongoose from "mongoose";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Slot from "../models/Slot.js";
import Queue from "../models/Queue.js";
import Staff from "../models/Staff.js";
import Service from "../models/Service.js";
import { sendQueueUpdate } from "../utils/notification.js";

export const createAppointment = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { service, staff, slot, date, notes } = req.body;

        if (!service || !staff || !slot || !date) {
            return res.status(400).json({ message: "Service, staff, slot and date are required." });
        }

        const slotData = await Slot.findById(slot).populate('service');

        if (!slotData) {
            return res.status(404).json({ message: "Slot not found" });
        }

        if (slotData.isBooked) {
            return res.status(400).json({ message: "This slot is already booked" });
        }

        if (!slotData.isAvailable) {
            return res.status(400).json({ message: "This slot is not available" });
        }

        const appointmentDate = new Date(date);
        if (isNaN(appointmentDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        // Resolve actual staff User ID
        let staffUserId = staff._id || staff;
        const staffDoc = await Staff.findById(staffUserId) || await Staff.findOne({ user: staffUserId });
        if (staffDoc) {
            staffUserId = staffDoc.user;
        }

        const appointment = await Appointment.create({
            user: user._id,
            service,
            staff: staffUserId,
            slot,
            date: appointmentDate,
            startTime: slotData.startTime,
            endTime: slotData.endTime,
            amount: slotData.service?.price || 0,
            notes: notes ? notes.trim() : '',
            status: 'confirmed',
            paymentStatus: 'pending'
        });

        slotData.isBooked = true;
        slotData.appointment = appointment._id;
        await slotData.save();

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('user', 'name email phone avatar')
            .populate('service', 'name duration price category')
            .populate('staff', 'name email avatar')
            .populate('slot', 'startTime endTime');

        return res.status(201).json({ message: "Appointment booked successfully", data: populatedAppointment });
    } catch (err) {
        next(err);
    }
};

export const getAllAppointments = async (req, res, next) => {
    try {
        const { status, date, service, paymentStatus, upcoming, page = 1, limit = 10, staff } = req.query;
        let query = {};

        // Always filter by user for regular users
        if (req.user.role === 'user') {
            query.user = req.user._id;
        } else if (req.user.role === 'staff') {
            query.staff = req.user._id;
        } else if (staff) {
            if (mongoose.Types.ObjectId.isValid(staff)) {
                query.staff = new mongoose.Types.ObjectId(staff);
            } else {
                console.warn("Invalid staff ID provided to getAllAppointments:", staff);
            }
        }

        if (upcoming === 'true') {
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Start of today
            query.date = { $gte: now };
            query.status = 'confirmed';
        }

        if (status) {
            query.status = status.trim();
        }

        if (date) {
            // Parse YYYY-MM-DD format correctly to avoid timezone shifts
            const [year, month, day] = date.split('-').map(Number);
            const start = new Date(year, month - 1, day, 0, 0, 0, 0);
            const end = new Date(year, month - 1, day, 23, 59, 59, 999);

            query.date = { $gte: start, $lte: end };
        }

        if (service) {
            query.service = service.trim();
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus.trim();
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const appointments = await Appointment.find(query)
            .populate('user', 'name email phone avatar')
            .populate('service', 'name duration price category')
            .populate('staff', 'name email avatar phone') // Added phone
            .populate('slot', 'startTime endTime')
            .sort({ date: upcoming === 'true' ? 1 : -1, startTime: upcoming === 'true' ? 1 : -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Appointment.countDocuments(query);

        // Calculate active appointments count for user
        let activeCount = 0;
        if (req.user.role === 'user') {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            activeCount = await Appointment.countDocuments({
                user: req.user._id,
                status: 'confirmed',
                date: { $gte: now }
            });
        }

        return res.status(200).json({
            count: appointments.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            activeCount,
            data: appointments
        });
    } catch (err) {
        next(err);
    }
};

export const getAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findById(id)
            .populate('user', 'name email phone avatar')
            .populate('service', 'name duration price category description')
            .populate('staff', 'name email avatar')
            .populate('slot', 'startTime endTime');

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (req.user.role === 'user' && appointment.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to access this appointment" });
        }

        if (req.user.role === 'staff' && appointment.staff.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to access this appointment" });
        }

        return res.status(200).json({ data: appointment });
    } catch (err) {
        next(err);
    }
};

export const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.status === 'cancelled' && status !== 'cancelled') {
            return res.status(400).json({ message: "Cannot change status of a cancelled appointment" });
        }

        const oldStatus = appointment.status;
        appointment.status = status;
        await appointment.save();

        // Sync with Slot model
        if (status === 'confirmed' || status === 'cancelled') {
            let slot = null;
            if (appointment.slot) {
                slot = await Slot.findById(appointment.slot);
            }

            if (!slot) {
                // Find matching slot by staff and exact date
                slot = await Slot.findOne({
                    staff: appointment.staff, // This might need a check if Slot.staff is User or Profile ID
                    date: appointment.date, // Exact Date object match
                    startTime: appointment.startTime
                });
            }

            if (slot) {
                if (status === 'confirmed') {
                    slot.isBooked = true;
                    slot.appointment = appointment._id;
                } else if (status === 'cancelled') {
                    slot.isBooked = false;
                    slot.appointment = null;
                }
                await slot.save();
            }
        }

        if (status === 'completed') {
            const queue = await Queue.findOne({
                service: appointment.service,
                staff: appointment.staff,
                date: appointment.date,
                isActive: true
            });

            if (queue) {
                const aptIndex = queue.appointments.findIndex(
                    apt => apt.appointment.toString() === appointment._id.toString()
                );

                if (aptIndex !== -1) {
                    queue.appointments[aptIndex].status = 'completed';

                    const nextInQueue = queue.appointments.find(apt => apt.status === 'waiting');

                    if (nextInQueue) {
                        queue.currentServing = nextInQueue.appointment;
                        nextInQueue.status = 'in-progress';
                    } else {
                        queue.currentServing = null;
                    }

                    await queue.save();

                    const io = req.app.get('io');
                    if (io) {
                        sendQueueUpdate(io, queue._id, { queue, message: "Next customer is being served" });
                    }
                }
            }
        }

        const updateAppointment = await Appointment.findById(appointment._id)
            .populate('user', 'name email phone')
            .populate('service', 'name duration price')
            .populate('staff', 'name email avatar');

        return res.status(200).json({ message: "Appointment status updated", data: updateAppointment });
    } catch (err) {
        next(err);
    }
};

export const cancelAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const cancellationReason = req.body?.cancellationReason || '';

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Check ownership
        if (req.user.role === 'user' && appointment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to cancel this appointment" });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({ message: "Cannot cancel a completed appointment" });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ message: "Appointment is already cancelled" });
        }

        // Check if within 2 hours of start time (if user is cancelling)
        if (req.user.role === 'user') {
            const appointmentTime = new Date(appointment.date);
            const [hours, minutes] = appointment.startTime.split(':');
            appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const now = new Date();
            const diffMs = appointmentTime - now;
            const diffHrs = diffMs / (1000 * 60 * 60);

            if (diffHrs < 2 && diffHrs >= 0) {
                return res.status(400).json({ message: "Appointments cannot be cancelled within 2 hours of start time" });
            }
        }

        appointment.status = 'cancelled';
        appointment.cancellationReason = cancellationReason ? cancellationReason.trim() : '';
        await appointment.save();

        // Release the slot
        let slot = null;
        if (appointment.slot) {
            slot = await Slot.findById(appointment.slot);
        }

        if (slot) {
            slot.isBooked = false;
            slot.appointment = null;
            await slot.save();
        }

        return res.status(200).json({ message: "Appointment cancelled successfully", data: appointment });
    } catch (err) {
        next(err);
    }
};

export const addReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, review } = req.body;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.user.toString() !== req.user._id.toString()) {
            return res.status(400).json({ message: "Not authorized" });
        }

        if (appointment.status !== 'completed') {
            return res.status(400).json({ message: "Can only review completed appointments" });
        }

        appointment.rating = Number(rating);
        appointment.review = review ? review.trim() : '';
        await appointment.save();

        const staff = await User.findById(appointment.staff);
        if (staff) {
            // This review logic might need to find Staff profile if rating is stored there
            const staffProfile = await Staff.findOne({ user: appointment.staff });
            if (staffProfile) {
                const currentTotal = staffProfile.rating * staffProfile.totalRatings;
                staffProfile.totalRatings += 1;
                staffProfile.rating = (currentTotal + appointment.rating) / staffProfile.totalRatings;
                await staffProfile.save();
            }
        }

        return res.status(200).json({ message: "Review added successfully" });
    } catch (err) {
        next(err);
    }
};

export const getAppointmentStats = async (req, res, next) => {
    try {
        const { startDate, endDate, staffId } = req.query;
        let matchQuery = {};

        // Ownership filter
        if (req.user.role === 'user') {
            matchQuery.user = req.user._id;
        } else if (req.user.role === 'staff') {
            matchQuery.staff = req.user._id;
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ message: "Invalid date format" });
            }
            matchQuery.date = { $gte: start, $lte: end };
        }

        if (staffId && (req.user.role === 'admin' || req.user.role === 'staff')) {
            matchQuery.staff = new mongoose.Types.ObjectId(staffId);
        }

        // Status breakdown
        const statusBreakdown = await Appointment.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$amount' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const totalAppointments = await Appointment.countDocuments(matchQuery);

        // Today's stats
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const completedToday = await Appointment.countDocuments({
            ...matchQuery,
            status: 'completed',
            date: { $gte: todayStart, $lte: todayEnd }
        });

        const activeAppointments = await Appointment.countDocuments({
            ...matchQuery,
            status: 'confirmed',
            date: { $gte: todayStart }
        });

        // Revenue is only relevant for non-users or specific scenarios
        let totalRevenue = 0;
        if (req.user.role !== 'user') {
            const totalRevenueResult = await Appointment.aggregate([
                { $match: { ...matchQuery, paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            totalRevenue = totalRevenueResult[0]?.total || 0;
        }

        return res.status(200).json({
            data: {
                totalAppointments,
                totalRevenue,
                statusBreakdown,
                completedToday,
                activeAppointments
            }
        });
    } catch (err) {
        next(err);
    }
};