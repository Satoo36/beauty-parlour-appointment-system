import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Star,
    Clock,
    Shield,
    Eye,
    UserPlus
} from "lucide-react";
import { staffService, userService, serviceService } from "../../api/api";
import adminService from "../../api/adminService";

const AdminStaff = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [services, setServices] = useState([]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await adminService.getAllStaff();
            setStaff(res.data.data);
        } catch (err) {
            console.error("Error fetching staff:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await adminService.getAllServices();
            setServices(res.data.data);
        } catch (err) {
            console.error("Error fetching services:", err);
        }
    };

    useEffect(() => {
        fetchStaff();
        fetchServices();
    }, []);

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

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this staff profile?")) {
            try {
                await adminService.deleteStaff(id);
                setStaff(prev => prev.filter(s => s._id !== id));
            } catch (err) {
                console.error("Delete staff failed:", err);
                alert("Failed to delete staff");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Staff Management</h2>
                    <p className="text-slate-500">Manage your team of professionals and their schedules</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedStaff(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                    <Plus size={20} /> Add Staff Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-64"></div>
                    ))
                ) : staff.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                        <UserPlus size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">No staff members found</h3>
                        <p className="text-slate-500">Add your first professional to start taking bookings.</p>
                    </div>
                ) : (
                    staff.map((member) => (
                        <div key={member._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400">
                                            {member.user?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">{member.user?.name}</h4>
                                            <p className="text-rose-500 font-medium text-sm">{Array.isArray(member.specialization) ? member.specialization.join(', ') : member.specialization}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg font-bold text-sm">
                                        <Star size={14} fill="currentColor" /> {member.rating || 'N/A'}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Clock size={16} className="text-slate-400" />
                                        <span>{member.experience} years experience</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Shield size={16} className="text-slate-400" />
                                        <span>{member.services?.length || 0} services assigned</span>
                                    </div>
                                    {member.performance && (
                                        <div className="pt-2 border-t border-slate-50">
                                            <div className="grid grid-cols-2 gap-4 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                <div>
                                                    <div className="text-slate-900 text-sm font-bold">{member.performance.completed}</div>
                                                    Completed
                                                </div>
                                                <div>
                                                    <div className="text-emerald-600 text-sm font-bold">₹{member.performance.revenue?.toLocaleString()}</div>
                                                    Revenue
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedStaff(member);
                                            setIsModalOpen(true);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all"
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(member._id)}
                                        className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div
                        className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 pb-0">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">
                                {selectedStaff ? 'Edit Staff Profile' : 'Add New Staff'}
                            </h3>
                            <p className="text-slate-500 mb-6 font-medium">
                                {selectedStaff ? 'Update profile details and assignments.' : 'Create a new staff account and profile.'}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 pt-0">
                            <form
                                id="staffForm"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    const serviceSelect = e.target.elements.services;
                                    const selectedServices = Array.from(serviceSelect.selectedOptions).map(opt => opt.value);

                                    const data = {
                                        name: formData.get('name'),
                                        email: formData.get('email'),
                                        password: formData.get('password'),
                                        specialization: formData.get('specialization'),
                                        experience: Number(formData.get('experience')),
                                        services: selectedServices
                                    };

                                    try {
                                        if (selectedStaff) {
                                            const res = await adminService.updateStaff(selectedStaff._id, data);
                                            setStaff(prev => prev.map(s => s._id === selectedStaff._id ? res.data.data : s));
                                        } else {
                                            await adminService.createStaff(data);
                                            fetchStaff();
                                        }
                                        setIsModalOpen(false);
                                    } catch (err) {
                                        console.error("Staff operation failed:", err);
                                        alert(err.response?.data?.message || "Operation failed");
                                    }
                                }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Full Name</label>
                                        <input
                                            name="name"
                                            defaultValue={selectedStaff?.user?.name}
                                            required
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-500 focus:bg-white outline-none transition-all font-medium"
                                            placeholder="Dr. Jane Smith"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Email Address</label>
                                        <input
                                            name="email"
                                            type="email"
                                            defaultValue={selectedStaff?.user?.email}
                                            required
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-500 focus:bg-white outline-none transition-all font-medium"
                                            placeholder="jane@example.com"
                                        />
                                    </div>
                                    {!selectedStaff && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Initial Password</label>
                                            <input
                                                name="password"
                                                type="password"
                                                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-500 focus:bg-white outline-none transition-all font-medium"
                                                placeholder="Staff@123"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Specialization</label>
                                        <input
                                            name="specialization"
                                            defaultValue={Array.isArray(selectedStaff?.specialization) ? selectedStaff.specialization.join(', ') : selectedStaff?.specialization}
                                            required
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-500 focus:bg-white outline-none transition-all font-medium"
                                            placeholder="e.g. Skin Care, Hair Styling"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Experience (Years)</label>
                                        <input
                                            name="experience"
                                            type="number"
                                            defaultValue={selectedStaff?.experience}
                                            required
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-500 focus:bg-white outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Assigned Services</label>
                                    <select
                                        name="services"
                                        multiple
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-500 focus:bg-white outline-none transition-all font-medium min-h-[120px]"
                                        defaultValue={selectedStaff?.services?.map(s => typeof s === 'object' ? s._id : s) || []}
                                    >
                                        {services.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hold Ctrl/Cmd to select multiple</p>
                                </div>
                            </form>
                        </div>

                        <div className="flex justify-end gap-4 p-8 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-3.5 text-slate-600 font-black uppercase tracking-wider hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="staffForm"
                                className="px-10 py-3.5 bg-slate-900 text-white font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                            >
                                {selectedStaff ? 'Update Profile' : 'Create Account'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminStaff;
