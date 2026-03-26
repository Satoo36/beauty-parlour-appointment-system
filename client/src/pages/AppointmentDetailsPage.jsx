import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { appointmentService } from '../api/api';
import CancellationModal from '../components/CancellationModal';

const AppointmentDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    // Review State (Simplified for now)
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const fetchAppointment = async () => {
        try {
            setLoading(true);
            const res = await appointmentService.getById(id);
            setAppointment(res.data.data);
            if (res.data.data.rating) setRating(res.data.data.rating);
            if (res.data.data.review) setReviewText(res.data.data.review);
        } catch (err) {
            console.error("Failed to fetch appointment details", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointment();
    }, [id]);

    const handleConfirmCancel = async (reason) => {
        try {
            setCancelling(true);
            await appointmentService.cancel(id, { cancellationReason: reason });
            setIsModalOpen(false);
            fetchAppointment();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to cancel");
        } finally {
            setCancelling(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmittingReview(true);
            await appointmentService.addReview(id, { rating, review: reviewText });
            fetchAppointment();
        } catch (err) {
            alert("Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 p-4 font-serif">
                <h2 className="text-3xl font-bold mb-4">Appointment Not Found</h2>
                <Link to="/appointments" className="px-8 py-3 bg-rose-500 text-white rounded-full font-bold shadow-lg">Back to List</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link to="/appointments" className="text-rose-500 font-bold flex items-center gap-2 mb-8 hover:translate-x-1 transition-transform group">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to All Appointments
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Details Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-rose-100 overflow-hidden relative">
                            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${appointment.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    appointment.status === 'confirmed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        appointment.status === 'cancelled' ? 'bg-ui-50 text-ui-400 border-ui-100' :
                                            'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                {appointment.status}
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                                <div className="w-24 h-24 rounded-2xl bg-surface-100 flex items-center justify-center text-5xl shadow-inner flex-shrink-0">
                                    {appointment.service?.category === 'Hair' ? '💇‍♀️' : appointment.service?.category === 'Nails' ? '💅' : appointment.service?.category === 'Massage' ? '💆‍♀️' : appointment.service?.category === 'Threading' ? '🧵' : appointment.service?.category === 'Facial' ? '🧖‍♀️' : appointment.service?.category === 'Makeup' ? '💄' : '✨'}
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-serif font-bold text-ink-900">{appointment.service?.name}</h1>
                                    <p className="text-rose-500 text-lg font-medium">With the wonderful {appointment.staff?.name}</p>
                                    <div className="flex items-center gap-4 text-ink-400 text-sm font-bold uppercase tracking-wider">
                                        <span>🕒 {appointment.service?.duration} Mins</span>
                                        <span>💰 ₹{appointment.amount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-y border-ui-50">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-ink-300 font-black uppercase tracking-widest">Date</p>
                                    <p className="font-bold text-ink-900">{new Date(appointment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-ink-300 font-black uppercase tracking-widest">Time</p>
                                    <p className="font-bold text-ink-900">{appointment.startTime} - {appointment.endTime}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-ink-300 font-black uppercase tracking-widest">Payment Status</p>
                                    <p className={`font-bold ${appointment.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{appointment.paymentStatus.toUpperCase()}</p>
                                </div>
                            </div>

                            {appointment.notes && (
                                <div className="mt-6">
                                    <p className="text-[10px] text-ink-300 font-black uppercase tracking-widest mb-2">My Notes</p>
                                    <div className="bg-surface-50 p-4 rounded-2xl border border-ui-100 italic text-ink-600">
                                        "{appointment.notes}"
                                    </div>
                                </div>
                            )}

                            {appointment.status === 'cancelled' && appointment.cancellationReason && (
                                <div className="mt-6">
                                    <p className="text-[10px] text-rose-300 font-black uppercase tracking-widest mb-2">Cancellation Reason</p>
                                    <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-rose-700 italic">
                                        "{appointment.cancellationReason}"
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Review Section */}
                        {appointment.status === 'completed' && (
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-ui-100">
                                <h3 className="text-2xl font-serif font-bold text-ink-900 mb-6">Experience Feedback</h3>

                                {appointment.review ? (
                                    <div className="space-y-4">
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={`text-xl ${i < appointment.rating ? 'text-amber-400' : 'text-ui-200'}`}>★</span>
                                            ))}
                                        </div>
                                        <p className="text-ink-600 italic leading-relaxed">"{appointment.review}"</p>
                                        <div className="pt-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Verified Review</span>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleReviewSubmit} className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="block text-sm font-bold text-ink-700 uppercase tracking-wider">How was your session?</label>
                                            <div className="flex gap-4">
                                                {[1, 2, 3, 4, 5].map((num) => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => setRating(num)}
                                                        className={`w-12 h-12 rounded-xl text-xl transition-all ${rating >= num ? 'bg-amber-400 text-white border-amber-500 scale-110 shadow-lg shadow-amber-100' : 'bg-surface-100 text-ui-300 border-ui-200'
                                                            } border font-bold`}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label htmlFor="review" className="block text-sm font-bold text-ink-700 uppercase tracking-wider">Review Details (Optional)</label>
                                            <textarea
                                                id="review"
                                                rows="4"
                                                className="w-full px-5 py-4 rounded-2xl bg-surface-50 border border-ui-200 focus:border-rose-300 focus:ring-4 focus:ring-rose-50 outline-none transition-all resize-none text-ink-900 placeholder:text-ink-300"
                                                placeholder="Tell us what you loved about our service!"
                                                value={reviewText}
                                                onChange={(e) => setReviewText(e.target.value)}
                                            ></textarea>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="w-full py-4 bg-ink-900 text-white font-bold rounded-2xl hover:bg-ink-800 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {submittingReview ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Submit Feedback'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Side Info & Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-ui-100 shadow-sm relative overflow-hidden text-center">
                            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 border-4 border-rose-50 shadow-md">
                                <img
                                    src={appointment.staff?.avatar?.url || "/placeholder-avatar.png"}
                                    alt={appointment.staff?.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h4 className="font-serif font-bold text-ink-900 text-lg mb-1">{appointment.staff?.name}</h4>
                            <p className="text-rose-500 font-medium text-sm mb-6">Expert Professional</p>

                            <div className="flex flex-col gap-3">
                                <button className="w-full py-3 border border-ui-200 text-ink-600 font-bold rounded-2xl hover:bg-rose-50/50 hover:text-rose-500 hover:border-rose-200 transition">
                                    Message Staff
                                </button>
                                {appointment.status === 'confirmed' && (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="w-full py-3 bg-rose-50 text-rose-500 font-bold rounded-2xl hover:bg-rose-100 transition"
                                    >
                                        Cancel Visit
                                    </button>
                                )}
                                <Link to="/contact" className="text-xs font-bold text-ink-300 hover:text-ink-600 transition underline underline-offset-4">Need help?</Link>
                            </div>
                        </div>

                        <div className="bg-ink-900 text-white p-8 rounded-3xl shadow-xl shadow-ink-200 relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                            <h4 className="font-serif font-bold text-xl mb-4 italic">Next Visit Deal</h4>
                            <p className="text-ui-300 text-sm mb-6 leading-relaxed">Book another session today and get 10% off on your next visit!</p>
                            <Link to="/booking" className="block text-center py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition shadow-lg shadow-rose-900/40">
                                Claim Discount
                            </Link>
                        </div>
                    </div>
                </div>
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

export default AppointmentDetailsPage;
