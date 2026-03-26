import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    CalendarCheck,
    Users,
    UserSquare,
    Scissors,
    Clock,
    CreditCard,
    BarChart3,
    Bell,
    LogOut
} from "lucide-react";

const AdminSidebar = () => {
    const location = useLocation();

    const navItems = [
        { name: "Overview", path: "/admin", icon: LayoutDashboard },
        { name: "Appointments", path: "/admin/appointments", icon: CalendarCheck },
        { name: "Staff", path: "/admin/staff", icon: UserSquare },
        { name: "Users", path: "/admin/users", icon: Users },
        { name: "Services", path: "/admin/services", icon: Scissors },
        { name: "Slots", path: "/admin/slots", icon: Clock },
        { name: "Payments", path: "/admin/payments", icon: CreditCard },
        { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
        { name: "Notifications", path: "/admin/notifications", icon: Bell },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex flex-col h-screen w-64 bg-slate-900 text-white fixed left-0 top-0 z-50">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-rose-500">Admin Panel</h1>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(item.path)
                                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Exit Admin</span>
                </Link>
            </div>
        </div>
    );
};

export default AdminSidebar;
