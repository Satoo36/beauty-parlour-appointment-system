import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { appointmentService } from "../api/api";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");

function QueueBoard({ appointments, user, onRefresh }) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Derived State
    const sortedQueue = [...appointments]
        .filter((a) => a.queueNumber !== null)
        .sort((a, b) => a.queueNumber - b.queueNumber);

    const current = sortedQueue.find((a) => a.status === "in_service" || a.status === "in-service" || a.status === "in-progress");
    const waiting = sortedQueue.filter((a) => a.status === "queued" || a.status === "waiting" || a.status === "pending");
    const completed = sortedQueue
        .filter((a) => a.status === "completed")
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5);

    const nextUp = waiting[0];

    useEffect(() => {
        const handleUpdate = () => {
            setIsRefreshing(true);
            onRefresh();
            setTimeout(() => setIsRefreshing(false), 1000);
        };

        socket.on("appointment:created", handleUpdate);
        socket.on("appointment:updated", handleUpdate);
        socket.on("queue:update", handleUpdate);

        return () => {
            socket.off("appointment:created", handleUpdate);
            socket.off("appointment:updated", handleUpdate);
            socket.off("queue:update", handleUpdate);
        };
    }, [onRefresh]);

    const handleCallToken = async (id) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            if (current && current._id !== id) {
                await appointmentService.updateStatus(current._id, "completed");
            }
            await appointmentService.updateStatus(id, "in-progress");
            socket.emit("queue:update");
            onRefresh();
        } catch (err) {
            console.error("Failed to call token:", err);
            alert("Failed to update status: " + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinishSession = async () => {
        if (!current || isLoading) return;
        setIsLoading(true);
        try {
            await appointmentService.updateStatus(current._id, "completed");
            
            if (waiting.length > 0) {
                await appointmentService.updateStatus(waiting[0]._id, "in-progress");
            }
            
            socket.emit("queue:update");
            onRefresh();
        } catch (err) {
            console.error("Failed to finish session:", err);
            alert("Failed to finish session: " + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const isStaff = user?.role === "agent" || user?.role === "staff" || user?.role === "admin";

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Stats Bar */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-ui-100 pb-6">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-ink-900 flex items-center gap-3">
                        Live Queue Dashboard
                        {isRefreshing && <span className="text-xs font-sans font-normal text-rose-500 animate-pulse tracking-widest uppercase bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">Syncing...</span>}
                    </h2>
                    <p className="text-ink-500 mt-1 max-w-md">Real-time status of today's beauty appointments and walk-ins.</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-300">Total Waiting</p>
                        <p className="text-2xl font-bold text-ink-900 leading-none">{waiting.length}</p>
                    </div>
                    <div className="w-px h-8 bg-ui-200 self-center"></div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-300">Total Served</p>
                        <p className="text-2xl font-bold text-ink-900 leading-none">{sortedQueue.filter(a => a.status === 'completed').length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 1. Main Stage: Now Serving (4 or 5 cols) */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <section>
                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            Currently Serving
                        </h3>

                        {current ? (
                            <div className="bg-white rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-2 border-emerald-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:scale-110 transition-transform">💆‍♀️</div>
                                <div className="relative z-10">
                                    <div className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest rounded-full border border-emerald-100 mb-4">
                                        Token #{current.queueNumber}
                                    </div>
                                    <h4 className="text-4xl font-serif font-bold text-ink-900 mb-1">{current.user?.name || current.name}</h4>
                                    <p className="text-lg text-ink-500 font-medium mb-6">{current.service?.name}</p>

                                    <div className="flex items-center gap-6 pt-6 border-t border-emerald-50">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-ink-300">Started At</p>
                                            <p className="font-bold text-ink-900">{new Date(current.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div className="ml-auto flex gap-3">
                                            {isStaff && (
                                                <button
                                                    onClick={handleFinishSession}
                                                    disabled={isLoading}
                                                    className="px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-2xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isLoading ? 'Processing...' : 'Finish Session'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-surface-50 border-2 border-dashed border-ui-200 rounded-3xl p-12 text-center">
                                <div className="text-4xl mb-4 opacity-30">🛋️</div>
                                <p className="text-ink-400 font-medium italic">No active sessions at the moment.</p>
                                {waiting.length > 0 && isStaff && (
                                    <button
                                        onClick={() => handleCallToken(nextUp._id)}
                                        disabled={isLoading}
                                        className="mt-6 px-8 py-3 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition shadow-lg shadow-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Processing...' : `Call Token #${nextUp.queueNumber}`}
                                    </button>
                                )}
                            </div>
                        )}
                    </section>
                </div>

                {/* 2. Waiting List (Left 7 cols) */}
                <div className="lg:col-span-12 xl:col-span-7 grid md:grid-cols-2 gap-8">
                    {/* Next in Queue */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                            Up Next
                        </h3>

                        <div className="space-y-4">
                            {waiting.length === 0 ? (
                                <div className="p-8 bg-surface-50 rounded-2xl border border-ui-100 text-center">
                                    <p className="text-ink-300 text-sm">Queue is empty.</p>
                                </div>
                            ) : (
                                waiting.map((appt, idx) => (
                                    <div
                                        key={appt._id}
                                        className={`p-5 bg-white rounded-2xl border transition-all ${idx === 0 ? 'border-rose-200 shadow-md scale-105 origin-left ring-4 ring-rose-50' : 'border-ui-100 shadow-sm opacity-80 hover:opacity-100 hover:shadow-md'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${idx === 0 ? 'bg-rose-500 text-white' : 'bg-surface-100 text-ink-900 group-hover:bg-rose-100'}`}>
                                                    {appt.queueNumber}
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-ink-900 leading-tight">{appt.user?.name || appt.name}</h5>
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-ink-400">{appt.service?.name}</p>
                                                </div>
                                            </div>
                                            {idx === 0 && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 animate-pulse">Ready</span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-ui-50">
                                            <div className="flex items-center gap-4">
                                                <div className="text-xs text-ink-500">
                                                    <span className="font-bold">Wait:</span> {idx * 15 + 10}m
                                                </div>
                                            </div>
                                            {isStaff && (
                                                <button
                                                    onClick={() => handleCallToken(appt._id)}
                                                    disabled={isLoading}
                                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${idx === 0 ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm' : 'bg-surface-100 text-ink-500 hover:bg-rose-50 hover:text-rose-500'}`}
                                                >
                                                    {isLoading ? 'Wait...' : (idx === 0 ? 'Call Now' : 'Call')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recently Completed */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-ui-400 mb-4">
                            History (Recently Served)
                        </h3>

                        <div className="space-y-3">
                            {completed.length === 0 ? (
                                <p className="text-center py-6 text-ui-300 text-xs italic">No items in history</p>
                            ) : (
                                completed.map((appt) => (
                                    <div key={appt._id} className="flex items-center gap-4 p-4 bg-white/50 border border-ui-100 rounded-xl group/item hover:bg-white transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-ui-50 text-ui-400 flex items-center justify-center text-xs font-bold line-through group-hover/item:no-underline group-hover/item:text-ink-400 transition-all">
                                            {appt.queueNumber}
                                        </div>
                                        <div className="flex-grow">
                                            <h6 className="text-xs font-bold text-ink-500 line-through group-hover/item:no-underline group-hover/item:text-ink-700">{appt.user?.name || appt.name}</h6>
                                            <p className="text-[8px] uppercase font-black tracking-widest text-ui-300 group-hover/item:text-ui-400">{appt.service?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-ui-300 uppercase">{new Date(appt.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">Served</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QueueBoard;