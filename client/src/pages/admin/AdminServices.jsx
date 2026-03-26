import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Tag,
    Scissors,
    Clock,
    IndianRupee,
    ToggleLeft,
    ToggleRight,
    Filter,
    X,
    Sparkles,
    Smile,
    Waves,
    Wand2,
    Palette,
    Flame,
    Flower2
} from "lucide-react";
import adminService from "../../api/adminService";

const AdminServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    const categories = ['Hair', 'Nails', 'Makeup', 'Facial', 'Massage', 'Threading', 'Waxing'];

    const categoryIcons = {
        Hair: Scissors,
        Nails: Palette,
        Makeup: Wand2,
        Facial: Smile,
        Massage: Waves,
        Threading: Scissors,
        Waxing: Flame
    };

    const fetchServices = async () => {
        try {
            setLoading(true);
            const res = await adminService.getAllServices({ category: selectedCategory });
            setServices(res.data.data);
        } catch (err) {
            console.error("Error fetching services:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [selectedCategory]);

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isModalOpen]);

    const handleToggleStatus = async (id) => {
        try {
            await adminService.toggleServiceStatus(id);
            setServices(prev => prev.map(s =>
                s._id === id ? { ...s, isActive: !s.isActive } : s
            ));
        } catch (err) {
            alert("Failed to toggle status");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure? This cannot be undone.")) {
            try {
                await adminService.deleteService(id);
                setServices(prev => prev.filter(s => s._id !== id));
            } catch (err) {
                console.error("Delete failed:", err);
                alert("Failed to delete service");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Service Management</h2>
                    <p className="text-slate-500">Add, edit and manage your service offerings</p>
                </div>
                <button
                    onClick={() => { setSelectedService(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                    <Plus size={20} /> Add New Service
                </button>
            </div>

            <div className="flex gap-4 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setSelectedCategory("")}
                    className={`px-4 py-2 rounded-xl border font-bold text-sm transition-all whitespace-nowrap ${selectedCategory === "" ? "bg-rose-500 text-white border-rose-500 shadow-md" : "bg-white text-slate-600 border-slate-100 hover:border-rose-200"}`}
                >
                    All
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(prev => prev === cat ? "" : cat)}
                        className={`px-4 py-2 rounded-xl border font-bold text-sm transition-all whitespace-nowrap ${selectedCategory === cat ? "bg-rose-500 text-white border-rose-500 shadow-md" : "bg-white text-slate-600 border-slate-100 hover:border-rose-200"}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-48"></div>
                    ))
                ) : services.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                        <Scissors size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">No services found</h3>
                        <p className="text-slate-500">Add your first service to start taking bookings.</p>
                    </div>
                ) : (
                    services.map((service) => (
                        <div key={service._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow group">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-rose-50 text-rose-500 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                        {(() => {
                                            const Icon = categoryIcons[service.category] || Scissors;
                                            return <Icon size={24} />;
                                        })()}
                                    </div>
                                    <button
                                        onClick={() => handleToggleStatus(service._id)}
                                        className={`transition-colors ${service.isActive ? 'text-emerald-500' : 'text-slate-300'}`}
                                    >
                                        {service.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-1">{service.name}</h4>
                                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                                    <Tag size={12} /> {service.category}
                                </div>
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                                        <Clock size={16} className="text-rose-400" />
                                        <span>{service.duration} mins</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-900 font-bold">
                                        <IndianRupee size={16} className="text-emerald-500" />
                                        <span>{service.price}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-slate-50">
                                <button
                                    onClick={() => { setSelectedService(service); setIsModalOpen(true); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(service._id)}
                                    className="px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative my-auto">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                            <X size={24} />
                        </button>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">
                            {selectedService ? 'Edit Service' : 'Add New Service'}
                        </h3>
                        <p className="text-slate-500 mb-8 font-medium">Fill in the details for the service offering.</p>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = {
                                name: formData.get('name'),
                                description: formData.get('description'),
                                category: formData.get('category'),
                                duration: Number(formData.get('duration')),
                                price: Number(formData.get('price')),
                                bookingType: 'slot', // Default since UI doesn't have it yet
                                isActive: true
                            };

                            try {
                                if (selectedService) {
                                    await adminService.updateService(selectedService._id, data);
                                } else {
                                    await adminService.createService(data);
                                }
                                setIsModalOpen(false);
                                fetchServices();
                            } catch (err) {
                                alert(err.response?.data?.message || "Operation failed");
                            }
                        }} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Service Name</label>
                                <input name="name" defaultValue={selectedService?.name} required className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-500 focus:bg-white outline-none transition-all font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Description</label>
                                <textarea name="description" defaultValue={selectedService?.description} required className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-500 focus:bg-white outline-none transition-all font-medium h-24" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Category</label>
                                    <select name="category" defaultValue={selectedService?.category} required className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-500 focus:bg-white outline-none transition-all font-medium">
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Duration (Mins)</label>
                                    <input name="duration" type="number" defaultValue={selectedService?.duration} required className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-500 focus:bg-white outline-none transition-all font-medium" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Price (₹)</label>
                                <input name="price" type="number" defaultValue={selectedService?.price} required className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-500 focus:bg-white outline-none transition-all font-medium" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-wider rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 mt-4">
                                {selectedService ? 'Save Changes' : 'Create Service'}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminServices;
