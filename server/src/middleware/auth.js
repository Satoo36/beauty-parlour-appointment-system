import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        let token;
        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(' ')[1];
        }

        if(!token) {
            return res.status(401).json({message: "Not authorized, token missing"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("_id name email role isActive");

        if(!user) {
            return res.status(401).json({message: "User not found"});
        }

        if(user.isActive === false) {
            return res.status(403).json({message: "Account is disabled"});
        }

        req.user = user;
        next();
    } catch(error) {
        return res.status(401).json({message: "Invalid or expired token"});
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
  console.error("🔥 REAL ERROR:", err);

  res.status(500).json({
    message: err.message,
    stack: err.stack // remove later
  });
};
