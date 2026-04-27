import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
    {
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service',
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        },
        isBooked: {
            type: Boolean,
            required: true
        },
        isAvailable: {
            type: Boolean,
            required: true
        },
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment'
        }
    },
    {
        timestamps: true
    });

// Uniqueness is scoped to (staff + service + date + startTime)
// This allows the same time slot to exist per-service for the same staff member
slotSchema.index({ staff: 1, service: 1, date: 1, startTime: 1 }, { unique: true });

const Slot = mongoose.models.Slot || mongoose.model("Slot", slotSchema);
export default Slot;