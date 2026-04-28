import { useState } from "react";
import {
    Bell,
    Send,
    Info,
    AlertTriangle,
    CheckCircle2,
    History,
    Trash2,
    Users
} from "lucide-react";
import axios from "axios";

const AdminNotifications = () => {
    const [notification, setNotification] = useState({
        title: "",
        message: "",
        type: "info",
        target: "all"
    });
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState([]);

    const types = [
        { value: 'info', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
        { value: 'warning', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
        { value: 'success', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSending(true);
            const token = localStorage.getItem('token');
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/notifications/broadcast`,
                notification,
                {
                    headers: { Authorization: `Bearer ${token}` }
                });

            setHistory(prev => [{ ...notification, timestamp: new Date() }, ...prev]);
            setNotification({ title: "", message: "", type: "info", target: "all" });
            alert("Notification broadcasted successfully!");
        } catch (err) {
            console.error("Failed to broadcast notification:", err);
            alert("Failed to send notification");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
                <p className="text-slate-500">Send real-time alerts and announcements to users</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Broadcast Form */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Send size={20} className="text-rose-500" /> Broadcast Message
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">Message Type</label>
                            <div className="grid grid-cols-3 gap-3">
                                {types.map(t => {
                                    const Icon = t.icon;
                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setNotification(prev => ({ ...prev, type: t.value }))}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${notification.type === t.value
                                                ? `border-slate-900 ${t.bg}`
                                                : 'border-slate-50 hover:border-slate-200'
                                                }`}
                                        >
                                            <Icon className={t.color} size={24} />
                                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-900">{t.value}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">Title</label>
                            <input
                                type="text"
                                value={notification.title}
                                onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                placeholder="Announcement Title"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">Message Content</label>
                            <textarea
                                value={notification.message}
                                onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[120px]"
                                placeholder="What would you like to say to everyone?"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {sending ? 'Broadcasting...' : (
                                <>
                                    <Bell size={20} /> Send Broadcast Now
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* History / Preview */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <History size={20} className="text-slate-400" /> Broadcast History
                        </h3>
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <History size={48} className="text-slate-100 mb-4" />
                                <p className="text-slate-400 font-medium">No messages sent yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((h, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {new Date(h.timestamp).toLocaleString()}
                                            </span>
                                            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${h.type === 'info' ? 'bg-blue-100 text-blue-600' :
                                                h.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                {h.type}
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-slate-900">{h.title}</h4>
                                        <p className="text-sm text-slate-500 line-clamp-2">{h.message}</p>
                                        <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
