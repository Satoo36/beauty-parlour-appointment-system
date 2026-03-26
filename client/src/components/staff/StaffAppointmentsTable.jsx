import React from 'react';

const StaffAppointmentsTable = ({ appointments, onUpdateStatus, loading }) => {
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-ui-50 text-ui-500 border-ui-100';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-ui-100">
                <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
                <p className="text-ink-400 font-medium">Loading appointments...</p>
            </div>
        );
    }

    if (!appointments || appointments.length === 0) {
        return (
            <div className="p-20 text-center bg-white rounded-2xl border border-ui-100 border-dashed">
                <div className="text-5xl mb-4">📅</div>
                <h4 className="text-xl font-bold text-ink-900 mb-2">No appointments found</h4>
                <p className="text-ink-500">You don't have any appointments matching the selected filter.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-ui-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-50 border-b border-ui-100">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ink-400">Client</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ink-400">Service</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ink-400">Date & Time</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ink-400">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ink-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ui-50">
                        {appointments.map((apt) => (
                            <tr key={apt._id} className="hover:bg-rose-50/10 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold border border-rose-200">
                                            {apt.user?.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-ink-900">{apt.user?.name || 'Unknown Client'}</div>
                                            <div className="text-xs text-ink-400">{apt.user?.phone || 'No phone'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-ink-700">{apt.service?.name || 'Deleted Service'}</div>
                                    <div className="text-[10px] text-ink-400 uppercase tracking-widest">{apt.service?.category}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-ink-900">
                                        {new Date(apt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="text-xs text-rose-500 font-medium">{apt.startTime} - {apt.endTime}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase shadow-sm border ${getStatusStyle(apt.status)}`}>
                                        {apt.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {apt.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => onUpdateStatus(apt._id, 'confirmed')}
                                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                                    title="Confirm"
                                                >
                                                    ✅
                                                </button>
                                                <button
                                                    onClick={() => onUpdateStatus(apt._id, 'cancelled')}
                                                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                                    title="Reject"
                                                >
                                                    ❌
                                                </button>
                                            </>
                                        )}
                                        {apt.status === 'confirmed' && (
                                            <button
                                                onClick={() => onUpdateStatus(apt._id, 'completed')}
                                                className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition shadow-sm shadow-rose-200"
                                            >
                                                Complete
                                            </button>
                                        )}
                                        <button className="p-2 bg-surface-100 text-ink-400 hover:bg-surface-200 rounded-lg transition-colors">
                                            👁️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StaffAppointmentsTable;
