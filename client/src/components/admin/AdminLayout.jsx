import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import AdminSidebar from "./AdminSidebar";
import GlobalNotification from "../GlobalNotification";

const AdminLayout = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <AdminSidebar />
            <GlobalNotification />
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto uppercase">
                    <h1 className="text-sm font-semibold text-rose-500 mb-6 tracking-wider">
                        Admin Dashboard
                    </h1>
                </div>
                <div className="max-w-7xl mx-auto">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
