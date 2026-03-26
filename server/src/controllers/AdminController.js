import User from "../models/User.js";
import Staff from "../models/Staff.js";
import Appointment from "../models/Appointment.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";
import Slot from "../models/Slot.js";
import mongoose from "mongoose";

export const getAdminSummary = async (req, res, next) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Run aggregations in parallel
        const [
            userStats,
            staffStats,
            appointmentStats,
            slotStats,
            paymentStats,
            serviceStats
        ] = await Promise.all([
            // User stats
            User.aggregate([
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        activeUsers: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } }
                    }
                }
            ]),
            // Staff stats
            Staff.countDocuments(),
            // Appointment stats
            Appointment.aggregate([
                {
                    $facet: {
                        totals: [
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: 1 }
                                }
                            }
                        ],
                        completedToday: [
                            {
                                $match: {
                                    status: "completed",
                                    date: { $gte: todayStart, $lte: todayEnd }
                                }
                            },
                            { $count: "count" }
                        ],
                        statusDistribution: [
                            {
                                $group: {
                                    _id: "$status",
                                    count: { $sum: 1 }
                                }
                            }
                        ]
                    }
                }
            ]),
            // Slot stats (Single source of truth for booked slots)
            Slot.countDocuments({
                isBooked: true,
                date: { $gte: todayStart }
            }),
            // Payment stats
            Payment.aggregate([
                {
                    $facet: {
                        summary: [
                            {
                                $group: {
                                    _id: "$status",
                                    totalAmount: { $sum: "$amount" },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        today: [
                            {
                                $match: {
                                    status: "completed",
                                    createdAt: { $gte: todayStart, $lte: todayEnd }
                                }
                            },
                            { $group: { _id: null, amount: { $sum: "$amount" } } }
                        ]
                    }
                }
            ]),
            // Service stats
            Service.countDocuments({ isActive: true })
        ]);

        const paySummary = paymentStats[0].summary;
        const totalRevenue = paySummary.find(s => s._id === 'completed')?.totalAmount || 0;
        const totalRefunds = paySummary.find(s => s._id === 'refunded')?.totalAmount || 0;
        const totalTransactions = paySummary.reduce((acc, curr) => acc + curr.count, 0);

        const data = {
            totalUsers: userStats[0]?.totalUsers || 0,
            activeUsers: userStats[0]?.activeUsers || 0,
            totalStaff: staffStats,
            totalAppointments: appointmentStats[0].totals[0]?.total || 0,
            activeAppointments: slotStats,
            completedToday: appointmentStats[0].completedToday[0]?.count || 0,
            totalRevenue,
            todayRevenue: paymentStats[0].today[0]?.amount || 0,
            totalTransactions,
            totalRefunds,
            netRevenue: totalRevenue - totalRefunds,
            activeServices: serviceStats,
            appointmentStatus: appointmentStats[0].statusDistribution || []
        };

        return res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

export const getAdminStaff = async (req, res, next) => {
    try {
        const staff = await User.find({ role: 'staff', isActive: true })
            .select('_id name email role phone')
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (err) {
        next(err);
    }
};
