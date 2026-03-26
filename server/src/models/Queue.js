import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
    {
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service',
            required: true
        },
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        appointments: [{
            appointment: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Appointment'
            },
            position: Number,
            estimatedTime: String,
            status: {
                type: String,
                enum: ['waiting', 'in-service', 'completed', 'cancelled'],
                default: 'waiting'
            },
            joinedAt: {
                type: Date,
                default: Date.now
            },
        }],
        currentServing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
});

const Queue = mongoose.models.queue || mongoose.model("queue", queueSchema);
export default Queue;