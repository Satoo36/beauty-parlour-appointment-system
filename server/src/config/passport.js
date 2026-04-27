import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;

        // 1. Check if user already has this googleId
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // 2. If same email exists, link Google to that account
        if (email) {
            user = await User.findOne({ email });
            if (user) {
                user.googleId = profile.id;
                if (!user.avatar?.url) {
                    user.avatar = { url: profile.photos?.[0]?.value };
                }
                await user.save();
                return done(null, user);
            }
        }

        // 3. Create new user
        user = await User.create({
            name: profile.displayName,
            email: email || undefined,
            googleId: profile.id,
            avatar: { url: profile.photos?.[0]?.value },
            password: undefined
        });

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

export default passport;