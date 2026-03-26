import Slot from "../models/Slot.js";
import Staff from "../models/Staff.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";
import { generateSlots } from "../utils/slotGenerator.js";
import mongoose from "mongoose";

// Helper to create a local Date object without timezone ambiguity
const parseLocalDate = (dateStr, hour = 0, minute = 0) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hour, minute, 0, 0);
};

export const getAvailableSlots = async (req, res, next) => {
    try {
        const { service, staff, date } = req.query;

        if (!service || !staff || !date) {
            return res.status(400).json({
                message: "Service, staff and date are required"
            });
        }

        const serviceDoc = await Service.findById(service);
        if (!serviceDoc) {
            return res.status(404).json({ message: "Service not found" });
        }

        const staffDoc = await Staff.findOne({ user: staff });
        if (!staffDoc) {
            return res.status(404).json({ message: "Staff not found" });
        }

        const selectedDate = new Date(date);
        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        const dayName = selectedDate
            .toLocaleDateString("en-US", { weekday: "long" })
            .toLowerCase();

        const workingDay = staffDoc.workingHours?.[dayName];

        if (!workingDay || !workingDay.isWorking) {
            return res.status(200).json({ count: 0, data: [] });
        }

        const allSlots = generateSlots(
            selectedDate,
            workingDay,
            serviceDoc.duration,
            []
        );

        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const appointments = await Appointment.find({
            staff: staff,
            date: { $gte: startOfDay, $lt: endOfDay },
            status: { $ne: "cancelled" }
        });

        const bookedTimes = appointments.map(a => a.startTime);

        const availableSlots = allSlots.filter(
            slot => !bookedTimes.includes(slot.startTime)
        );

        return res.status(200).json({
            count: availableSlots.length,
            data: availableSlots
        });

    } catch (err) {
        next(err);
    }
};

export const generateSlotsForService = async (req, res, next) => {
    try {
        const { staffId, serviceId, date, workingHours: providedWorkingHours } = req.body;

        if (!staffId || !date) {
            return res.status(400).json({ message: "staffId and date are required" });
        }

        // staffId from frontend is a User ID — look up Staff profile for working hours
        const staff = await Staff.findOne({ user: staffId }).populate('services');
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        const effectiveServiceId = serviceId || (staff.services && staff.services[0]?._id);
        if (!effectiveServiceId) {
            return res.status(400).json({ message: "No service found for this staff" });
        }

        const service = await Service.findById(effectiveServiceId);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // 1. Precise Local Range for Normalization
        const startOfDay = parseLocalDate(date, 0, 0);
        const endOfDay = parseLocalDate(date, 23, 59);
        endOfDay.setMilliseconds(999);

        // 2. Block Past Date Generation
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startOfDay < today) {
            return res.status(400).json({ message: "Cannot generate slots for past dates." });
        }

        // 3. Strict Duplicate Check — staff field stores User ID
        const existingSlotCount = await Slot.countDocuments({
            staff: staffId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existingSlotCount > 0) {
            return res.status(200).json({
                message: "Slots already generated for this date",
                data: { slotsGenerated: 0, existing: existingSlotCount }
            });
        }

        // Working hours logic
        let workingHours = providedWorkingHours;
        if (!workingHours) {
            const dayName = startOfDay.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
            workingHours = staff.workingHours?.[dayName];
            if (!workingHours || !workingHours.isWorking) {
                return res.status(400).json({ message: `Staff does not work on ${dayName}` });
            }
        }

        // 4. Generate Slot Data — store User ID in staff field
        const newSlotsData = generateSlots(startOfDay, workingHours, service.duration, []);

        const slotsToCreate = newSlotsData.map(slot => {
            return {
                staff: staffId,
                service: service._id,
                date: startOfDay,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isAvailable: true,
                isBooked: false
            };
        });

        if (slotsToCreate.length === 0) {
            return res.status(400).json({
                message: "No slots could be generated based on working hours.",
                data: { slotsGenerated: 0 }
            });
        }

        // 5. Insert and Log
        const insertedSlots = await Slot.insertMany(slotsToCreate);
        console.log(`✅ ${insertedSlots.length} slots inserted for staff ${staffId} on ${date}`);

        return res.status(201).json({
            message: `${insertedSlots.length} slots generated successfully`,
            data: {
                slotsGenerated: insertedSlots.length,
                date: startOfDay,
                service: service.name
            }
        });
    } catch (err) {
        console.error("❌ Error in generateSlotsForService:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to generate slots.",
            error: err.message
        });
    }
};

export const toggleSlotAvailability = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body;

        if (isAvailable === undefined) {
            return res.status(400).json({ message: "isAvailable field is required" });
        }

        const slot = await Slot.findById(id);
        if (!slot) {
            return res.status(404).json({ message: "Slot not found" });
        }

        if (slot.isBooked) {
            return res.status(400).json({ message: "Cannot modify booked slot" });
        }

        slot.isAvailable = isAvailable;
        await slot.save();

        await slot.populate('service', 'name duration');
        await slot.populate('staff', 'name email');

        return res.status(200).json({
            message: `Slot ${isAvailable ? 'made available' : 'made unavailable'}`,
            data: slot
        });
    } catch (err) {
        next(err);
    }
};

