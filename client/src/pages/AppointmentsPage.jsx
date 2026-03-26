import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import CancellationModal from '../components/CancellationModal';

const AppointmentsPage = () => {
    const { user } = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // Cancellation Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [toast, setToast] = useState('');

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? { status: filter } : {};
            const res = await appointmentService.getAll(params);
            setAppointments(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch appointments", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [filter]);

    const handleOpenCancel = (id) => {
        setSelectedId(id);
        setIsModalOpen(true);
    };

    const handleConfirmCancel = async (reason) => {
        try {
            setCancelling(true);
            await appointmentService.cancel(selectedId, { cancellationReason: reason });
            setToast('Appointment cancelled successfully.');
            setTimeout(() => setToast(''), 3000);
            setIsModalOpen(false);
            fetchAppointments();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to cancel");
        } finally {
            setCancelling(false);
        }
    };

    const statusFilters = [
        { label: 'All', value: 'all' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
    ];

    return (
        <div className="min-h-screen bg-surface-50 py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Toast */}
                {toast && (
                    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-10 font-bold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        {toast}
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <Link to="/dashboard" className="text-rose-500 font-bold flex items-center gap-2 mb-2 hover:translate-x-1 transition-transform group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-serif font-bold text-ink-900">Your Appointments</h1>
                    </div>

                    <div className="flex bg-white p-1 rounded-2xl border border-rose-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                        {statusFilters.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filter === f.value
                                        ? 'bg-rose-500 text-white shadow-md'
                                        : 'text-ink-400 hover:text-ink-600 hover:bg-rose-50/50'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-3xl p-20 text-center border border-rose-100 shadow-sm">
                        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-ink-400 font-medium">Loading your appointment history...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="bg-white rounded-3xl p-20 text-center border border-rose-100 shadow-sm">
                        <div className="text-6xl mb-6 opacity-30">📅</div>
                        <h3 className="text-2xl font-serif font-bold text-ink-900 mb-2">No appointments found</h3>
                        <p className="text-ink-500 mb-8 max-w-xs mx-auto">We couldn't find any appointments matching your filter.</p>
                        <Link to="/booking" className="px-8 py-4 bg-rose-500 text-white rounded-full font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition inline-block">
                            Book New Appointment
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {appointments.map((apt) => (
                            <div key={apt._id} className="bg-white p-6 rounded-3xl border border-ui-100 shadow-sm hover:border-rose-200 transition-colors group">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex gap-6">
                                        <div className="w-20 h-20 rounded-2xl bg-surface-50 flex items-center justify-center text-4xl shadow-inner group-hover:bg-rose-50/30 transition-colors flex-shrink-0">
                                            {apt.service?.category === 'Hair' ? '💇‍♀️' : apt.service?.category === 'Nails' ? '💅' : apt.service?.category === 'Massage' ? '💆‍♀️' : apt.service?.category === 'Threading' ? '🧵' : apt.service?.category === 'Facial' ? '🧖‍♀️' : apt.service?.category === 'Makeup' ? '💄' : '✨'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-bold text-ink-900 truncate">{apt.service?.name}</h3>
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border ${apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        apt.status === 'confirmed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            apt.status === 'cancelled' ? 'bg-ui-50 text-ui-400 border-ui-100' :
                                                                'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                            <p className="text-rose-500 font-bold text-sm mb-3">With {apt.staff?.name}</p>

                                            <div className="flex flex-wrap gap-4 text-sm text-ink-500">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-base">📅</span>
                                                    <span className="font-medium">{new Date(apt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-base">🕒</span>
                                                    <span className="font-medium">{apt.startTime} - {apt.endTime}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 font-bold text-ink-900">
                                                    <span>₹{apt.amount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row md:flex-col justify-end gap-3 min-w-[160px]">
                                        <Link
                                            to={`/dashboard/appointments/${apt._id}`}
                                            className="px-6 py-2.5 bg-ink-900 text-white text-center rounded-xl font-bold text-sm hover:bg-ink-800 transition"
                                        >
                                            View Details
                                        </Link>
                                        {apt.status === 'confirmed' && (
                                            <button
                                                onClick={() => handleOpenCancel(apt._id)}
                                                className="px-6 py-2.5 border border-rose-200 text-rose-500 rounded-xl font-bold text-sm hover:bg-rose-50 transition"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        {apt.status === 'completed' && !apt.review && (
                                            <Link
                                                to={`/dashboard/appointments/${apt._id}`}
                                                className="px-6 py-2.5 bg-emerald-500 text-white text-center rounded-xl font-bold text-sm hover:bg-emerald-600 transition"
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

            <CancellationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmCancel}
                loading={cancelling}
            />
        </div>
    );
};

export default AppointmentsPage;
