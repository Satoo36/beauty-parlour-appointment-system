import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { serviceService } from "../api/api";

const serviceList = () => {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const servicesRes = await serviceService.getAll();
                const categoriesRes = await serviceService.getCategories();

                setServices(servicesRes.data || []);
                setCategories(["All", ...(categoriesRes.data || [])]);
            } catch (err) {
                console.error("Error fetching services", err);

                setServices([
                    { _id: '1', name: 'Classic Facial', category: 'Facial', price: 1200, duration: 60, image: "/images/services/facial/classic-facial.jpg", description: 'Deep cleansing facial for glowing skin.' },
                    { _id: '2', name: 'Gold Facial', category: 'Facial', price: 1800, duration: 75, image: "/images/services/facial/gold-facial.jpg", description: 'Gold-infused facial for bright and smooth skin.' },
                    { _id: '3', name: 'Fruit Facial', category: 'Facial', price: 1000, duration: 50, image: "/images/services/facial/fruit-facial.jpg", description: 'Natural fruit-based treatment for fresh glow.' },

                    { _id: '4', name: 'Hair Cut', category: 'Hair', price: 600, duration: 45, image: "/images/services/hair/hair cut.avif", description: 'Trendy haircut by professional stylist.' },
                    { _id: '5', name: 'Hair Spa', category: 'Hair', price: 1500, duration: 60, image: "/images/services/hair/hair-spa.jpg", description: 'Deep conditioning treatment for damaged hair.' },
                    { _id: '6', name: 'Hair Coloring (Global)', category: 'Hair', price: 3500, duration: 120, image: "/images/services/hair/hair-colouring.jpg", description: 'Full hair color with premium products.' },

                    { _id: '7', name: 'Gel Manicure', category: 'Nails', price: 1000, duration: 50, image: "/images/services/nails/gel-manicure.jpg", description: 'Long-lasting gel polish with nail shaping.' },
                    { _id: '8', name: 'Basic Manicure', category: 'Nails', price: 600, duration: 40, image: "/images/services/nails/basic-manicure.jpg", description: 'Cut, file and polish for neat hands.' },
                    { _id: '9', name: 'Pedicure', category: 'Nails', price: 800, duration: 50, image: "/images/services/nails/pedicure.jpg", description: 'Relaxing foot care treatment.' },

                    { _id: '10', name: 'Full Body Massage', category: 'Massage', price: 2500, duration: 90, image: "/images/services/massage/body-massage.jpg", description: 'Relaxing massage to relieve stress.' },
                    { _id: '11', name: 'Head Massage', category: 'Massage', price: 600, duration: 30, image: "/images/services/massage/head-massage.jpg", description: 'Oil-based head massage for relaxation.' },
                    { _id: '12', name: 'Back & Shoulder Massage', category: 'Massage', price: 1200, duration: 45, image: "/images/services/massage/back-shoulder.jpg", description: 'Relieves back and neck tension.' },

                    { _id: '13', name: 'Bridal Makeup', category: 'Makeup', price: 12000, duration: 180, image: "/images/services/makeup/bridal-makeup.jpg", description: 'Complete bridal makeup with hairstyling.' },
                    { _id: '14', name: 'Party Makeup', category: 'Makeup', price: 3500, duration: 90, image: "/images/services/makeup/party-makeup.jpg", description: 'Glam look for parties and events.' },
                    { _id: '15', name: 'Engagement Makeup', category: 'Makeup', price: 8000, duration: 150, image: "/images/services/makeup/engagement-makeup.jpg", description: 'Elegant look for engagement ceremony.' },

                    { _id: '16', name: 'Eyebrow Threading', category: 'Threading', price: 50, duration: 10, image: "/images/services/threading/eyebrow-threading.jpg", description: 'Perfect eyebrow shaping.' },
                    { _id: '17', name: 'Upper Lip Threading', category: 'Threading', price: 40, duration: 5, image: "/images/services/threading/upperlip-threading.jpg", description: 'Quick upper lip hair removal.' },
                    { _id: '18', name: 'Full Face Threading', category: 'Threading', price: 200, duration: 20, image: "/images/services/threading/fullface-threading.jpg", description: 'Complete facial hair removal.' },

                    { _id: '19', name: 'Waxing (Full Arms)', category: 'Waxing', price: 500, duration: 30, image: "/images/services/waxing/arms.jpg", description: 'Smooth and soft arms waxing.' },
                    { _id: '20', name: 'Waxing (Full Legs)', category: 'Waxing', price: 800, duration: 45, image: "/images/services/waxing/legs.jpg", description: 'Complete leg waxing service.' },
                    { _id: '21', name: 'Full Body Waxing', category: 'Waxing', price: 2500, duration: 120, image: "/images/services/waxing/body.jpg", description: 'Complete body waxing for smooth skin.' },
                ]);
                setCategories(["All", "Facial", "Hair", "Nails", "Massage", "Makeup", "Threading", "Waxing"]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredServices = selectedCategory === "All"
        ? services
        : services.filter(s => s.category === selectedCategory);

    return (
        <div className="bg-surface-100 min-h-screen py-16">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl font-serif font-bold text-center text-ink-900 mb-4">Our Services</h1>
                <p className="text-center text-ink-500 max-w-2xl mx-auto mb-12">
                    Discover our range of premium treatments designed to rejuvenate your mind, body, and spirit.
                </p>

                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                                ? "bg-rose-500 text-white shadow-lg shadow-rose-200 transform-scale-105"
                                : "bg-white text-ink-700 hover:bg-rose-50 border border-ui-200 hover:border-rose-200"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredServices.map((service) => (
                            <div key={service._id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition duration-300 overflow-hidden group border border-ui-100 hover:border-rose-100 flex flex-col">
                                <div className="h-48 bg-gray-200 relative overflow-hidden">
                                    <img
                                        src={service.image || `/images/services/default.jpg`}
                                        alt={service.name}
                                        loading="Lazy"
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "/images/services/default.jpg";
                                        }}
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-ink-900 shadow-sm">
                                        {service.duration} min
                                    </div>
                                </div>
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-serif font-semibold text-ink-900 group-hover:text-rose-500 transition-colors">{service.name}</h3>
                                        <span className="text-lg font-bold text-rose-500">{service.price}₹</span>
                                    </div>
                                    <p className="text-ink-500 text-sm mb-6 flex-grow leading-relaxed">{service.description}</p>
                                    <Link
                                        to={`/booking?service=${service._id}`}
                                        className="btn-primary w-full text-center"
                                    >
                                        Book Appointment
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default serviceList;