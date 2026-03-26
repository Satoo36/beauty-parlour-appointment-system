export const sendQueueUpdate = (io, queueId, data) => {
    io.to(`queue-${queueId}`).emit('queue-update', data);
};

export const sendAppointmentUpdate = (io, userId, data) => {
    io.to(`user-${userId}`).emit('appointment-update', data);
};

export const sendBroadcastNotification = (io, data) => {
    io.emit('broadcast-notification', data);
};