export const deleteSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        const slot = await Slot.findById(id);

        if (!slot) {
            return res.status(404).json({ message: "Slot not found" });
        }

        if (slot.isBooked) {
            return res.status(400).json({ message: "Cannot delete booked slot" });
        }
        await slot.deleteOne();

        return res.status(200).json({ message: "Slot deleted successfully" });
    } catch (err) {
        next(err);
    }
};

export const getStaffSlots = async (req, res, next) => {
    try {
        const { staffId } = req.params;
        const { date, service } = req.query;

        console.log(`🔍 Fetching slots for staff: ${staffId}, date: ${date}`);

        // Query using staff field directly — it stores User ID
        let query = { staff: staffId };

        if (date) {
            const startOfDay = parseLocalDate(date, 0, 0);
            const endOfDay = parseLocalDate(date, 23, 59);
            endOfDay.setMilliseconds(999);

            query.date = { $gte: startOfDay, $lte: endOfDay };
            console.log(`📅 Query range: ${startOfDay.toLocaleString()} to ${endOfDay.toLocaleString()}`);
        }

        if (service) {
            query.service = service;
        }

        const slots = await Slot.find(query)
            .populate('service', 'name duration category')
            .populate('staff', 'name email')
            .populate('appointment')
            .sort({ startTime: 1 });

        console.log(`✅ Found ${slots.length} slots for staff ${staffId}`);

        return res.status(200).json({
            success: true,
            count: slots.length,
            data: slots
        });
    } catch (err) {
        console.error("❌ Error in getStaffSlots:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch slots.",
            error: err.message
        });
    }
};

export const bulkGenerateSlots = async (req, res, next) => {
    try {
        const { staffId, serviceIds, startDate, endDate, workingHours } = req.body;

        if (!staffId || !serviceIds || !startDate || !endDate || !workingHours) {
            return res.status(400).json({ message: "StaffId, serviceIds, startDate, endDate and workingHours are required" });
        }

        const staff = await Staff.findOne({ user: staffId });
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        const services = await Service.find({ _id: { $in: serviceIds } });
        if (services.length === 0) {
            return res.status(404).json({ message: "Services not found" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        if (start > end) {
            return res.status(400).json({ message: "Start date must be before or equal to end date" });
        }

        let totalSlots = 0;
        const generatedSlots = [];
        const currentDate = new Date(start);

        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const startOfCurrentDay = parseLocalDate(dateStr, 0, 0);
            const endOfCurrentDay = parseLocalDate(dateStr, 23, 59);
            endOfCurrentDay.setMilliseconds(999);

            for (const service of services) {
                const existingCount = await Slot.countDocuments({
                    staff: staffId,
                    service: service._id,
                    date: { $gte: startOfCurrentDay, $lte: endOfCurrentDay }
                });

                if (existingCount === 0) {
                    const newDaySlots = generateSlots(startOfCurrentDay, workingHours, service.duration, []);
                    const slotsToCreate = newDaySlots.map(slot => {
                        return {
                            staff: staffId,
                            service: service._id,
                            date: parseLocalDate(dateStr, 0, 0),
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            isAvailable: true,
                            isBooked: false
                        };
                    });

                    if (slotsToCreate.length > 0) {
                        const inserted = await Slot.insertMany(slotsToCreate);
                        totalSlots += inserted.length;
                        generatedSlots.push({
                            date: dateStr,
                            service: service.name,
                            slots: inserted.length
                        });
                    }
                } else {
                    generatedSlots.push({
                        date: dateStr,
                        service: service.name,
                        slots: 0,
                        message: "Slots for this service and date already exist."
                    });
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return res.status(201).json({
            message: `${totalSlots} slots generated successfully`,
            data: {
                totalSlots,
                period: { startDate: start, endDate: end },
                generatedSlots
            }
        });
    } catch (err) {
        next(err);
    }
};

export const getSlotStats = async (req, res, next) => {
    try {
        const { staffId, date } = req.query;
        let matchQuery = {};

        if (staffId) {
            matchQuery.staff = new mongoose.Types.ObjectId(staffId);
        }

        if (date) {
            const start = parseLocalDate(date, 0, 0);
            const end = parseLocalDate(date, 23, 59);
            end.setMilliseconds(999);
            matchQuery.date = { $gte: start, $lte: end };
        } else {
            return res.status(400).json({ message: "Date is required for statistics" });
        }

        const stats = await Slot.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalSlots: { $sum: 1 },
                    bookedSlots: { $sum: { $cond: ["$isBooked", 1, 0] } },
                    availableSlots: { $sum: { $cond: ["$isAvailable", 1, 0] } }
                }
            }
        ]);

        const data = stats[0] || { totalSlots: 0, bookedSlots: 0, availableSlots: 0 };
        const efficiencyPercentage = data.totalSlots > 0
            ? Math.round((data.bookedSlots / data.totalSlots) * 100)
            : 0;

        return res.status(200).json({
            success: true,
            data: {
                ...data,
                efficiencyPercentage
            }
        });
    } catch (err) {
        next(err);
    }
};