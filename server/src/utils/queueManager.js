export const calculateEstimatedTime = (position, serviceDuration) => {
    const totalMinutes = position * serviceDuration;
    const hours = Math.floor(totalMinutes/60);
    const minutes = totalMinutes % 60;

    if(hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

export const updateQueuePositions = (appointments) => {
    return appointments.map((apt, index) => ({
        ...apt,
        position: index + 1
    }));
};