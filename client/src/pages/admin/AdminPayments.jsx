import { useState, useEffect } from "react";
import {
    Download,
    RefreshCcw,
    IndianRupee,
    FileText,
    ChevronLeft,
    ChevronRight,
    Search
} from "lucide-react";
import adminService from "../../api/adminService";
import dayjs from "dayjs";

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPayments, setTotalPayments] = useState(0);
    const [filters, setFilters] = useState({
        status: "",
        search: ""
    });

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await adminService.getAllPayments({ ...filters, page, limit: 10 });
            setPayments(res.data.data);
            setTotalPages(res.data.pages || 1);
            setTotalPayments(res.data.total || 0);
        } catch (err) {
            console.error("Error fetching payments:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await adminService.getPaymentStats();
            setStats(res.data.data);
        } catch (err) {
            console.error("Error fetching payment stats:", err);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [filters.status, page]);

    useEffect(() => {
        fetchStats();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchPayments();
    };

    const handleExportCSV = async () => {
        try {
            const res = await adminService.exportPaymentsCSV(filters);
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payments-${dayjs().format('YYYY-MM-DD')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Export failed");
        }
    };

    const handleDownloadInvoice = async (id) => {
        try {
            const res = await adminService.downloadInvoice(id);
            const blob = new Blob([res.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${id}.txt`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Invoice download failed:", err);
            alert("Invoice download failed");
        }
    };

    const handleRefund = async (paymentId, amount) => {
        if (window.confirm(`Are you sure you want to refund ₹${amount}? This will also cancel the associated appointment.`)) {
            try {
                await adminService.refundPayment(paymentId, { amount });
                fetchPayments();
                fetchStats();
                alert("Refund processed successfully");
            } catch (err) {
                alert("Refund failed: " + (err.response?.data?.message || err.message));
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'failed': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'refunded': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Payments & Revenue</h2>
                    <p className="text-slate-500">Track transactions and manage financial records</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm"
                >
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Revenue", value: stats?.summary?.totalRevenue, color: "text-slate-900", icon: <IndianRupee size={24} className="text-rose-500" /> },
                    { label: "Net Revenue", value: stats?.summary?.netRevenue, color: "text-emerald-600", icon: <IndianRupee size={24} /> },
                    { label: "Transactions", value: stats?.summary?.totalTransactions, color: "text-slate-900", icon: null },
                    { label: "Refunds", value: stats?.summary?.totalRefunds, color: "text-rose-500", icon: <IndianRupee size={24} /> }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{item.label}</div>
                        <div className={`text-3xl font-bold ${item.color} flex items-center gap-1`}>
                            {item.icon}
                            {item.value?.toLocaleString() || 0}
                        </div>
                    </div>
                ))}
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                    <h3 className="font-bold text-slate-900">Recent Transactions ({totalPayments})</h3>
                    <div className="flex gap-4">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search email/order ID..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                            />
                        </form>
                        <select
                            value={filters.status}
                            onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setPage(1); }}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-bold"
                        >
                            <option value="">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="refunded">Refunded</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Transaction Details</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-medium whitespace-pre-wrap">No transactions found.</td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-tight">ID: {payment.razorpayOrderId || payment._id}</div>
                                            <div className="text-xs font-bold text-slate-600">{payment.razorpayPaymentId || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{payment.user?.name}</div>
                                            <div className="text-xs text-slate-500">{payment.user?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {dayjs(payment.createdAt).format('DD MMM YYYY')}
                                            <div className="text-[10px] text-slate-400 uppercase font-black">{dayjs(payment.createdAt).format('hh:mm A')}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            ₹{payment.amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(payment.status)}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {payment.status === 'completed' && (
                                                    <button
                                                        onClick={() => handleRefund(payment._id, payment.amount)}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Initiate Refund"
                                                    >
                                                        <RefreshCcw size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownloadInvoice(payment._id)}
                                                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"
                                                    title="Download Invoice"
                                                >
                                                    <FileText size={16} />
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
                    <p className="text-sm text-slate-500 font-medium">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm">
                            <ChevronLeft size={18} />
                        </button>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPayments;
