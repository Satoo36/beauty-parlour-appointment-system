import RazorpayPkg from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";
import Staff from "../models/Staff.js";
import Slot from "../models/Slot.js";

const getRazorpayInstance = () => {
    const Razorpay = RazorpayPkg.default || RazorpayPkg;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay keys are missing");
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

const normalizeEmail = (value = "") => value.trim().toLowerCase();

const isBotUserId = (value) => {
    const botUserId = process.env.BOT_USER_ID;
    return Boolean(botUserId && value && value.toString() === botUserId.toString());
};

const extractCustomerDetailsFromNotes = (notes = "") => {
    if (typeof notes !== 'string' || !notes.trim()) {
        return { name: "", email: "" };
    }

    const nameMatch = notes.match(/Customer:\s*([^,]+?)(?:,\s*Email:|$)/i);
    const emailMatch = notes.match(/Email:\s*([^\s,]+)/i);

    return {
        name: nameMatch?.[1]?.trim() || "",
        email: normalizeEmail(emailMatch?.[1] || "")
    };
};

const findUserByEmail = async (email) => {
    const normalized = normalizeEmail(email);
    if (!normalized) {
        return null;
    }

    return User.findOne({ email: normalized }).select("_id name email phone");
};

const getAppointmentCustomerDetails = (appointment) => {
    const extracted = extractCustomerDetailsFromNotes(appointment?.notes);

    return {
        name: appointment?.customerName?.trim() || extracted.name || "",
        email: normalizeEmail(appointment?.customerEmail || "") || extracted.email || ""
    };
};

export const createOrder = async (req, res, next) => {
    try {
        if (req.body.appointmentId) {
            const appointment = await Appointment.findById(req.body.appointmentId);

            if (!appointment) {
                return res.status(404).json({ message: "Appointment not found" });
            }

            const razorpay = getRazorpayInstance();
            const appointmentCustomer = getAppointmentCustomerDetails(appointment);

            let paymentUserId = appointment.user;
            if (isBotUserId(paymentUserId)) {
                paymentUserId = null;
            }

            if (!paymentUserId && appointmentCustomer.email) {
                const matchedUser = await findUserByEmail(appointmentCustomer.email);
                if (matchedUser) {
                    paymentUserId = matchedUser._id;

                    if (!appointment.user || isBotUserId(appointment.user)) {
                        appointment.user = matchedUser._id;
                    }
                    if (!appointment.customerName) {
                        appointment.customerName = appointmentCustomer.name || matchedUser.name;
                    }
                    if (!appointment.customerEmail) {
                        appointment.customerEmail = appointmentCustomer.email || matchedUser.email;
                    }
                    await appointment.save();
                }
            }

            const order = await razorpay.orders.create({
                amount: Math.round(appointment.amount * 100),
                currency: "INR",
                receipt: `rcpt_${Date.now()}`
            });

            const chatbotPayment = await Payment.create({
                user: paymentUserId || null,
                appointment: appointment._id,
                razorpayOrderId: order.id,
                amount: appointment.amount,
                currency: "INR",
                status: "pending"
            });

            return res.status(200).json({
                orderId: order.id,
                amount: order.amount,
                key: process.env.RAZORPAY_KEY_ID,
                paymentId: chatbotPayment._id
            });
        }
        const { serviceId, staffId, date, slotTime, email } = req.body;

        if (!serviceId || !staffId || !date || !slotTime) {
            return res.status(400).json({ message: "Service, staff, date and slot time are required" });
        }

        // 1. Validate Service & Calculate Amount
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // 2. Validate Staff
        const staff = await Staff.findOne({ user: staffId }) || await Staff.findById(staffId);
        if (!staff) {
            // Try finding by user ID first, if not then by ID
            return res.status(404).json({ message: "Staff not found" });
        }

        // 3. Check Availability (Preliminary)
        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);

        // Check if slot document exists and is booked
        const existingSlot = await Slot.findOne({
            staff: staff.user || staffId,
            service: serviceId,
            date: queryDate,
            startTime: slotTime
        });

        if (existingSlot && existingSlot.isBooked) {
            return res.status(400).json({ message: "Slot is already booked. Please choose another time." });
        }

        // Also check if there is an appointment at this time (double check)
        const appointmentDate = new Date(date);
        const userIdForStaff = staff.user?.toString() || staff._id.toString();

        const existingAppointment = await Appointment.findOne({
            staff: userIdForStaff,
            date: queryDate,
            startTime: slotTime,
            status: { $ne: 'cancelled' }
        });

        if (existingAppointment) {
            return res.status(400).json({ message: "Slot is already booked by another user." });
        }

        const razorpay = getRazorpayInstance();
        const matchedUser = req.user || await findUserByEmail(email);

        const options = {
            amount: Math.round(service.price * 100),
            currency: 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-10)}`,
            notes: {
                userId: matchedUser?._id?.toString() || "guest",
                userEmail: matchedUser?.email || normalizeEmail(email) || "",
                serviceId: serviceId,
                staffId: staffId,
                date: date,
                slotTime: slotTime
            },
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        const payment = await Payment.create({
            user: matchedUser?._id,
            razorpayOrderId: order.id,
            amount: service.price,
            currency: 'INR',
            status: 'pending',
            createdAt: new Date()
        });

        return res.status(200).json({
            message: "Order created successfully",
            data: {
                order: {
                    id: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    receipt: order.receipt
                },
                paymentId: payment._id,
                key: process.env.RAZORPAY_KEY_ID,
                prefill: {
                    name: matchedUser?.name || req.user?.name || "Guest",
                    email: matchedUser?.email || normalizeEmail(email) || "",
                    contact: req.user?.phone || ""
                }
            }
        });

    } catch (err) {
        next(err);
    }
};

export const verifyPayment = async (req, res, next) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            service,
            staff,
            date,
            slot,
            slotTime,
            amount,
            notes,
            appointmentId,
            email
        } = req.body;

        console.log("--- Payment Verification Debug ---");
        console.log("req.user:", req.user);
        console.log("req.body:", req.body);

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.error("Missing Razorpay transaction details");
            return res.status(400).json({ message: "Razorpay order, payment, and signature are required" });
        }

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const expectedSignature = hmac.digest('hex');

        if (razorpay_signature !== expectedSignature) {
            console.error("Invalid payment signature", {
                received: razorpay_signature,
                expected: expectedSignature
            });
            return res.status(400).json({ message: "Invalid payment signature" });
        }
        console.log("Signature verified");

        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!payment) {
            console.error("Payment record not found in DB for order ID:", razorpay_order_id);
            return res.status(404).json({ message: "Payment record not found in system" });
        }

        let appointmentData = null;
        if (appointmentId) {
            appointmentData = await Appointment.findById(appointmentId);

            if (!appointmentData) {
                return res.status(404).json({ message: "Appointment not found" });
            }
        }

        const appointmentCustomer = getAppointmentCustomerDetails(appointmentData);
        const matchedUserByEmail = await findUserByEmail(email || appointmentCustomer.email);
        const paymentUser = payment.user && !isBotUserId(payment.user)
            ? await User.findById(payment.user).select("_id name email phone")
            : null;
        const appointmentUser = appointmentData?.user && !isBotUserId(appointmentData.user)
            ? await User.findById(appointmentData.user).select("_id name email phone")
            : null;

        const resolvedUser = (req.user && !isBotUserId(req.user._id) ? req.user : null)
            || paymentUser
            || appointmentUser
            || matchedUserByEmail;

        const userId = resolvedUser?._id || null;
        const customerEmail = normalizeEmail(email) || appointmentCustomer.email || normalizeEmail(resolvedUser?.email || "");
        const customerName = req.user?.name || appointmentCustomer.name || resolvedUser?.name || "";

        if (payment.status === 'completed') {
            const existingBooking = payment.appointment
                ? await Appointment.findById(payment.appointment)
                : await Appointment.findOne({ payment: payment._id });

            if (existingBooking) {
                let hasChanges = false;

                if (userId && (!existingBooking.user || isBotUserId(existingBooking.user))) {
                    existingBooking.user = userId;
                    hasChanges = true;
                }
                if (customerName && !existingBooking.customerName) {
                    existingBooking.customerName = customerName;
                    hasChanges = true;
                }
                if (customerEmail && !existingBooking.customerEmail) {
                    existingBooking.customerEmail = customerEmail;
                    hasChanges = true;
                }

                if (hasChanges) {
                    await existingBooking.save();
                }
            }

            return res.status(200).json({
                success: true,
                message: "Payment already processed",
                booking: existingBooking
            });
        }

        let actualStaffId;
        let serviceId;
        let bookingDate;
        let slotTimeFinal;

        if (appointmentData) {
            actualStaffId = appointmentData.staff;
            serviceId = appointmentData.service;
            bookingDate = appointmentData.date;
            slotTimeFinal = appointmentData.startTime;
        } else {
            actualStaffId = staff?._id || staff;
            serviceId = service?._id || service;
            bookingDate = date;
            slotTimeFinal = slotTime;
        }

        const staffDoc = await Staff.findById(actualStaffId) || await Staff.findOne({ user: actualStaffId });

        if (!staffDoc) {
            console.error("Staff profile not found during verification for ID:", actualStaffId);
            return res.status(404).json({ message: "Staff profile not found during verification" });
        }

        const staffUserId = staffDoc.user.toString();
        const queryDate = new Date(bookingDate);
        queryDate.setHours(0, 0, 0, 0);

        let slotDoc = null;
        if (slot) {
            const slotId = slot._id || slot;
            if (mongoose.Types.ObjectId.isValid(slotId)) {
                slotDoc = await Slot.findById(slotId);
            }
        }

        if (!slotDoc) {
            slotDoc = await Slot.findOne({
                staff: staffUserId,
                service: serviceId,
                date: queryDate,
                startTime: slotTimeFinal
            });
        }

        if (!slotDoc) {
            console.log("Slot not found, creating new slot dynamically...");
            const serviceDoc = await Service.findById(serviceId);
            if (!serviceDoc) {
                console.error("Service not found:", service);
                return res.status(404).json({ message: "Service not found during verification" });
            }
            const [hours, minutes] = (slotTimeFinal || "09:00").split(':').map(Number);
            const startDate = new Date(queryDate);
            startDate.setHours(hours, minutes, 0, 0);
            const endDate = new Date(startDate.getTime() + (serviceDoc.duration * 60000));
            const endTimeStr = endDate.toTimeString().slice(0, 5);

            slotDoc = await Slot.create({
                staff: staffUserId,
                service: serviceId,
                date: queryDate,
                startTime: slotTimeFinal || "09:00",
                endTime: endTimeStr,
                isAvailable: true,
                isBooked: false
            });
        }

        const slotReservedForCurrentAppointment = Boolean(
            appointmentData &&
            slotDoc.appointment &&
            slotDoc.appointment.toString() === appointmentData._id.toString()
        );

        if (slotDoc.isBooked && !slotReservedForCurrentAppointment) {
            console.error("Slot taken by another process");
            const razorpay = getRazorpayInstance();
            await razorpay.payments.refund(razorpay_payment_id, {
                notes: { reason: "Slot conflict during final verification" }
            });

            payment.status = 'refunded';
            payment.refundReason = 'Slot conflict during verification';
            await payment.save();

            return res.status(409).json({
                success: false,
                message: "This slot was just booked by someone else. A full refund has been initiated.",
                refunded: true
            });
        }

        console.log("Finalizing Booking in Database...");
        let appointment;
        try {
            if (appointmentData) {
                appointment = appointmentData;

                if (userId) {
                    appointment.user = userId;
                } else if (appointment.user && isBotUserId(appointment.user)) {
                    appointment.user = undefined;
                }

                appointment.customerName = customerName || appointment.customerName;
                appointment.customerEmail = customerEmail || appointment.customerEmail;
                appointment.service = serviceId;
                appointment.staff = staffUserId;
                appointment.slot = slotDoc._id;
                appointment.date = queryDate;
                appointment.startTime = slotDoc.startTime;
                appointment.endTime = slotDoc.endTime;
                appointment.amount = amount || payment.amount;
                appointment.status = 'pending';
                appointment.paymentStatus = 'paid';
                appointment.notes = typeof notes === 'string' && notes.trim() ? notes : appointment.notes;
                appointment.payment = payment._id;
                appointment.razorpayPaymentId = razorpay_payment_id;
                appointment.razorpayOrderId = razorpay_order_id;
                await appointment.save();
            } else {
                appointment = await Appointment.create({
                    user: userId,
                    customerName: customerName || undefined,
                    customerEmail: customerEmail || undefined,
                    service: serviceId,
                    staff: staffUserId,
                    slot: slotDoc._id,
                    date: queryDate,
                    startTime: slotDoc.startTime,
                    endTime: slotDoc.endTime,
                    amount: amount || payment.amount,
                    status: 'pending',
                    paymentStatus: 'paid',
                    notes: typeof notes === 'string' ? notes : '',
                    payment: payment._id,
                    razorpayPaymentId: razorpay_payment_id,
                    razorpayOrderId: razorpay_order_id
                });
            }
            console.log("Booking success! Appointment ID:", appointment._id);
        } catch (bookingError) {
            console.error("Mongoose booking error:", bookingError);
            return res.status(500).json({
                success: false,
                message: "Database failed to save booking: " + bookingError.message
            });
        }

        slotDoc.isBooked = true;
        slotDoc.isAvailable = false;
        slotDoc.appointment = appointment._id;
        await slotDoc.save();
        console.log("Slot updated to booked and linked to appointment");

        if (userId) {
            payment.user = userId;
        } else if (payment.user && isBotUserId(payment.user)) {
            payment.user = undefined;
        }
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = 'completed';
        payment.paidAt = new Date();
        payment.appointment = appointment._id;
        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Booking confirmed successfully",
            booking: appointment
        });

    } catch (err) {
        console.error("Unexpected error in verifyPayment:", err);
        return res.status(500).json({ success: false, message: "Internal server error during verification" });
    }
};

export const getPayment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const payment = await Payment.findById(id)
            .populate('appointment')
            .populate('user', 'name email phone avatar');

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (req.user.role !== 'admin' && payment.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to view this payment" });
        }

        return res.status(200).json({ data: payment });
    } catch (err) {
        next(err);
    }
};

export const getAllPayments = async (req, res, next) => {
    try {
        const { status, startDate, endDate } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime() || isNaN(end.getTime()))) {
                return res.status(400).json({ message: "Invalid date format" });
            }
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        const payments = await Payment.find(query)
            .populate('user', 'name email phone')
            .populate('appointment')
            .sort({ createdAt: -1 });

        const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const paidAmount = payments.filter(p => p.status === 'completed')
            .reduce((sum, payment) => sum + payment.amount, 0);

        return res.status(200).json({
            count: payments.length,
            totals: {
                totalAmount,
                paidAmount,
                pendingAmount: totalAmount - paidAmount
            },
            data: payments
        });
    } catch (err) {
        next(err);
    }
};

export const getUserPayments = async (req, res, next) => {
    try {
        const { status, limit = 20, page = 1 } = req.query;
        let query = { user: req.user._id };

        if (status) {
            query.status = status;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const payments = await Payment.find(query)
            .populate('appointment')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalPayments = await Payment.countDocuments(query);

        const totalSpent = await Payment.aggregate([
            { $match: { user: req.user._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        return res.status(200).json({
            count: payments.length,
            total: totalPayments,
            page: parseInt(page),
            pages: Math.ceil(totalPayments / parseInt(limit)),
            summary: {
                totalSpent: totalSpent[0]?.total || 0,
                totalPayments
            },
            data: payments
        });
    } catch (err) {
        next(err);
    }
};

export const initiateRefund = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paymentId, amount } = req.body;
        const targetId = id || paymentId;

        const payment = await Payment.findById(targetId);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({ message: "Only completed payments can be refunded" });
        }

        if (!payment.razorpayPaymentId) {
            return res.status(400).json({ message: "Razorpay Payment ID missing. Cannot initiate refund." });
        }

        // Determine refund amount (in rupees), default to full payment amount
        const refundAmountRupees = amount || payment.amount;
        // Razorpay expects amount in paise (1 rupee = 100 paise)
        const refundAmountPaise = Math.round(refundAmountRupees * 100);

        // Call Razorpay Refund API
        let razorpayRefund;
        try {
            const razorpay = getRazorpayInstance();
            razorpayRefund = await razorpay.payments.refund(payment.razorpayPaymentId, {
                amount: refundAmountPaise,
                notes: { reason: "Admin initiated refund" }
            });
            console.log("✅ Razorpay refund created:", razorpayRefund.id);
        } catch (rzpError) {
            console.error("❌ Razorpay refund error:", rzpError);
            const errMsg = rzpError?.error?.description || rzpError?.message || "Razorpay refund failed";
            return res.status(500).json({
                success: false,
                message: errMsg
            });
        }

        // Update payment record in database
        payment.status = 'refunded';
        payment.refundStatus = 'processed';
        payment.refundAmount = refundAmountRupees;
        payment.refundId = razorpayRefund?.id || null;
        payment.refundedAt = new Date();
        await payment.save();
        console.log("✅ Payment status updated to refunded");

        // Cancel associated appointment and release slot
        const appointment = await Appointment.findById(payment.appointment);
        if (appointment) {
            appointment.paymentStatus = 'refunded';
            appointment.status = 'cancelled';
            await appointment.save();
            console.log("✅ Appointment cancelled:", appointment._id);

            // Release the slot
            let slot = null;
            if (appointment.slot) {
                slot = await Slot.findById(appointment.slot);
            }

            if (!slot) {
                slot = await Slot.findOne({
                    staff: appointment.staff,
                    date: appointment.date,
                    startTime: appointment.startTime
                });
            }

            if (slot) {
                slot.isBooked = false;
                slot.appointment = null;
                await slot.save();
                console.log("✅ Slot released:", slot._id);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Refund processed successfully",
            data: payment
        });
    } catch (err) {
        console.error("❌ Refund controller error:", err);
        return res.status(500).json({
            success: false,
            message: err?.error?.description || err?.message || "Refund processing failed"
        });
    }
};

export const getPaymentStats = async (req, res, next) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        let matchQuery = {};

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ message: "Invalid date format" });
            }
            matchQuery.createdAt = { $gte: start, $lte: end };
        }

        const statusBreakdown = await Payment.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        const totalRevenueResult = await Payment.aggregate([
            {
                $match: {
                    ...matchQuery,
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalRefundsResult = await Payment.aggregate([
            {
                $match: {
                    ...matchQuery,
                    status: 'refunded'
                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: { $ifNull: ['$refundAmount', '$amount'] }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        let groupByFormat;
        switch (groupBy) {
            case 'day':
                groupByFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
                break;
            case 'week':
                groupByFormat = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
                break;
            case 'month':
                groupByFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
                break;
            default:
                groupByFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
        }

        const revenueTrends = await Payment.aggregate([
            {
                $match: {
                    ...matchQuery,
                    status: { $in: ['completed', 'refunded'] }
                }
            },
            {
                $group: {
                    _id: groupByFormat,
                    revenue: { $sum: '$amount' },
                    transactions: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
        ]);

        const formattedTrends = revenueTrends.map(item => {
            let label;
            if (groupBy === 'day') {
                label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
            } else if (groupBy === 'week') {
                label = `Week ${item._id.week}, ${item._id.year}`;
            } else {
                label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
            }

            return {
                period: label,
                revenue: item.revenue,
                transactions: item.transactions
            };
        });

        const stats = {
            summary: {
                totalRevenue: totalRevenueResult[0]?.total || 0,
                totalTransactions: totalRevenueResult[0]?.count || 0,
                totalRefunds: totalRefundsResult[0]?.total || 0,
                refundTransactions: totalRefundsResult[0]?.count || 0,
                netRevenue: (totalRevenueResult[0]?.total || 0) - (totalRefundsResult[0]?.total || 0)
            },
            statusBreakdown,
            revenueTrends: formattedTrends
        };

        return res.status(200).json({ data: stats });
    } catch (err) {
        next(err);
    }
};

export const webhookHandler = async (req, res, next) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (webhookSignature !== expectedSignature) {
            console.error("Invalid webhook signature");
            return res.status(400).json({ message: "Invalid webhook signature" });
        }

        const event = req.body.event;
        const payload = req.body.payload;
        console.log(`Processing webhook event ${event}`);

        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload.payment.entity);
                break;
            case 'payment.failed':
                await handlePaymentFailed(payload.payment.entity);
                break;
            case 'refund.processed':
                await handleRefundProcessed(payload.payment.entity);
                break;
            case 'order.paid':
                await handleOrderPaid(payload.payment.entity);
                break;
            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        next(error);
    }
};

const handlePaymentCaptured = async (paymentEntity) => {
    try {
        const payment = await Payment.findOne({ razorpayPaymentId: paymentEntity.id });
        if (!payment) {
            const paymentByOrder = await Payment.findOne({ razorpayOrderId: payment.order_id });
            if (paymentByOrder) {
                paymentByOrder.razorpayPaymentId = paymentEntity.id;
                paymentByOrder.status = 'completed';
                paymentByOrder.paidAt = new Date(paymentEntity.created_at * 1000);
                await paymentByOrder.save();

                const appointment = await Appointment.findById(paymentByOrder.appointment);
                if (appointment) {
                    appointment.paymentStatus = 'paid';
                    await appointment.save();
                }
            }
        } else if (payment.status !== 'completed') {
            payment.status = 'completed';
            payment.paidAt = new Date(paymentEntity.created_at * 1000);
            await payment.save();

            const appointment = await Appointment.findById(payment.appointment);
            if (appointment) {
                appointment.paymentStatus = 'paid';
                await appointment.save();
            }
        }
    } catch (error) {
        console.error("Error handling payment captured:", error);
    }
};

const handlePaymentFailed = async (paymentEntity) => {
    try {
        const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
        if (payment) {
            payment.status = 'failed';
            payment.failureReason = paymentEntity.error_description || 'payment failed';
            await payment.save();

            const appointment = await Appointment.findById(payment.appointment);
            if (appointment) {
                appointment.paymentStatus = 'failed';
                await appointment.save();
            }
        }
    } catch (error) {
        console.error("Error handling payment failed:", error);
    }
};

const handleRefundProcessed = async (refundEntity) => {
    try {
        const payment = await Payment.findOne({ razorpayPaymentId: refundEntity.payment_id });
        if (payment) {
            payment.refundStatus = 'refunded';
            payment.refundId = refundEntity.id;
            payment.refundAmount = refundEntity.amount / 100;
            payment.refundedAt = new Date(refundEntity.created_at * 1000);
            await payment.save();

            const appointment = await Appointment.findById(payment.appointment);
            if (appointment) {
                appointment.paymentStatus = 'refunded';
                await appointment.save();
            }
        }
    } catch (error) {
        console.error("Error handling refund processed:", error);
    }
};

export const checkPaymentStatus = async (req, res, next) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (req.user.role === 'admin' && payment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorised to check this payment status" });
        }

        if (payment.razorpayPaymentId && payment.status === 'pending') {
            try {
                const razorpay = getRazorpayInstance();
                const razorpayPayment = await razorpay.payments.fetch(payment.razorpayPaymentId);
                if (razorpayPayment.status === 'captured') {
                    payment.status = 'completed';
                    payment.paidAt = new Date();
                    await payment.save();

                    const appointment = await Payment.findById(payment.appointment);
                    if (appointment) {
                        appointment.paymentStatus = 'paid';
                        await appointment.save();
                    }
                }
            } catch (error) {
                console.error("Error verifying payment with Razorpay:", error);
            }
        }
        return res.status(200).json({
            data: {
                status: payment.status,
                paymentId: payment._id,
                amount: payment.amount,
                createdAt: payment.createdAt,
                paidAt: payment.paidAt,
                refundStatus: payment.refundStatus
            }
        });
    } catch (err) {
        next(err);
    }
};

export const exportPaymentsCSV = async (req, res, next) => {
    try {
        const { status, startDate, endDate, search } = req.query;

        let query = {};
        if (status) query.status = status;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { razorpayOrderId: searchRegex },
                { razorpayPaymentId: searchRegex }
            ];
        }

        const payments = await Payment.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        // Generate CSV content
        let csv = 'Payment ID,User,Email,Amount,Status,Date,Razorpay ID\n';
        payments.forEach(p => {
            const dateStr = p.createdAt ? p.createdAt.toISOString() : 'N/A';
            csv += `${p._id},"${p.user?.name || 'Deleted User'}","${p.user?.email || 'N/A'}",${p.amount},${p.status},${dateStr},${p.razorpayPaymentId || 'N/A'}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=payments-${new Date().getTime()}.csv`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        return res.status(200).send(csv);
    } catch (err) {
        next(err);
    }
};

export const generateInvoicePDF = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id).populate('user', 'name email');

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        // For simplicity, we send a dynamic text/plain PDF-like content
        // In a real app, use PDFKit or Puppeteer
        const content = `
            INVOICE
            -------------------
            Payment ID: ${payment._id}
            Customer: ${payment.user?.name || 'N/A'}
            Email: ${payment.user?.email || 'N/A'}
            Amount: INR ${payment.amount}
            Status: ${payment.status}
            Date: ${payment.createdAt.toDateString()}
            Razorpay ID: ${payment.razorpayPaymentId || 'N/A'}
            -------------------
            Thank you for your business!
        `;

        res.setHeader('Content-Type', 'text/plain'); // Sending as text but named .pdf for download
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.txt`);
        return res.status(200).send(content);
    } catch (err) {
        next(err);
    }
};

