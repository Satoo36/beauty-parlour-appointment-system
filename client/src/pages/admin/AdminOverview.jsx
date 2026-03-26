import { useState, useEffect } from "react";
import {
    Users,
    UserSquare,
    CalendarCheck,
    Clock,
    CheckCircle2,
    IndianRupee,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    LayoutDashboard
} from "lucide-react";
import adminService from "../../api/adminService";
import { appointmentService, paymentService } from "../../api/api";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from "recharts";

const StatsCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-sm font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {trendValue}%
                </div>
            )}
        </div>
        <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        </div>
    </div>
);

const AdminOverview = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalStaff: 0,
        totalAppointments: 0,
        activeAppointments: 0,
        completedToday: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        totalTransactions: 0,
        totalRefunds: 0,
        netRevenue: 0,
        activeServices: 0
    });
    const [revenueTrends, setRevenueTrends] = useState([]);
    const [appointmentStatus, setAppointmentStatus] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            setError(null);
            const [summaryRes, payRes] = await Promise.all([
                adminService.getSummary(),
                adminService.getPaymentStats({ groupBy: 'day' })
            ]);

            const summaryData = summaryRes.data.data;
            const payData = payRes.data.data;

            setStats({
                totalUsers: summaryData.totalUsers || 0,
                activeUsers: summaryData.activeUsers || 0,
                totalStaff: summaryData.totalStaff || 0,
                totalAppointments: summaryData.totalAppointments || 0,
                activeAppointments: summaryData.activeAppointments || 0,
                completedToday: summaryData.completedToday || 0,
                totalRevenue: summaryData.totalRevenue || 0,
                todayRevenue: summaryData.todayRevenue || 0,
                totalTransactions: summaryData.totalTransactions || 0,
                totalRefunds: summaryData.totalRefunds || 0,
                netRevenue: summaryData.netRevenue || 0,
                activeServices: summaryData.activeServices || 0
            });

            setRevenueTrends(payData.revenueTrends || []);
            setAppointmentStatus(summaryData.appointmentStatus || []);

        } catch (err) {
            console.error("Error fetching summary:", err);
            setError("Failed to load dashboard data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-rose-500 space-y-4">
                <div className="bg-rose-50 p-4 rounded-full">
                    <LayoutDashboard size={48} />
                </div>
                <h3 className="text-xl font-bold">Oops! Something went wrong</h3>
                <p className="text-slate-600">{error}</p>
                <button
                    onClick={fetchSummary}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-96 bg-slate-200 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const COLORS = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

    return (
        <div className="space-y-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={Users}
                    color="bg-blue-500"
                    trend="up"
                    trendValue="12"
                />
                <StatsCard
                    title="Total Staff"
                    value={stats?.totalStaff || 0}
                    icon={UserSquare}
                    color="bg-purple-500"
                />
                <StatsCard
                    title="Total Appointments"
                    value={stats?.totalAppointments || 0}
                    icon={CalendarCheck}
                    color="bg-amber-500"
                    trend="up"
                    trendValue="8"
                />
                <StatsCard
                    title="Active Appointments"
                    value={stats?.activeAppointments || 0}
                    icon={Clock}
                    color="bg-rose-500"
                />
                <StatsCard
                    title="Completed Today"
                    value={stats?.completedToday || 0}
                    icon={CheckCircle2}
                    color="bg-emerald-500"
                />
                <StatsCard
                    title="Total Revenue"
                    value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`}
                    icon={IndianRupee}
                    color="bg-indigo-500"
                    trend="up"
                    trendValue="15"
                />
                <StatsCard
                    title="Today's Revenue"
                    value={`₹${stats?.todayRevenue?.toLocaleString() || 0}`}
                    icon={TrendingUp}
                    color="bg-cyan-500"
                />
                <StatsCard
                    title="Net Profit"
                    value={`₹${stats?.netRevenue?.toLocaleString() || 0}`}
                    icon={TrendingUp}
                    color="bg-rose-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[450px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <IndianRupee size={20} className="text-emerald-500" /> Revenue Growth
                    </h3>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueTrends}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="period"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `₹${val}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#f43f5e"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Appointments Distribution Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[450px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <CalendarCheck size={20} className="text-blue-500" /> Booking Status
                    </h3>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={appointmentStatus}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="_id"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => val ? val.charAt(0).toUpperCase() + val.slice(1) : ''}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {appointmentStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
