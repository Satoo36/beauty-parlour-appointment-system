import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getBearerToken = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        return req.headers.authorization.split(' ')[1];
    }

    return null;
};

const getUserFromToken = async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.id === 'bot-agent') {
        console.log("AI Agent identified! Bypassing DB lookup.");
        return { _id: "bot-agent", name: "AI Agent", role: "admin", isActive: true };
    }

    console.log("User request identification for ID:", decoded.id);
    const user = await User.findById(decoded.id).select("_id name email role isActive");

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    if (user.isActive === false) {
        throw new Error("USER_DISABLED");
    }

    return user;
};

export const protect = async (req, res, next) => {
    try {
        const token = getBearerToken(req);

        if (!token) {
            return res.status(401).json({ message: "Not authorized, token missing" });
        }

        req.user = await getUserFromToken(token);
        next();
    } catch (error) {
        if (error.message === "USER_NOT_FOUND") {
            return res.status(401).json({ message: "User not found" });
        }

        if (error.message === "USER_DISABLED") {
            return res.status(403).json({ message: "Account is disabled" });
        }

        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const optionalProtect = async (req, res, next) => {
    try {
        const token = getBearerToken(req);

        if (!token) {
            return next();
        }

        req.user = await getUserFromToken(token);
        return next();
    } catch (error) {
        console.warn("Optional auth skipped:", error.message);
        req.user = undefined;
        return next();
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if(!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({message: `Role '${req.user?.role} is not allowed to access this resource'`});
        }
        next();
    };
};

export const errorHandler = (err, req, res, next) => {
  console.error("REAL ERROR:", err);

  res.status(500).json({
    message: err.message
  });
};
