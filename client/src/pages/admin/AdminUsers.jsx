import { useState, useEffect } from "react";
import {
    Search,
    ShieldCheck,
    User,
    Mail,
    Phone,
    ChevronLeft,
    ChevronRight,
    Trash2
} from "lucide-react";
import adminService from "../../api/adminService";
import dayjs from "dayjs";

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        role: "",
        search: "",
        isActive: ""
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await adminService.getAllUsers({ ...filters, page, limit: 10 });
            console.log("Users API Response Data:", res.data);

            // Strictly handle various structures
            const userData = Array.isArray(res.data)
                ? res.data
                : (res.data?.users || res.data?.data || []);

            setUsers(userData);
            setTotalPages(res.data?.pages || 1);
            setTotalUsers(userData.length || res.data?.total || 0);
        } catch (err) {
            console.error("Error fetching users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filters.role, filters.isActive, filters.search, page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const handleRoleUpdate = async (id, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            try {
                await adminService.updateUserRole(id, newRole);
                fetchUsers();
            } catch (err) {
                alert("Failed to update role");
            }
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm("Are you sure? This will delete the user and all associated data.")) {
            try {
                await adminService.deleteUser(id);
                fetchUsers();
            } catch (err) {
                alert("Failed to delete user");
            }
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'staff': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                    <p className="text-slate-500">Monitor and manage all {totalUsers} registered accounts</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                    />
                </form>
                <select
                    value={filters.role}
                    onChange={(e) => { setFilters(prev => ({ ...prev, role: e.target.value })); setPage(1); }}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                </select>
                <select
                    value={filters.isActive}
                    onChange={(e) => { setFilters(prev => ({ ...prev, isActive: e.target.value })); setPage(1); }}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                >
                    <option value="">Status (All)</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User Details</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Activity</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Registered</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-6">
                                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-slate-500 font-medium">No users found matching your criteria.</td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{u.name}</div>
                                                    <div className="text-xs text-slate-500 flex flex-col">
                                                        <span className="flex items-center gap-1"><Mail size={12} /> {u.email}</span>
                                                        {u.phone && <span className="flex items-center gap-1"><Phone size={12} /> {u.phone}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getRoleBadge(u.role)}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-4">
                                                <div className="text-center">
                                                    <div className="text-sm font-bold text-slate-900">{u.visits || 0}</div>
                                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Visits</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-sm font-bold text-rose-500">₹{u.spent?.toLocaleString() || 0}</div>
                                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Spent</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {dayjs(u.createdAt).format('DD MMM, YYYY')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleRoleUpdate(u._id, u.role)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Toggle Admin Role"
                                                >
                                                    <ShieldCheck size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u._id)}
                                                    className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-medium">
                        Showing page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
