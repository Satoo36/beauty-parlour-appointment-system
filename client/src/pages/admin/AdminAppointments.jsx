import { useState, useEffect } from "react";
import {
    Search,
    Calendar,
    User,
    ChevronLeft,
    ChevronRight,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    UserPlus,
    RotateCcw
} from "lucide-react";
import adminService from "../../api/adminService";
import dayjs from "dayjs";

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState([]);
    const [filters, setFilters] = useState({
        status: "",
        staff: "",
        paymentStatus: "",
        date: ""
    });
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1
    });

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await adminService.getAppointments({ ...filters, page, limit: 10 });
            setAppointments(res.data.data);
            setPagination({
                total: res.data.total,
                pages: res.data.pages
            });
        } catch (err) {
            console.error("Error fetching appointments:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await adminService.getAllStaff();
            setStaffList(res.data.data);
        } catch (err) {
            console.error("Error fetching staff:", err);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [filters, page]);

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await adminService.updateAppointmentStatus(id, newStatus);
            fetchAppointments();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleCancel = async (id) => {
        const reason = window.prompt("Enter cancellation reason:");
        if (reason === null) return;

        try {
            await adminService.cancelAppointment(id, { cancellationReason: reason });
            fetchAppointments();
        } catch (err) {
            alert("Failed to cancel appointment");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Appointments</h2>
                    <p className="text-slate-500">Manage and track all customer bookings</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="date"
                        name="date"
                        value={filters.date}
                        onChange={handleFilterChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all text-sm font-medium"
                    />
                </div>
                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all appearance-none text-sm font-bold"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select
                    name="staff"
                    value={filters.staff}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all appearance-none text-sm font-bold"
                >
                    <option value="">All Staff</option>
                    {staffList.map(s => {
                        const sId = s.user?._id || s.user;
                        return (
                            <option key={sId} value={sId}>{s.user?.name || 'Unknown'}</option>
                        );
                    })}
                </select>
                <select
                    name="paymentStatus"
                    value={filters.paymentStatus}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all appearance-none text-sm font-bold"
                >
                    <option value="">All Payments</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                </select>
                <button
                    onClick={() => { setFilters({ status: "", staff: "", paymentStatus: "", date: "" }); setPage(1); }}
                    className="px-4 py-2.5 text-rose-500 font-black uppercase tracking-wider hover:bg-rose-50 rounded-xl transition-all text-xs"
                >
                    <RotateCcw size={14} className="inline mr-2" /> Reset
                </button>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Customer</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Service & Staff</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Schedule</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Amount</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-8"><div className="h-4 bg-slate-50 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-medium">No appointments found matching your filters.</td>
                                </tr>
                            ) : (
                                appointments.map((apt) => (
                                    <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-black text-lg">
                                                    {apt.user?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{apt.user?.name}</div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{apt.user?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{apt.service?.name}</div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
                                                <User size={10} /> {apt.staff?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="font-bold text-slate-900">
                                                {dayjs(apt.date).format('DD MMM, YYYY')}
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{apt.startTime} - {apt.endTime}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-900">₹{apt.amount?.toLocaleString()}</div>
                                            <div className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${apt.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {apt.paymentStatus}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(apt.status)}`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {apt.status === 'confirmed' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(apt._id, 'completed')}
                                                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                                            title="Mark Completed"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(apt._id)}
                                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="Cancel Appointment"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                        Showing {appointments.length} of {pagination.total} bookings
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-white shadow-sm transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            disabled={page >= pagination.pages}
                            onClick={() => setPage(page + 1)}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-white shadow-sm transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAppointments;
