import api from "./api";

const adminService = {
    // Aggregated Dashboard Summary
    getSummary: () => api.get("/admin/summary"),

    // Appointment Management
    getAppointments: (params) => {
        const query = new URLSearchParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== "" && params[key] !== null && params[key] !== undefined) {
                    query.append(key, params[key]);
                }
            });
        }
        return api.get(`/appointments?${query.toString()}`);
    },
    updateAppointmentStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
    cancelAppointment: (id, reason) => api.patch(`/appointments/${id}/cancel`, { cancellationReason: reason }),

    // Staff Management
    getAllStaff: (params) => api.get("/staff", { params }),
    createStaff: (data) => api.post("/staff", data),
    updateStaff: (id, data) => api.put(`/staff/${id}`, data),
    deleteStaff: (id) => api.delete(`/staff/${id}`),

    // Service Management
    getAllServices: (params) => api.get("/services", { params }),
    createService: (data) => api.post("/services", data),
    updateService: (id, data) => api.put(`/services/${id}`, data),
    deleteService: (id) => api.delete(`/services/${id}`),
    toggleServiceStatus: (id) => api.patch(`/services/${id}/toggle-status`),

    // User Management
    getAllUsers: (params) => api.get("/admin/users", { params }),
    updateUserRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
    deleteUser: (id) => api.delete(`/users/${id}`),

    // Payment & Revenue
    getAllPayments: (params) => api.get("/admin/payments", { params }),
    getPaymentStats: (params) => api.get("/payment/stats", { params }),
    refundPayment: (id, data) => api.post(`/admin/payments/${id}/refund`, data),
    exportPaymentsCSV: (params) => api.get("/admin/payments/export", { params, responseType: 'blob' }),
    downloadInvoice: (id) => api.get(`/admin/payments/${id}/invoice`, { responseType: 'blob' }),

    // Slot Management
    getStaffSlots: (staffId, params) => api.get(`/slots/staff/${staffId}`, { params }),
    getSlotStats: (params) => api.get("/slots/stats", { params }),
    generateSlots: (data) => api.post("/slots/generate", data),
    bulkGenerateSlots: (data) => api.post("/slots/bulk-generate", data),
    toggleSlotAvailability: (id, isAvailable) => api.patch(`/slots/slots/${id}/availability`, { isAvailable }),
    deleteSlot: (id) => api.delete(`/slots/${id}`),

    // Stats
    getAppointmentStats: (params) => api.get("/appointments/stats", { params }),
    getUserStats: () => api.get("/users/stats"),
};

export default adminService;
