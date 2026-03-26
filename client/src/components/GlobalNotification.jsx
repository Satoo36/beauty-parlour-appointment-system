import { useState, useEffect } from "react";
import useSocket from "../hooks/useSocket";
import { Bell, X, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

const GlobalNotification = () => {
    const [notifications, setNotifications] = useState([]);
    const { on, off } = useSocket();

    useEffect(() => {
        const handler = (data) => {
            const newNotification = {
                ...data,
                id: Date.now(),
            };
            setNotifications(prev => [newNotification, ...prev]);

            // Auto remove after 8 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
            }, 8000);
        };

        on('broadcast-notification', handler);
        return () => off('broadcast-notification', handler);
    }, [on, off]);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-24 right-6 z-[200] space-y-4 max-w-sm w-full">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-right-10 duration-500"
                >
                    <div className="p-4 flex gap-4">
                        <div className={`p-2 rounded-xl flex-shrink-0 flex items-center justify-center ${n.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                n.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-blue-100 text-blue-600'
                            }`}>
                            {n.type === 'warning' ? <AlertTriangle size={20} /> :
                                n.type === 'success' ? <CheckCircle2 size={20} /> :
                                    <Info size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-900 text-sm truncate">{n.title}</h4>
                                <button onClick={() => removeNotification(n.id)} className="text-slate-400 hover:text-slate-600">
                                    <X size={16} />
                                </button>
                            </div>
                            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                                {n.message}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                    Broadcast by {n.sender || 'Admin'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="h-1 bg-slate-100 w-full overflow-hidden">
                        <div className={`h-full animate-progress-shrink ${n.type === 'warning' ? 'bg-amber-500' :
                                n.type === 'success' ? 'bg-emerald-500' :
                                    'bg-blue-500'
                            }`} style={{ animationDuration: '8s' }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GlobalNotification;
