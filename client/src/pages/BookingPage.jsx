import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { serviceService, staffService, slotService, appointmentService, paymentService } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { loadRazorpay } from "../utils/razorpayLoader";

const BookingPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [step, setStep] = useState(1);
    const [services, setServices] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);

    const [selection, setSelection] = useState({
        serviceId: searchParams.get('service') || '',
        staffId: searchParams.get('staff') || '',
        date: '',
        slot: null,
    });

    const [loading, setLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [staffLoading, setStaffLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState('');

    // Load services
    useEffect(() => {
        const loadServices = async () => {
            setServicesLoading(true);
            setError('');
            try {
                const res = await serviceService.getAll();
                const data = res.data?.data || res.data || [];
                setServices(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error loading services", err);
                setError('Failed to load services. Please make sure the server is running.');
            } finally {
                setServicesLoading(false);
            }
        };
        loadServices();
    }, []);

    // Load staff
    useEffect(() => {
        const loadStaff = async () => {
            setStaffLoading(true);
            try {
                const res = await staffService.getAll(selection.serviceId ? { service: selection.serviceId } : {});
                const data = res.data?.data || res.data || [];
                setStaffList(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error loading staff", err);
            } finally {
                setStaffLoading(false);
            }
        };
        loadStaff();
    }, [selection.serviceId]);

    // Load available slots
    useEffect(() => {
        if (selection.serviceId && selection.staffId && selection.date) {
            const fetchSlots = async () => {
                setLoading(true);
                try {
                    const res = await slotService.getAvailable({
                        date: selection.date,
                        staff: selection.staffId,
                        service: selection.serviceId
                    });
                    const data = res.data?.data || res.data || [];
                    setAvailableSlots(Array.isArray(data) ? data : []);
                } catch (err) {
                    console.error(err);
                    setAvailableSlots([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchSlots();
        }
    }, [selection.serviceId, selection.staffId, selection.date]);

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleBook = async () => {
        setBookingLoading(true);
        try {
            const slotObj = selection.slot;
            const slotTime = slotObj?.startTime || slotObj?.time || slotObj;

            if (!slotTime) {
                alert("Please select a slot");
                setBookingLoading(false);
                return;
            }

            const bookingData = {
                service: selection.serviceId,
                staff: selection.staffId,
                date: selection.date,
                slotTime: slotTime,
                slot: slotObj?._id, // Optional, backend will find/create if missing
                notes: "",
            };

            // 1. Create Razorpay Order
            const orderRes = await paymentService.createOrder({
                serviceId: selection.serviceId,
                staffId: selection.staffId,
                date: selection.date,
                slotTime: slotTime
            });

            const { order, key, preill } = orderRes.data.data;

            // 2. Open Razorpay Checkout
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                alert("Razorpay SDK failed to load. Are you online?");
                setBookingLoading(false);
                return;
            }

            const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || key;

            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency,
                name: "Glamour Beauty Parlour",
                description: "Appointment Booking",
                image: "/image.png", // Ensure this exists or use a placeholder
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 3. Verify Payment & Create Booking
                        const verifyRes = await paymentService.verify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            service: selection.serviceId,
                            staff: selection.staffId,
                            date: selection.date,
                            slot: slotObj?._id,
                            slotTime: slotTime,
                            amount: order.amount / 100, // INR to units
                            notes: ""
                        });

                        if (verifyRes.data.success) {
                            navigate('/dashboard', {
                                state: { message: "Appointment booked successfully! ✨" }
                            });
                        }
                    } catch (err) {
                        console.error("Verification failed:", err);
                        alert("Payment successful but booking failed: " + (err.response?.data?.message || err.message));
                    } finally {
                        setBookingLoading(false);
                    }
                },
                prefill: {
                    name: preill?.name || user?.name || "",
                    email: preill?.email || user?.email || "",
                    contact: preill?.contact || user?.phone || ""
                },
                notes: {
                    address: "Glamour Beauty Parlour"
                },
                theme: {
                    color: "#e11d48" // Rose-600
                },
                modal: {
                    ondismiss: function () {
                        setBookingLoading(false);
                    }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                alert("Payment Failed: " + response.error.description);
                setBookingLoading(false);
            });
            rzp1.open();

        } catch (err) {
            console.error("Booking initialization failed", err);
            alert("Booking failed: " + (err.response?.data?.message || err.message));
            setBookingLoading(false);
        }
    };

    const renderServiceSelection = () => (
        <div>
            {servicesLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-ink-500">Loading services...</p>
                </div>
            ) : error ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">⚠️</div>
                    <p className="text-rose-600 font-medium mb-2">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition"
                    >
                        Retry
                    </button>
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">📋</div>
                    <p className="text-ink-500 font-medium">No services available at the moment.</p>
                    <p className="text-ink-300 text-sm mt-2">Please check back later or contact us.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(s => (
                        <div
                            key={s._id}
                            onClick={() => setSelection({ ...selection, serviceId: s._id })}
                            className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selection.serviceId === s._id
                                ? 'border-rose-500 bg-rose-50 shadow-md'
                                : 'border-ui-200 hover:border-rose-300 hover:shadow-sm'}`}
                        >
                            <h4 className="font-bold text-ink-900 text-lg">{s.name}</h4>
                            <p className="text-sm text-ink-500 mt-1">{s.description}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <span className="text-rose-600 font-semibold">₹{s.price}</span>
                                <span className="text-ink-300">•</span>
                                <span className="text-ink-500 text-sm">{s.duration} min</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderStaffSelection = () => (
        <div>
            {staffLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-ink-500">Loading professionals...</p>
                </div>
            ) : staffList.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">👤</div>
                    <p className="text-ink-500 font-medium">No staff available at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {staffList.map(s => {
                        const staffName = s.user?.name || s.name || 'Staff Member';
                        const staffRole = s.specialization || s.role || 'Professional';
                        const staffImage = s.user?.avatar?.url || s.image || "/images/staff/default.jpg";

                        return (
                            <div
                                key={s._id}
                                onClick={() => setSelection({ ...selection, staffId: s.user?._id || s.user })}
                                className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center ${selection.staffId === (s.user?._id || s.user)
                                    ? 'border-rose-500 bg-rose-50 shadow-md'
                                    : 'border-ui-200 hover:border-rose-300 hover:shadow-sm'}`}
                            >
                                <div className="w-16 h-16 rounded-full bg-rose-100 mx-auto mb-3 overflow-hidden flex items-center justify-center">
                                    <img
                                        src={staffImage}
                                        alt={staffName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement.innerHTML = `<span class="text-2xl text-rose-400">${staffName.charAt(0).toUpperCase()}</span>`;
                                        }}
                                    />
                                </div>
                                <h4 className="font-bold text-ink-900">{staffName}</h4>
                                <p className="text-sm text-ink-500 mt-1">{staffRole}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderDateSlotSelection = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Select Date</label>
                <input
                    type="date"
                    className="w-full p-3 border border-ui-300 rounded-lg outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition bg-white text-ink-900"
                    min={new Date().toLocaleDateString('en-CA')}
                    value={selection.date}
                    onChange={(e) => setSelection({ ...selection, date: e.target.value, slot: null })}
                />
            </div>
            {selection.date && (
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">Available Slots</label>
                    {loading ? (
                        <div className="flex items-center gap-3 py-8 justify-center">
                            <div className="w-6 h-6 border-3 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
                            <p className="text-ink-500">Loading available slots...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                            {availableSlots.length === 0 ? (
                                <div className="col-span-full text-center py-8">
                                    <div className="text-4xl mb-3">🕐</div>
                                    <p className="text-rose-500 font-medium">No slots available for this date.</p>
                                    <p className="text-ink-300 text-sm mt-1">Try selecting a different date.</p>
                                </div>
                            ) : (
                                availableSlots.map((slot, i) => {
                                    const slotTime = slot.startTime || slot.time || slot;
                                    const isSelected = selection.slot?._id === slot._id ||
                                        selection.slot === slot;

                                    return (
                                        <button
                                            key={slot._id || i}
                                            onClick={() => setSelection({ ...selection, slot: slot })}
                                            className={`py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${isSelected
                                                ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                                                : 'bg-white text-ink-700 border-ui-200 hover:border-rose-300 hover:shadow-sm'}`}
                                        >
                                            {slotTime}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderReview = () => {
        const selectedService = services.find(s => s._id === selection.serviceId);
        const selectedStaff = staffList.find(s => (s.user?._id || s.user) === selection.staffId);
        const staffName = selectedStaff?.user?.name || selectedStaff?.name || 'N/A';
        const slotTime = selection.slot?.startTime || selection.slot?.time || selection.slot;

        return (
            <div className="space-y-4 bg-surface-200 p-6 rounded-xl">
                <div className="flex justify-between items-center py-2">
                    <span className="text-ink-500">Service</span>
                    <span className="font-semibold text-ink-900">{selectedService?.name || 'N/A'}</span>
                </div>
                <div className="border-t border-ui-200"></div>
                <div className="flex justify-between items-center py-2">
                    <span className="text-ink-500">Professional</span>
                    <span className="font-semibold text-ink-900">{staffName}</span>
                </div>
                <div className="border-t border-ui-200"></div>
                <div className="flex justify-between items-center py-2">
                    <span className="text-ink-500">Date & Time</span>
                    <span className="font-semibold text-ink-900">{selection.date} at {slotTime}</span>
                </div>
                <div className="border-t-2 border-rose-200 pt-4 mt-2">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-ink-900">Total</span>
                        <span className="font-bold text-lg text-rose-600">₹{selectedService?.price || 0}</span>
                    </div>
                </div>
            </div>
        );
    };

    const stepLabels = ["Service", "Professional", "Date & Time", "Review"];

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <h1 className="text-3xl font-serif font-bold text-center text-ink-900 mb-8">Book Your Appointment</h1>

            {/* Step indicators */}
            <div className="flex justify-between mb-12 relative">
                <div className="absolute top-5 left-0 w-full h-0.5 bg-ui-200" style={{ zIndex: 0 }}></div>
                <div
                    className="absolute top-5 left-0 h-0.5 bg-rose-500 transition-all duration-500"
                    style={{ width: `${((step - 1) / 3) * 100}%`, zIndex: 1 }}
                ></div>
                {[1, 2, 3, 4].map(num => (
                    <div key={num} className="flex flex-col items-center relative" style={{ zIndex: 2 }}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= num
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-ui-200 text-ink-500'}`}
                        >
                            {step > num ? '✓' : num}
                        </div>
                        <span className={`text-xs mt-2 font-medium ${step >= num ? 'text-rose-600' : 'text-ink-300'}`}>
                            {stepLabels[num - 1]}
                        </span>
                    </div>
                ))}
            </div>

            {/* Content card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-xl font-bold mb-6 text-ink-900">
                    {step === 1 && "Select Service"}
                    {step === 2 && "Choose Professional"}
                    {step === 3 && "Pick a Date & Time"}
                    {step === 4 && "Review & Confirm"}
                </h2>

                <div className="min-h-[300px]">
                    {step === 1 && renderServiceSelection()}
                    {step === 2 && renderStaffSelection()}
                    {step === 3 && renderDateSlotSelection()}
                    {step === 4 && renderReview()}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-ui-200">
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className={`px-6 py-2.5 rounded-full font-medium transition-all ${step === 1
                            ? 'invisible'
                            : 'text-ink-500 hover:text-ink-900 hover:bg-surface-200'}`}
                    >
                        ← Back
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={handleNext}
                            disabled={
                                (step === 1 && !selection.serviceId) ||
                                (step === 2 && !selection.staffId) ||
                                (step === 3 && (!selection.date || !selection.slot))
                            }
                            className="px-8 py-3 bg-rose-500 text-white rounded-full font-medium shadow-md hover:bg-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next Step →
                        </button>
                    ) : (
                        <button
                            onClick={handleBook}
                            disabled={bookingLoading}
                            className="px-8 py-3 bg-rose-600 text-white rounded-full font-medium shadow-md hover:bg-rose-700 transition-all disabled:opacity-70"
                        >
                            {bookingLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Confirming...
                                </span>
                            ) : "✓ Confirm Booking"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingPage;