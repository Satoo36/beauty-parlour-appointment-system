import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentService, serviceService } from "../api/api";

function AppointmentForm({ onSuccess }) {
    const navigate = useNavigate();

    // Form State
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "", // Often optional if user is logged in, but useful for guest checkout logic if extended
        serviceId: "", // Changed from 'service' string to ID
        scheduledAt: "",
    });

    // App State
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [serviceLoading, setServiceLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Fetch Services on Load
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await serviceService.getAll();
                setServices(res.data || []);
            } catch (err) {
                console.error("Failed to load services", err);
                setError("Could not load services. Please try again later.");
            } finally {
                setServiceLoading(false);
            }
        };
        fetchServices();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        if (!form.name || !form.serviceId || !form.scheduledAt) {
            return setError("Please fill in all required fields.");
        }

        try {
            setLoading(true);
            const selectedService = services.find(s => s._id === form.serviceId);

            // Payload
            const payload = {
                customerName: form.name,
                phone: form.phone,
                serviceId: form.serviceId,
                serviceName: selectedService ? selectedService.name : "Unknown Service",
                date: form.scheduledAt, // Backend expects 'date' or 'scheduledAt', standardizing... check utils
                // If backend expects 'scheduledAt', map it:
                scheduledAt: form.scheduledAt
            };

            await appointmentService.create(payload);
            setMessage("Appointment booked successfully! Redirecting...");

            if (onSuccess) {
                onSuccess();
            } else {
                setTimeout(() => navigate('/dashboard'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to book appointment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-primary-dark py-6 px-8">
                    <h2 className="text-2xl font-serif font-bold text-white">Book Appointment</h2>
                    <p className="text-secondary-light text-sm">Fill in your details to schedule a visit.</p>
                </div>

                <div className="p-8">
                    {message && (
                        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition"
                                    placeholder="(555) 000-0000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Service</label>
                            <div className="relative">
                                <select
                                    name="serviceId"
                                    value={form.serviceId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition appearance-none bg-white"
                                    required
                                >
                                    <option value="">-- Choose a Service --</option>
                                    {services.map(s => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} - ${s.price} ({s.duration} min)
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                            {serviceLoading && <p className="text-xs text-gray-500 mt-1">Loading services...</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date & Time</label>
                            <input
                                type="datetime-local"
                                name="scheduledAt"
                                value={form.scheduledAt}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none transition"
                                required
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white font-bold py-4 rounded-lg shadow-lg hover:bg-primary-dark transition transform hover:-translate-y-1 disabled:opacity-70"
                            >
                                {loading ? "Processing..." : "Confirm Booking"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AppointmentForm;