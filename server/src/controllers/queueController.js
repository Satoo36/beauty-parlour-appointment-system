import Queue from "../models/Queue.js";
import Appointment from "../models/Appointment.js";
import Service from "../models/Service.js";
import Staff from "../models/Staff.js";
import User from "../models/User.js";
import { calculateEstimatedTime, updateQueuePositions } from "../utils/queueManager.js";
import { sendQueueUpdate } from "../utils/notification.js";
import { getAppointmentStats } from "./appointmentController.js";

export const joinQueue = async (req, res, next) => {
    try {
        const { service, staff, date } = req.body;

        if (!service || !staff || !date) {
            return res.status(400).json({ message: "Service, staff and date are required" });
        }

        const serviceData = await Service.findById(service);
        if (!serviceData) {
            return res.status(404).json({ message: "Service not found" });
        }

        const queryDate = new Date(date);
        if (isNaN(queryDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }
        queryDate.setHours(0, 0, 0, 0);

        const existingQueueAppointment = await Appointment.findOne({
            user: req.user._id,
            service,
            staff,
            date: queryDate,
            status: 'pending'
        });

        if (existingQueueAppointment) {
            return res.status(400).json({ message: "You already have a pending appointment in this queue" });
        }

        let queue = await Queue.findOne({
            service,
            staff,
            date: queryDate,
            isActive: true
        });

        const appointment = await Appointment.create({
            user: req.user._id,
            service,
            staff,
            slot: null,
            date: queryDate,
            startTime: 'Queue',
            endTime: 'Queue',
            amount: serviceData.price,
            status: 'pending',
            paymentStatus: 'pending',
            queuePosition: 0
        });

        if (!queue) {
            queue = await Queue.create({
                service,
                staff,
                date: queryDate,
                appointments: [{
                    appointment: appointment._id,
                    position: 1,
                    estimatedTime: calculateEstimatedTime(0, serviceData.duration),
                    status: 'waiting',
                    joinedAt: new Date()
                }],
                currentServing: null,
                isActive: true,
                averageServiceTime: serviceData.duration,
                createdAt: new Date()
            });
        } else {
            const position = queue.appointments.filter(item => item.status === 'waiting').length + 1;
            queue.appointments.push({
                appointment: appointment._id,
                position,
                estimatedTime: calculateEstimatedTime(position - 1, serviceData.duration),
                status: 'waiting',
                joinedAt: new Date()
            });
            await queue.save();
        }

        appointment.queuePosition = queue.appointments.filter(item => item.status === 'waiting').length;
        await appointment.save();

        const populatedQueue = await Queue.findById(queue._id)
            .populate('service', 'name duration price')
            .populate('staff', 'name email avatar')
            .populate({
                path: 'appointments.appointment',
                populate: [
                    { path: 'user', select: 'name email phone avatar' },
                    { path: 'service', select: 'name duration' }
                ]
            });

        const io = req.app.get('io');
        if (io) {
            sendQueueUpdate(io, queue._id, {
                queue: populatedQueue,
                message: 'New customer joined the queue'
            });
        }

        return res.status(201).json({
            message: "Successfully joined the queue",
            data: {
                queue: populatedQueue,
                appointment,
                position: appointment.queuePosition,
                estimatedWaitTime: calculateEstimatedTime(appointment.queuePosition - 1, serviceData.duration)
            }
        });
    } catch (err) {
        next(err);
    }
};

export const getQueue = async (req, res, next) => {
    try {
        const { id } = req.params;

        const queue = await Queue.findById(id)
            .populate('service', 'name duration price')
            .populate('staff', 'name email avatar')
            .populate({
                path: 'appointments.appointment',
                populate: [
                    { path: 'user', select: 'name email phone avatar' },
                    { path: 'service', select: 'name duration' }
                ]
            })
            .populate('currentServing');

        if (!queue) {
            return res.status(404).json({ message: "Queue not found" });
        }

        return res.status(200).json({ data: queue });
    } catch (err) {
        next(err);
    }
};

export const checkQueuePosition = async (req, res, next) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (req.user.role === 'user' && appointment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to check this queue position" });
        }

        const queue = await Queue.findOne({
            service: appointment.service,
            staff: appointment.staff,
            date: appointment.date,
            'appointments.appointment': appointment._id,
            isActive: true
        })
            .populate('service', 'name duration')
            .populate('staff', 'name');

        if (!queue) {
            return res.status(404).json({ message: "Queue not found or appointment not in queue" });
        }

        const queueItem = queue.appointments.find(
            item => item.appointment.toString() === appointment._id.toString()
        );

        if (!queueItem) {
            return res.status(404).json({ message: "Appointment not found in queue" });
        }

        const waitingAhead = queue.appointments.filter(
            item => item.position < queueItem.position && item.status === 'waiting'
        ).length;

        const currentlyServing = queue.currentServing?.toString() === appointment._id.toString();
        let estimatedTime = queueItem.estimatedTime;
        if (queueItem.status === 'waiting') {
            estimatedTime = calculateEstimatedTime(waitingAhead, queue.service?.duration || 30);
        }


        return res.status(200).json({
            data: {
                queueId: queue._id,
                appointmentId: appointment._id,
                queuePosition: queueItem.position,
                totalInQueue: queue.appointments.filter(item => item.status === 'waiting').length,
                waitingAhead,
                estimatedTime,
                status: queueItem.status,
                currentlyServing,
                service: queue.service ? queue.service.name : null,
                staff: queue.staff ? queue.staff.name : null,
                updatedAt: queueItem.updatedAt || queueItem.joinedAt
            }
        });
    } catch (err) {
        next(err);
    }
};

export const callNextCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;

        const queue = await Queue.findById(id).populate('service', 'duration name');
        if (!queue) {
            return res.status(404).json({ message: "Queue not found" });
        }

        if (req.user.role === 'staff' && queue.staff.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to manage this queue" });
        }

        if (queue.currentServing) {
            const currentItem = queue.appointments.find(
                item => item.appointment.toString() === queue.currentServing.toString()
            );

            if (currentItem) {
                currentItem.status = 'completed';
                currentItem.completedAt = new Date();

                const currentAppointment = await Appointment.findById(queue.currentServing);
                if (currentAppointment) {
                    currentAppointment.status = 'completed';
                    await currentAppointment.save();
                }
            }
        }

        const nextInQueue = queue.appointments.find(item => item.status === 'waiting');
        if (nextInQueue) {
            nextInQueue.status = 'in-service';
            nextInQueue.startedAt = new Date();
            queue.currentServing = nextInQueue.appointment;

            const nextAppointment = await Appointment.findById(nextInQueue.appointment);
            if (nextAppointment) {
                nextAppointment.status = 'in-progress';
                await nextAppointment.save();
            }

            const waitingAppointments = queue.appointments.filter(item => item.status === 'waiting');
            waitingAppointments.forEach((item, index) => {
                item.estimatedTime = calculateEstimatedTime(index, queue.service.duration)
            });
        } else {
            queue.currentServing = null;
        }
        await queue.save();

        const populatedQueue = await Queue.findById(queue._id)
            .populate('service', 'name duration price')
            .populate('staff', 'name email avatar')
            .populate({
                path: 'appointments.appointment',
                populate: { path: 'user', select: 'name phone avatar' }
            });

        const io = req.app.get('io');
        if (io) {
            sendQueueUpdate(io, queue._id, {
                queue: populatedQueue,
                message: nextInQueue ? 'Next customer is being served' : 'Queue completed'
            });
        }

        return res.status(200).json({
            message: nextInQueue ? 'Next customer called' : 'No more customers in queue',
            data: {
                queue: populatedQueue,
                nextCustomer:
                    nextInQueue ? { appointmentId: nextInQueue.appointment, position: nextInQueue.position } : null
            }
        });
    } catch (err) {
        next(err);
    }
};

export const removeFromQueue = async (req, res, next) => {
    try {
        const { queueId, appointmentId } = req.params;

        const queue = await Queue.findById(queueId);
        if (!queue) {
            return res.status(404).json({ message: "Queue not found" });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (req.user.role === 'user' && appointment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorised to remove this appointment" });
        }

        const itemIndex = queue.appointments.findIndex(
            item => item.appointment.toString() === appointment._id
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: "Appointment not in queue" });
        }

        if (queue.currentServing?.toString() === appointmentId) {
            return res.status(400).json({ message: "Cannot remove appointment that is currently being served" });
        }

        const removedItem = queue.appointments[itemIndex];
        queue.appointments.splice(itemIndex, 1);

        queue.appointments = updateQueuePositions(queue.appointments);

        appointment.status = 'cancelled';
        appointment.cancellationReason = 'Removed from queue';
        await appointment.save();
        await queue.save();

        const populatedQueue = await Queue.findById(queue._id)
            .populate('service', 'name duration')
            .populate('staff', 'name')
            .populate('appointments.appointment');

        const io = req.app.get('io');
        if (io) {
            sendQueueUpdate(io, queue._id, { queue: populatedQueue, message: "Customer removed from queue" });
        }

        return res.status(200).json({
            message: "Removed from queue successfully",
            data: {
                queue: populatedQueue,
                removedAppointmentId: appointmentId,
                removedPosition: removedItem.position
            }
        });
    } catch (err) {
        next(err);
    }
};

export const getActiveQueues = async (req, res, next) => {
    try {
        const { date, service, staff } = req.query;

        let query = { isActive: true };

        if (date) {
            const queryDate = new Date(date);
            if (isNaN(queryDate.getTime())) {
                return res.status(400).json({ message: "Invalid date format" });
            }
            queryDate.setHours(0, 0, 0, 0);
            query.date = queryDate;
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query.date = today;
        }

        if (service) {
            query.service = service;
        }

        if (staff) {
            query.staff = staff;
        } else if (req.user.role === 'staff') {
            query.staff = req.user._id;
        }

        const queues = await Queue.find(query)
            .populate('service', 'name duration price')
            .populate('staff', 'name email avatar')
            .populate({
                path: 'appointments.appointment',
                populate: { path: 'user', select: 'name phone avatar' }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({ count: queues.length, data: queues })
    } catch (err) {
        next(err);
    }
};

export const closeQueue = async (req, res, next) => {
    try {
        const { id } = req.params;

        const queue = await Queue.findById(id);
        if (!queue) {
            return res.status(404).json({ message: "Queue not found" });
        }

        if (req.user.role === 'staff' && queue.staff.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to close this queue" });
        }

        const waitingAppointments = queue.appointments.filter(item => item.status === 'waiting');
        for (const item of waitingAppointments) {
            const appointment = await Appointment.findById(item.appointment);
            if (appointment) {
                appointment.status = 'cancelled';
                appointment.cancellationReason = 'Queue closed';
                await appointment.save();
            }
        }
        queue.isActive = false;
        queue.closedAt = new Date();
        queue.closedBy = req.user._id;
        await queue.save();

        const io = req.app.get('io');
        if (io) {
            sendQueueUpdate(io, queue._id, { queue, message: 'Queue has been closed' });
        }

        return res.status(200).json({
            message: "Queue closed successfully",
            data: {
                queueId: queue._id,
                cancelledAppointments: waitingAppointments.length,
                closedAt: queue.closedAt
            }
        });
    } catch (err) {
        next(err);
    }
};