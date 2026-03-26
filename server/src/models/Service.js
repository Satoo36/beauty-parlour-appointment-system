import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String
        },
        duration: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        bookingType: {
            type: String,
            enum: ['slot', 'queue'],
            required: true
        },
        category: {
            type: String,
            required: true,
            enum: ['Hair', 'Skin', 'Nails', 'Makeup', 'Spa', 'Other', 'Facial', 'Massage', 'Threading', 'Waxing']
        },
        image: {
            public_id: String,
            url: String
        },
        isActive: {
            type: Boolean,
            default: true
        },
        staffMembers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    {
        timestamps: true
    });

const Service = mongoose.models.Service || mongoose.model("Service", serviceSchema);
export default Service;