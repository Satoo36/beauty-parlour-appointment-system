import { useState, useEffect, useMemo } from "react";
import {
    Calendar,
    Clock,
    User,
    AlertCircle,
    CheckCircle2,
    Trash2,
    Plus,
    RefreshCcw,
    Scissors,
    Sparkles,
    Hand,
    Heart,
    Paintbrush,
    Droplets,
    Flower2
} from "lucide-react";
import { slotService, staffService, adminService } from "../../api/api";
import dayjs from "dayjs";

/**
 * Returns the correct Lucide icon component based on service category or name.
 */
const getServiceIcon = (slot) => {
    const category = (slot?.service?.category || '').toLowerCase();
    const name = (slot?.service?.name || '').toLowerCase();

    // Match by category first (most reliable)
    if (category.includes('hair')) return Scissors;
    if (category.includes('facial')) return Sparkles;
    if (category.includes('nail')) return Hand;
    if (category.includes('massage')) return Heart;
    if (category.includes('makeup')) return Paintbrush;
    if (category.includes('threading')) return Flower2;
    if (category.includes('waxing')) return Droplets;

    // Fallback: match by service name keywords
    if (name.includes('haircut') || name.includes('hair cut') || name.includes('hair')) return Scissors;
    if (name.includes('facial')) return Sparkles;
    if (name.includes('manicure') || name.includes('pedicure') || name.includes('nail')) return Hand;
    if (name.includes('massage') || name.includes('spa')) return Heart;
    if (name.includes('makeup') || name.includes('bridal')) return Paintbrush;
    if (name.includes('threading')) return Flower2;
    if (name.includes('waxing') || name.includes('wax')) return Droplets;

    return Clock; // neutral fallback
};

