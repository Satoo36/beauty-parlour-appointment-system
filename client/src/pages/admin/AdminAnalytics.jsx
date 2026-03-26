import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { TrendingUp, Users, Calendar, DollarSign, Activity, PieChart as PieIcon } from "lucide-react";
import adminService from "../../api/adminService";
import dayjs from "dayjs";

const AdminAnalytics = () => {
    const [data, setData] = useState({
        revenue: [],
        appointments: [],
        status: [],
        roles: []
    });
    const [loading, setLoading] = useState(true);

    const COLORS = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const [payRes, appRes, userRes] = await Promise.all([
                    adminService.getPaymentStats(),
                    adminService.getAppointmentStats(),
                    adminService.getUserStats()
                ]);

                setData({
                    revenue: payRes.data.data.revenueTrends || [],
                    appointments: appRes.data.data.statusBreakdown || [],
                    status: payRes.data.data.statusBreakdown || [],
                    roles: userRes.data.data.usersByRole || []
                });

            } catch (err) {
                console.error("Error fetching analytics:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="p-8 space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-64 bg-slate-100 rounded-[32px]"></div>
                    ))}
                </div>
                <div className="h-96 bg-slate-100 rounded-[32px]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h2 className="text-3xl font-black text-slate-900">Advanced Analytics</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">In-depth overview of your business performance</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Line Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-[450px]">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                            <DollarSign size={16} className="text-rose-500" /> Revenue Growth
                        </h3>
                    </div>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.revenue}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="period"
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    fontWeight="bold"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    fontWeight="bold"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Line
                                    name="Daily Revenue"
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#f43f5e"
                                    strokeWidth={4}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Distribution Pie Chart */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-[450px]">
                    <h3 className="font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-widest text-xs">
                        <Users size={16} className="text-blue-500" /> User Roles
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.roles}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="_id"
                                >
                                    {data.roles.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Transaction Status Chart */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-[400px]">
                    <h3 className="font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-widest text-xs">
                        <PieIcon size={16} className="text-purple-500" /> Transaction States
                    </h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.status}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="_id"
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    fontWeight="bold"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    fontWeight="bold"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="totalAmount" name="Volume (₹)" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Booking Efficiency Chart */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-[400px]">
                    <h3 className="font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-widest text-xs">
                        <Calendar size={16} className="text-amber-500" /> Booking Outcome
                    </h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.appointments} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="_id"
                                    type="category"
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    fontWeight="bold"
                                    tickLine={false}
                                    axisLine={false}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
