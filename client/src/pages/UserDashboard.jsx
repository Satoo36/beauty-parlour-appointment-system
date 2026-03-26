import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appointmentService } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import CancellationModal from "../components/CancellationModal";

// Membership Section Component
const MembershipSection = ({ visits }) => {
    let level = 'Classic';
    let nextLevel = 'Gold';
    let progress = (visits / 10) * 100;
    let message = `${10 - visits} visits away from Gold`;

    if (visits >= 20) {
        level = 'Platinum';
        nextLevel = 'Max';
        progress = 100;
        message = 'You are a Platinum Member!';
    } else if (visits >= 10) {
        level = 'Gold';
        nextLevel = 'Platinum';
        progress = ((visits - 10) / 10) * 100;
        message = `${20 - visits} visits away from Platinum`;
    }

    return (
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-2xl text-white shadow-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-rose-100 font-bold uppercase tracking-widest text-[10px]">Member Status</span>
                    <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">👑</span>
                </div>
                <div className="text-3xl font-serif font-bold mb-4 italic">{level} Member</div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-rose-100">
                        <span>Progress to {nextLevel}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-rose-900/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-rose-100 text-xs font-medium pt-1">{message}</p>
                </div>
            </div>
        </div>
    );
};

const UserDashboardView = ({ user, appointments, loading, stats, upcomingAppointment, handleOpenCancelModal }) => {
    const completedVisits = stats?.statusBreakdown?.find(s => s._id === 'completed')?.count || 0;

    return (
        <div className="space-y-8">
            {/* 1. Welcome Banner */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-rose-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-0 opacity-50"></div>
                <div className="relative z-10 w-full md:w-2/3">
                    <h2 className="text-4xl font-serif font-bold text-ink-900 mb-2">
                        Welcome back, {user.name.split(' ')[0]}!
                    </h2>
                    <p className="text-ink-500 text-lg">
                        You have <span className="font-bold text-rose-600">{stats?.statusBreakdown?.find(s => s._id === 'confirmed')?.count || 0}</span> active {stats?.statusBreakdown?.find(s => s._id === 'confirmed')?.count === 1 ? 'appointment' : 'appointments'}.
                    </p>
                </div>
                <div className="relative z-10">
                    <Link to="/booking" className="inline-flex items-center px-8 py-4 bg-rose-500 text-white font-bold rounded-full shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all transform hover:-translate-y-1 active:scale-95 whitespace-nowrap">
                        <span className="mr-2">✨</span> Book Appointment
                    </Link>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Upcoming & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Quick Stats Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-ui-100 shadow-sm">
                            <div className="text-rose-500 text-xl mb-1">📅</div>
                            <div className="text-2xl font-bold text-ink-900">{stats?.totalAppointments || 0}</div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-ink-400">Total</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-ui-100 shadow-sm">
                            <div className="text-emerald-500 text-xl mb-1">✅</div>
                            <div className="text-2xl font-bold text-ink-900">{completedVisits}</div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-ink-400">Done</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-ui-100 shadow-sm">
                            <div className="text-amber-500 text-xl mb-1">⏳</div>
                            <div className="text-2xl font-bold text-ink-900">{stats?.statusBreakdown?.find(s => s._id === 'confirmed')?.count || 0}</div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-ink-400">Active</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-ui-100 shadow-sm">
                            <div className="text-ui-400 text-xl mb-1">🚫</div>
                            <div className="text-2xl font-bold text-ink-900">{stats?.statusBreakdown?.find(s => s._id === 'cancelled')?.count || 0}</div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-ink-400">Cancelled</div>
                        </div>
                    </div>

                    {/* Loyalty / Membership Section */}
                    <MembershipSection visits={completedVisits} />

                    {/* Upcoming Appointment Card */}
                    <div className="bg-white p-6 rounded-2xl border border-ui-100 shadow-sm">
                        <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center">
                            <span className="mr-2 text-rose-500">📅</span> Upcoming Next
                        </h3>
                        {upcomingAppointment ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                                    <div className="font-bold text-ink-900 text-lg line-clamp-1">{upcomingAppointment.service?.name || "Service"}</div>
                                    <div className="text-rose-600 text-sm font-medium">with {upcomingAppointment.staff?.name || "Professional"}</div>
                                </div>
                                <div className="flex justify-between items-center text-ink-700">
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase text-ink-400 font-bold">Date</span>
                                        <span className="font-bold">{new Date(upcomingAppointment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-xs uppercase text-ink-400 font-bold">Time</span>
                                        <span className="font-bold">{upcomingAppointment.startTime}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Link to={`/dashboard/appointments/${upcomingAppointment._id}`} className="block text-center py-2.5 bg-ink-900 text-white rounded-xl text-sm font-bold hover:bg-ink-800 transition">
                                        Manage Appointment
                                    </Link>
                                    <button
                                        onClick={() => handleOpenCancelModal(upcomingAppointment._id)}
                                        className="block w-full text-center py-2.5 border border-rose-200 text-rose-500 rounded-xl text-sm font-bold hover:bg-rose-50 transition"
                                    >
                                        Cancel Appointment
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-surface-50 rounded-xl border border-dashed border-ui-200">
                                <p className="text-ink-400 text-sm">No upcoming visits booked.</p>
                                <Link to="/booking" className="text-rose-500 text-sm font-bold mt-2 inline-block hover:underline">Book Now</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Recent Activity */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-ui-100 overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-ui-100 flex justify-between items-center">
                            <h3 className="text-xl font-serif font-bold text-ink-900">Recent Activity</h3>
                            <Link to="/appointments" className="text-sm text-rose-500 hover:text-rose-600 font-bold bg-rose-50 px-3 py-1 rounded-full">View History →</Link>
                        </div>

                        <div className="flex-grow">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
                                    <p className="text-ink-400 font-medium">Fetching your beauty logs...</p>
                                </div>
                            ) : appointments.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="text-6xl mb-6 opacity-30">💆‍♀️</div>
                                    <h4 className="text-xl font-bold text-ink-900 mb-2">No activity found</h4>
                                    <p className="text-ink-500 mb-8 max-w-xs mx-auto">Ready to start your beauty journey with us?</p>
                                    <Link to="/booking" className="px-8 py-3 bg-rose-500 text-white rounded-full font-bold shadow-md hover:bg-rose-600 transition">
                                        Start Booking
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-ui-50">
                                    {appointments.map((apt) => (
                                        <div key={apt._id} className="p-6 flex flex-col sm:flex-row justify-between items-center hover:bg-rose-50/20 transition group gap-4">
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center text-2xl shadow-inner group-hover:bg-white transition flex-shrink-0">
                                                    {apt.service?.category === 'Hair' ? '💇‍♀️' : apt.service?.category === 'Nails' ? '💅' : apt.service?.category === 'Massage' ? '💆‍♀️' : apt.service?.category === 'Threading' ? '🧵' : apt.service?.category === 'Facial' ? '🧖‍♀️' : apt.service?.category === 'Makeup' ? '💄' : '✨'}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-ink-900 truncate">{apt.service?.name || "Beauty Service"}</h4>
                                                    <p className="text-xs text-ink-400 uppercase font-black tracking-widest mt-0.5">With {apt.staff?.name || "Professional"}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 md:gap-8">
                                                <div className="text-left sm:text-right flex-shrink-0">
                                                    <div className="font-bold text-ink-900">
                                                        {new Date(apt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                    <div className="text-[10px] text-ink-400 font-bold uppercase tracking-wider">{apt.startTime} • ₹{apt.amount || apt.service?.price}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase shadow-sm border ${apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        apt.status === 'confirmed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            apt.status === 'cancelled' ? 'bg-ui-50 text-ui-400 border-ui-100' :
                                                                'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>
                                                        {apt.status}
                                                    </span>
                                                    {/* 3. Per-appointment cancellation button */}
                                                    {apt.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => handleOpenCancelModal(apt._id)}
                                                            className="text-[10px] font-bold text-rose-400 hover:text-rose-600 transition underline underline-offset-2"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    {apt.status === 'completed' && !apt.review && (
                                                        <Link
                                                            to={`/dashboard/appointments/${apt._id}`}
                                                            className="text-[10px] font-bold text-emerald-500 hover:text-emerald-700 transition"
                                                        >
                                                            Leave Review
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function UserDashboard() {
    const { user } = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState(null);
    const [upcomingAppointment, setUpcomingAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [cancellationLoading, setCancellationLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [apptsRes, statsRes, upcomingRes] = await Promise.all([
                appointmentService.getAll({ limit: 10 }),
                appointmentService.getStats(),
                appointmentService.getAll({ upcoming: true, limit: 1 })
            ]);
            setAppointments(apptsRes.data.data || []);
            setStats(statsRes.data.data || null);
            setUpcomingAppointment(upcomingRes.data.data?.[0] || null);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'user') {
            loadData();
        }
    }, [user?.role]);

    const handleOpenCancelModal = (id) => {
        setSelectedAppointmentId(id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (cancellationLoading) return;
        setIsModalOpen(false);
        setSelectedAppointmentId(null);
    };

    const handleConfirmCancel = async (reason) => {
        try {
            setCancellationLoading(true);
            await appointmentService.cancel(selectedAppointmentId, { cancellationReason: reason });

            // Success feedback
            setSuccessMessage('Appointment cancelled successfully.');
            setTimeout(() => setSuccessMessage(''), 3000);

            setIsModalOpen(false);
            setSelectedAppointmentId(null);

            // Refresh data
            await loadData();
        } catch (err) {
            alert("Failed to cancel: " + (err.response?.data?.message || err.message));
        } finally {
            setCancellationLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-surface-50 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Success Toast */}
                {successMessage && (
                    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-10 duration-300 font-bold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        {successMessage}
                    </div>
                )}

                <UserDashboardView
                    user={user}
                    appointments={appointments}
                    loading={loading}
                    stats={stats}
                    upcomingAppointment={upcomingAppointment}
                    handleOpenCancelModal={handleOpenCancelModal}
                />
            </div>

            {/* 2. Professional Cancel Appointment Modal */}
            <CancellationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmCancel}
                loading={cancellationLoading}
            />
        </div>
    );
}

export default UserDashboard;
