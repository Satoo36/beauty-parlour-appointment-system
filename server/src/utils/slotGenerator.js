export const generateSlots = (date, workingHours, serviceDuration, exisitingSlots = []) => {
    const slots = [];
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    let endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime < endTime) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);

        if(slotEnd <= endTime) {
            const startTimeStr = slotStart.toTimeString().slice(0, 5);
            const endTimeStr = slotEnd.toTimeString().slice(0, 5);

            const isExisting = exisitingSlots.some(slot => slot.startTime === startTimeStr);

            if(!isExisting) {
                slots.push({startTime: startTimeStr, endTime: endTimeStr});
            }
        };

        currentTime = slotEnd;
    }
    return slots;
};