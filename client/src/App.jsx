import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserDashboard from "./pages/UserDashboard";
import AppointmentForm from "./components/AppointmentForm";

import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ServiceList from "./pages/ServiceList";
import StaffList from "./pages/StaffList";
import BookingPage from "./pages/BookingPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AppointmentDetailsPage from "./pages/AppointmentDetailsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import StaffDashboard from "./pages/staff/StaffDashboard";
import Layout from "./components/Layout";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import AdminLayout from "./components/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminServices from "./pages/admin/AdminServices";
import AdminSlots from "./pages/admin/AdminSlots";

import AdminPayments from "./pages/admin/AdminPayments";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminNotifications from "./pages/admin/AdminNotifications";
import ChatWidget from "./components/ChatWidget";
import GoogleCallback from "./pages/GoogleCallback";

function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/services" element={<ServiceList />} />
        <Route path="/staff" element={<StaffList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/booking"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <BookingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/appointments/:id"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <AppointmentDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/new"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <AppointmentForm />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Internal Dashboards - No shared layout wrapper */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff-dashboard"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />


      {/* Admin Routes - Maintain existing structure for nested routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminOverview />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="staff" element={<AdminStaff />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="slots" element={<AdminSlots />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>

      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ChatWidget />
    </AuthProvider>
  );
}

export default App;