import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema=new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'staff', 'admin'],
        default: "user"
    },
    phone: {
        type: String,
        trim: true
    }, 
    avatar: {
        public_id: String,
        url: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
},
{
    timestamps: true
});

userSchema.pre("save", async function() {
    if(!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candiatePassword) {
    return await bcrypt.compare(candiatePassword, this.password);
};


const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;