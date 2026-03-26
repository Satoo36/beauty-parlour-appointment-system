import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { staffService } from '../../api/api';
import StaffSummaryCards from '../../components/staff/StaffSummaryCards';
import StaffAppointmentsTable from '../../components/staff/StaffAppointmentsTable';
import QueueBoard from '../../components/QueueBoard';

const StaffDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("today");

    const isToday = (dateString) => {
        if (!dateString) return false;
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
        const appointmentDateStr = new Date(dateString).toLocaleDateString('en-CA');
        return todayStr === appointmentDateStr;
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [summaryRes, appointmentsRes] = await Promise.all([
                staffService.getDashboardSummary(),
                staffService.getDashboardAppointments() // Fetch all for frontend filtering
            ]);

            setStats(summaryRes.data.data);
            setAppointments(appointmentsRes.data.data);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role !== 'staff') {
            navigate('/dashboard');
            return;
        }
        console.log("Navigated to Staff Dashboard");
        fetchDashboardData();
    }, [user]);

    const filteredAppointments = appointments.filter(app => {
        const status = app.status?.toLowerCase().trim();
        if (filter === "today") {
            return isToday(app.date);
        }
        if (filter === "pending") {
            return status === "pending";
        }
        if (filter === "confirmed") {
            return status === "confirmed";
        }
        if (filter === "completed") {
            return status === "completed";
        }
        return true; // "all"
    });

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await staffService.updateAppointmentStatus(id, newStatus);
            // After success -> refetch appointments
            fetchDashboardData();
        } catch (err) {
            alert("Failed to update status: " + (err.response?.data?.message || err.message));
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-ui-100 sticky top-0 z-30">
                <div className="container mx-auto px-4 py-6 max-w-7xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-rose-200">
                                {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-ink-900">Professional Dashboard</h1>
                                <p className="text-ink-500 text-sm">Welcome back, <span className="text-rose-600 font-bold">{user.name}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchDashboardData}
                                className="p-3 text-ink-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Refresh Data"
                            >
                                🔄
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-6 py-3 bg-ink-900 text-white text-sm font-bold rounded-xl hover:bg-ink-800 transition shadow-lg shadow-ui-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-8 max-w-7xl">
                {error && (
                    <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 animate-fade-in">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Stats Section */}
                <StaffSummaryCards stats={stats} />

                {/* Management Section */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h2 className="text-xl font-serif font-bold text-ink-900">Appointment Management</h2>

                        {/* Filters */}
                        <div className="flex bg-white p-1 rounded-xl border border-ui-100 shadow-sm self-end">
                            {[
                                { id: 'today', label: 'Today' },
                                { id: 'queue', label: 'Live Queue' },
                                { id: 'pending', label: 'Pending' },
                                { id: 'confirmed', label: 'Confirmed' },
                                { id: 'completed', label: 'Completed' },
                                { id: 'all', label: 'All' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id)}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${filter === tab.id
                                        ? 'bg-rose-500 text-white shadow-md'
                                        : 'text-ink-400 hover:text-rose-500'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filter === 'queue' ? (
                        <QueueBoard 
                            appointments={appointments} 
                            user={user} 
                            onRefresh={fetchDashboardData} 
                        />
                    ) : (
                        <StaffAppointmentsTable
                            appointments={filteredAppointments}
                            onUpdateStatus={handleUpdateStatus}
                            loading={loading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
