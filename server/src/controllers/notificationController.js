import { sendBroadcastNotification } from "../utils/notification.js";

export const broadcastNotification = async (req, res, next) => {
    try {
        const { title, message, type = 'info', target = 'all' } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: "Title and message are required" });
        }

        const io = req.app.get('io');
        if (!io) {
            return res.status(500).json({ message: "Socket.io not initialized" });
        }

        const notificationData = {
            title,
            message,
            type,
            target,
            timestamp: new Date(),
            sender: req.user.name
        };

        sendBroadcastNotification(io, notificationData);

        return res.status(200).json({
            message: "Notification broadcasted successfully",
            data: notificationData
        });
    } catch (err) {
        next(err);
    }
};