const AdminSlots = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        staff: null,
        date: dayjs().format("YYYY-MM-DD")
    });
    const [staffList, setStaffList] = useState([]);

    const [backendStats, setBackendStats] = useState({ totalSlots: 0, bookedSlots: 0, efficiencyPercentage: 0 });

    const fetchStaff = async () => {
        try {
            const res = await adminService.getStaff();
            if (res.data?.success) {
                setStaffList(res.data.data || []);
            }
        } catch (err) {
            console.error("Error fetching staff:", err);
            setStaffList([]);
        }
    };

    const fetchSlots = async (staffId, date) => {
        if (!staffId || !date) return;
        try {
            const res = await slotService.getByStaff(staffId, { date });
            if (res.data?.success) {
                setSlots(res.data.data || []);
            }
        } catch (err) {
            console.error("Error fetching slots:", err);
            setSlots([]);
        }
    };

    const fetchStats = async (explicitStaff = null, explicitDate = null) => {
        const targetStaff = explicitStaff || filters.staff;
        const targetDate = explicitDate || filters.date;

        if (!targetStaff || !targetDate) return;

        try {
            const res = await slotService.getStats({ staffId: targetStaff, date: targetDate });
            if (res.data.success) {
                setBackendStats(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    /**
     * Fresh fetch for both list and stats
     */
    const refreshData = async (staff, date) => {
        setLoading(true);
        await Promise.all([
            fetchSlots(staff, date),
            fetchStats(staff, date)
        ]);
        setLoading(false);
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        if (filters.staff && filters.date) {
            refreshData(filters.staff, filters.date);
        }
    }, [filters.staff, filters.date]);

    // Derived statistics comparison (Frontend vs Backend sync)
    const statsToDisplay = useMemo(() => {
        const total = slots.length;
        const booked = slots.filter(s => s.isBooked || s.status === "booked").length;
        const efficiency = total > 0 ? Math.round((booked / total) * 100) : 0;
        return { total, booked, efficiency: efficiency + "%" };
    }, [slots]);

    const [status, setStatus] = useState({ type: "", message: "" });

    const showStatus = (type, message) => {
        setStatus({ type, message });
        setTimeout(() => setStatus({ type: "", message: "" }), 5000);
    };

    const isPastDate = useMemo(() => {
        if (!filters.date) return false;
        const selected = dayjs(filters.date).startOf('day');
        const today = dayjs().startOf('day');
        return selected.isBefore(today);
    }, [filters.date]);

    const handleGenerate = async () => {
        const { staff, date } = filters;
        if (!staff || !date) {
            showStatus("error", "Please select both a professional and a date.");
            return;
        }

        if (isPastDate) {
            showStatus("error", "Cannot generate slots for past dates.");
            return;
        }

        const today = dayjs().startOf('day');
        const selected = dayjs(date).startOf('day');
        if (selected.isBefore(today)) {
            showStatus("error", "Cannot generate slots for past dates.");
            return;
        }

        try {
            setLoading(true);
            const res = await slotService.generate({
                staffId: staff,
                date: date
            });

            // Trigger atomic refresh immediately
            await refreshData(staff, date);

            if (res.data.data?.slotsGenerated > 0) {
                showStatus("success", res.data.message);
            } else {
                showStatus("info", res.data.message);
            }
        } catch (err) {
            console.error("Error generating slots:", err);
            showStatus("error", err.response?.data?.message || "Failed to generate slots.");
            await refreshData(staff, date);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (window.confirm("Delete this slot permanently?")) {
            try {
                await slotService.delete(id);
                showStatus("success", "Slot deleted successfully.");
                await fetchSlots(filters.staff, filters.date);
                await fetchStats(filters.staff, filters.date);
            } catch (err) {
                showStatus("error", "Failed to delete slot.");
            }
        }
    };

    const handleToggleAvailability = async (id, currentStatus) => {
        if (!id) return;
        try {
            await slotService.toggleAvailability(id, !currentStatus);
            showStatus("success", `Slot ${!currentStatus ? 'enabled' : 'disabled'} successfully.`);
            await fetchSlots(filters.staff, filters.date);
            await fetchStats(filters.staff, filters.date);
        } catch (err) {
            showStatus("error", "Failed to update slot status.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            {status.message && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border animate-in slide-in-from-top-4 duration-300 ${status.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                    status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                    {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    <span className="font-bold text-sm tracking-tight">{status.message}</span>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Slot Management</h2>
                    <p className="text-slate-500">Monitor and manage professional schedules</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={loading || !filters.staff || isPastDate}
                    className="flex items-center gap-2 px-6 py-3 bg-ink-900 text-white font-bold rounded-xl shadow-lg hover:bg-ink-800 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading && !slots.length ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Plus size={20} />
                    )}
                    {isPastDate ? "Blocked" : "Generate Slots"}
                </button>
            </div>

            {/* Filters and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Calendar size={18} className="text-rose-500" /> Filter Schedule
                    </h3>
                    <div className="space-y-3">
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Professional</label>
                        <select
                            value={filters.staff}
                            onChange={(e) => setFilters(prev => ({ ...prev, staff: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                        >
                            <option value="">Select Staff Member</option>
                            {Array.isArray(staffList) && staffList.map(s => (
                                <option key={s?._id} value={s?._id}>{s?.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Date</label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                        />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-4 -mt-4"></div>
                    <h3 className="text-rose-100 font-bold uppercase tracking-widest text-xs mb-6">Schedule Statistics</h3>
                    <div className="grid grid-cols-3 gap-8 relative z-10">
                        <div>
                            <div className="text-3xl font-bold mb-1">{statsToDisplay?.total ?? 0}</div>
                            <div className="text-rose-100 text-[10px] font-black uppercase tracking-widest">Total Slots</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold mb-1">{statsToDisplay?.booked ?? 0}</div>
                            <div className="text-rose-100 text-[10px] font-black uppercase tracking-widest">Booked</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold mb-1">{statsToDisplay?.efficiency ?? "0%"}</div>
                            <div className="text-rose-100 text-[10px] font-black uppercase tracking-widest">Efficiency</div>
                        </div>
                    </div>
                    <div className="mt-8 relative z-10 flex gap-4">
                        <button
                            onClick={() => refreshData(filters.staff, filters.date)}
                            disabled={loading || !filters.staff}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-all backdrop-blur-sm disabled:opacity-50"
                        >
                            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> Refresh Schedule
                        </button>
                    </div>
                </div>
            </div>

            {/* Slots List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                {!filters.staff ? (
                    <div className="py-32 text-center flex flex-col items-center">
                        <AlertCircle size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-500 font-medium">Please select a staff member to view their schedule</p>
                    </div>
                ) : loading && slots.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center space-y-4">
                        <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-medium text-sm animate-pulse">Loading schedule...</p>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="py-32 text-center">
                        <p className="text-slate-500 font-medium mb-4">No slots generated for this date yet.</p>
                        <button
                            onClick={handleGenerate}
                            className="px-6 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors"
                        >
                            Generate slots for {dayjs(filters.date).format("MMM DD, YYYY")}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                        {Array.isArray(slots) && slots.map(slot => (
                            <div key={slot?._id} className={`p-4 rounded-2xl border transition-all ${slot?.isBooked
                                ? 'bg-rose-50 border-rose-200'
                                : slot?.isAvailable
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-slate-50 border-slate-200 opacity-60'
                                }`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2 rounded-lg ${slot?.isBooked ? 'bg-rose-500' : 'bg-slate-900'} text-white`}>
                                        <Clock size={16} />
                                    </div>
                                    <div className="flex gap-1">
                                        {!slot?.isBooked && (
                                            <button
                                                onClick={() => handleToggleAvailability(slot?._id, slot?.isAvailable)}
                                                className={`p-1.5 hover:bg-white rounded-lg transition-all ${slot?.isAvailable ? 'text-slate-500' : 'text-emerald-500'}`}
                                                title={slot?.isAvailable ? "Disable Slot" : "Enable Slot"}
                                            >
                                                {slot?.isAvailable ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(slot?._id)}
                                            className="p-1.5 hover:bg-white rounded-lg transition-all text-rose-500"
                                            title="Delete Slot"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="font-bold text-slate-900 text-lg mb-1">{slot?.startTime} - {slot?.endTime}</div>
                                {(() => {
                                    const ServiceIcon = getServiceIcon(slot);
                                    return (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-3">
                                            <ServiceIcon size={12} className="text-rose-400" /> {slot?.service?.name}
                                        </div>
                                    );
                                })()}
                                {slot?.isBooked ? (
                                    <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg text-rose-600 font-bold text-[10px] uppercase tracking-widest border border-rose-200">
                                        <CheckCircle2 size={12} /> Booked
                                    </div>
                                ) : (
                                    <div className={`flex items-center gap-2 px-2 py-1 bg-white rounded-lg font-bold text-[10px] uppercase tracking-widest border ${slot?.isAvailable ? 'text-emerald-600 border-emerald-200' : 'text-slate-400 border-slate-200'}`}>
                                        {slot?.isAvailable ? 'Available' : 'Blocked'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSlots;
