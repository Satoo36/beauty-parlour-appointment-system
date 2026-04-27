import mongoose, { mongo } from "mongoose";

const paymentSchema = new mongoose.Schema({
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    razorpayOrderId: {
        type: String,
        required: true
    },
    razorpayPaymentId: {
        type: String
    },
    razorpaySignature: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String
    },
    refundStatus: {
        type: String,
        enum: ['none', 'requested', 'processing', 'processed', 'refunded'],
        default: 'none'
    },
    refundId: {
        type: String
    },
    refundReason: {
        type: String
    },
    refundedAt: {
        type: Date
    },
    paidAt: {
        type: Date
    },
    failureReason: {
        type: String
    },
}, { timestamps: true });

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.models.payment || mongoose.model("payment", paymentSchema);
export default Payment;