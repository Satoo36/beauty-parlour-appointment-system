import axios from "axios";

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    register: (data) => api.post("/auth/register", data),
    login: (data) => api.post("/auth/login", data),
    me: () => api.get("/auth/me"),
    updateProfile: (data) => api.put("/auth/profile", data),
    logout: () => api.post("/auth/logout"),
    forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
    resetPassword: (data) => api.post("/auth/reset-password", data),
};

export const serviceService = {
    getAll: (params) => api.get("/services", { params }),
    getCategories: () => api.get("/services/categories/list"),
    getByStaff: (staffId) => api.get(`/services/staff/${staffId}`),
    getById: (id) => api.get(`/services/${id}`),
    create: (data) => api.post("/services", data),
    update: (id, data) => api.put(`/services/${id}`, data),
    toggleStatus: (id) => api.patch(`/services/${id}/toggle-status`),
};

export const staffService = {
    getAll: (params) => api.get("/staff", { params }),
    getById: (id) => api.get(`/staff/${id}`),
    create: (data) => api.post("/staff", data),
    update: (id, data) => api.put(`/staff/${id}`, data),
    delete: (id) => api.delete(`/staff/${id}`),
    getSchedule: (id) => api.get(`/staff/${id}/schedule`),
    updateRating: (staffId, rating) => api.patch(`/staff/${staffId}/rating`, { rating }),
    // Staff Dasboard API
    getDashboardSummary: () => api.get("/staff/dashboard/summary"),
    getDashboardAppointments: (params) => api.get("/staff/appointments", { params }),
    updateAppointmentStatus: (id, status) => api.put(`/staff/dashboard/appointments/${id}/status`, { status }),
};

export const slotService = {
    getAvailable: (params) => api.get("/slots/available", { params }),
    generate: (data) => api.post("/admin/slots/generate", data),
    toggleAvailability: (id, isAvailable) => api.patch(`/admin/slots/${id}/availability`, { isAvailable }),
    delete: (id) => api.delete(`/admin/slots/${id}`),
    getByStaff: (staffId, params) => api.get(`/admin/slots/${staffId}`, { params }),
    getStats: (params) => api.get("/slots/stats", { params }),
};

export const appointmentService = {
    getStats: () => api.get("/appointments/stats"),
    create: (data) => api.post("/appointments", data),
    getAll: (params) => api.get("/appointments", { params }),
    getById: (id) => api.get(`/appointments/${id}`),
    updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
    cancel: (id, data) => api.patch(`/appointments/${id}/cancel`, data),
    addReview: (id, data) => api.patch(`/appointments/${id}/review`, data),
};

export const queueService = {
    join: (data) => api.post("/queue/join", data),
    getActiveToday: () => api.get("/queue/active/today"),
    getById: (id) => api.get(`/queue/${id}`),
    checkPosition: (appointmentId) => api.get(`/queue/check/${appointmentId}`),
    callNext: (id) => api.put(`/queue/${id}/next`),
    close: (id) => api.put(`/queue/${id}`),
    removeFromQueue: (queueId, appointmentId) => api.delete(`/queue/${queueId}/remove/${appointmentId}`),
};

export const paymentService = {
    createOrder: (data) => api.post("/payment/create-order", data),
    verify: (data) => api.post("/payment/verify", data),
    getMyPayments: () => api.get("/payment/my-payments"),
    getStats: () => api.get("/payment/stats"),
    getAll: (params) => api.get("/payment/all", { params }),
    getById: (id) => api.get(`/payment/${id}`),
    refund: (data) => api.post("/payment/refund", data),
    exportCSV: (params) => api.get("/payment/export-csv", { params, responseType: 'blob' }),
};

export const adminService = {
    getStaff: () => api.get("/admin/staff"),
};

export const userService = {
    getStats: () => api.get("/users/stats"),
    getAll: (params) => api.get("/users", { params }),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
};

export default api;
