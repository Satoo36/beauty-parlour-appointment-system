import React, { useState } from 'react';

const CancellationModal = ({ isOpen, onClose, onConfirm, loading }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Please provide a reason for cancellation.');
            return;
        }
        onConfirm(reason);
        setReason('');
        setError('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 border border-rose-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-serif font-bold text-ink-900">Cancel Appointment</h3>
                        <button
                            onClick={onClose}
                            className="text-ink-400 hover:text-ink-600 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <p className="text-ink-500 mb-6">
                        We're sorry you can't make it. Please let us know the reason for cancellation so we can improve our service.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="reason" className="block text-sm font-bold text-ink-700 mb-2 uppercase tracking-wider">
                                Cancellation Reason <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                id="reason"
                                rows="4"
                                className={`w-full px-4 py-3 rounded-2xl border ${error ? 'border-rose-300 bg-rose-50' : 'border-ui-200 focus:border-rose-300'} focus:ring-4 focus:ring-rose-50 outline-none transition-all resize-none text-ink-900 placeholder:text-ink-300`}
                                placeholder="E.g., Personal emergency, Change of plans..."
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    if (error) setError('');
                                }}
                                disabled={loading}
                            ></textarea>
                            {error && <p className="mt-2 text-sm text-rose-500 font-medium">{error}</p>}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3.5 px-6 border border-ui-200 text-ink-600 font-bold rounded-2xl hover:bg-surface-50 transition active:scale-95 disabled:opacity-50"
                                disabled={loading}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3.5 px-6 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Cancelling...</span>
                                    </>
                                ) : (
                                    <span>Confirm Cancel</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CancellationModal;
