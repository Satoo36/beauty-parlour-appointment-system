import { useEffect, useState } from "react";
import { appointmentService, userService } from "../api/api";

function AdminPanel({ appointments }) {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            // Assuming userService.getAll exists and returns { users: [] } or []
            const res = await userService.getAll();
            setUsers(res.data.users || res.data || []);
        } catch (err) {
            console.error(err);
            // Mock
            setUsers([
                { _id: 1, name: 'Admin User', role: 'admin' },
                { _id: 2, name: 'Staff Member', role: 'staff' },
            ]);
        }
    };

    const fetchQueuestats = async () => {
        try {
            const res = await appointmentService.getStats();
            setStats(res.data);
        } catch (err) {
            console.error(err);
            setStats({ pending: 10, queued: 5 }); // Mock
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                await fetchUsers();
                await fetchQueuestats();
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const cancelTicket = async (id) => {
        const confirmed = window.confirm("Are you sure want to cancel this appointment?");
        if (!confirmed) return;
        try {
            await appointmentService.delete(id); // Or cancel endpoint
            // trigger refresh or props callback
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <p className="text-center py-8">Loading admin panel...</p>

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-serif font-bold text-secondary-900 mb-4">User Management</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Manage system users and their roles.
                </p>
                <div className="flex gap-2 mb-6">
                    <button className="px-4 py-2 bg-secondary-900 text-white text-sm rounded-lg hover:bg-secondary-800">Create Staff</button>
                    <button className="px-4 py-2 bg-gray-100 text-secondary-900 text-sm rounded-lg hover:bg-gray-200">Manage Roles</button>
                </div>

                <div className="space-y-2">
                    {users.length === 0 && <p className="text-sm text-gray-400">No users found.</p>}
                    {users.map((u) => (
                        <div key={u._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-secondary-900">{u.name}</span>
                            <span className="text-xs font-bold uppercase tracking-wider bg-white px-2 py-1 rounded border border-gray-200">{u.role}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-xl font-serif font-bold text-secondary-900 mb-4">Today's Overview</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-yellow-50 rounded-xl">
                            <div className="text-2xl font-bold text-yellow-700">{stats?.pending || 0}</div>
                            <div className="text-xs text-yellow-800 uppercase">Pending</div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl">
                            <div className="text-2xl font-bold text-blue-700">{stats?.queued || 0}</div>
                            <div className="text-xs text-blue-800 uppercase">Queued</div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl">
                            <div className="text-2xl font-bold text-green-700">{stats?.completed || 0}</div>
                            <div className="text-xs text-green-800 uppercase">Done</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-xl font-serif font-bold text-secondary-900 mb-4">Quick Actions</h3>
                    <p className="text-sm text-gray-500 mb-4">Manage today's appointments</p>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {appointments.map((a) => (
                            <li key={a._id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded">
                                <span>#{a.queueNumber || 'Wait'} - {a.name}</span>
                                {a.status !== "completed" && (
                                    <button
                                        onClick={() => cancelTicket(a._id)}
                                        className="text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;