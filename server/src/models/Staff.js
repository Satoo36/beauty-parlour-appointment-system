import mongoose from "mongoose";

const daySchema = new mongoose.Schema(
    {
        start: { type: String },
        end: { type: String },
        isWorking: { type: Boolean }
    },
    { _id: false }
);

const staffSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        specialization: {
            type: [String],
            required: true
        },
        experience: {
            type: Number
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        about: {
            type: String
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        workingHours: {
            monday: daySchema,
            tuesday: daySchema,
            wednesday: daySchema,
            thursday: daySchema,
            friday: daySchema,
            saturday: daySchema,
            sunday: daySchema
        },
        slotsBooked: {
            type: Object,
            default: {}
        },
        services: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service'
        }]
    },
    {
        minimize: false,
        timestamps: true
    },
);

const Staff = mongoose.models.Staff || mongoose.model("Staff", staffSchema);
export default Staff;