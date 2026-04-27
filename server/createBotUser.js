import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

const createBotUser = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if bot user already exists
    let botUser = await User.findOne({ email: "bot@glamourbeauty.internal" });

    if (!botUser) {
        botUser = await User.create({
            name: "GlamourBeauty Bot",
            email: "bot@glamourbeauty.internal",
            password: "dummy_password_not_used",
            role: "user",
            isActive: true
        });
        console.log("✅ Bot user created:", botUser._id.toString());
    } else {
        console.log("✅ Bot user already exists:", botUser._id.toString());
    }

    // Generate JWT with real MongoDB ObjectId
    const token = jwt.sign(
        { id: botUser._id.toString(), role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "365d" }
    );

    console.log("\n🔑 BOT JWT TOKEN (copy this into all n8n tool headers):");
    console.log(token);
    console.log("\n📋 Bot User ID:", botUser._id.toString());

    await mongoose.disconnect();
    process.exit(0);
};

createBotUser().catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
});