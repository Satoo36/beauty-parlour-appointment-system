import { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import clsx from "clsx";

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services' },
        { name: 'Our Team', path: '/staff' },
        { name: 'Contact', path: '/contact' },
    ];
    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 bg-surface-200/90 backdrop-blur-xl border-b border-ui-100 shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-24">
                    <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-rose-300 to-white rounded-full flex items-center justify-center text-white font-serif font-bold text-2xl shadow-lg ring-4 ring-rose-100 transition-transform group-hover:scale-105">
                            <img
                                src="/logo.png"
                                alt="Glamour Beauty Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="font-serif text-2xl font-bold text-ink-900 tracking-tight">
                            Glamour
                            <span className="text-rose-500">Beauty</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={clsx(
                                    "text-sm font-medium tracking-wide transition-all duration-200 relative py-2",
                                    isActive(link.path) ? "text-rose-600 font-semibold" : "text-ink-500 hover:text-rose-500"
                                )}
                            >
                                {link.name}
                                {isActive(link.path) && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-400 rounded-full animate-fade-in"></span>
                                )}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center space-x-6">
                        {user ? (
                            <div className="flex items-center gap-6">
                                {user.role === 'admin' && (
                                    <Link to="/admin-dashboard" className="text-sm font-medium text-ink-700 hover:text-rose-600 transition">
                                        Dashboard
                                    </Link>
                                )}
                                {user.role === 'staff' && (
                                    <Link to="/staff-dashboard" className="text-sm font-medium text-rose-600 hover:text-rose-700 transition">
                                        Staff Panel
                                    </Link>
                                )}
                                {user.role === 'user' && (
                                    <Link to="/dashboard" className="text-sm font-medium text-ink-700 hover:text-rose-600 transition">
                                        Dashboard
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="px-5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-full transition">
                                    Logout
                                </button>
                                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold border-2 border-rose-200 shadow-sm">
                                    {user.name?.[0]?.toUpperCase()}
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="text-ink-500 hover:text-rose-600 font-medium text-sm transition">
                                    Login
                                </Link>
                                <Link to="/booking" className="btn-primary shadow-rose-200">
                                    Book Now
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-ink-500 hover:text-rose-600 focus:outline-none p-2"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden bg-surface-50 border-t border-ui-200 absolute w-full shadow-xl z-50 animate-alide-down">
                    <div className="px-4 pt-4 pb-8 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={clsx(
                                    "block px-4 py-3 rounded-xl text-base font-medium transition-colors",
                                    isActive(link.path) ? "bg-rose-50 text-rose-700" : "text-ink-500 hover:bg-surface-100 hover:text-rose-600"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="border-t border-ui-200 my-4 pt-4 space-y-3">
                            {user ? (
                                <>
                                    <Link to="/dashboard"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-4 py-3 text-base font-medium text-ink-700 hover:bg-surface-100 rounded-xl"
                                    >
                                        My Dashboard
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="block w-full text-left px-4 py-3 text-base font-medium text-rose-600 hover:bg-rose-50 rounded-xl"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-4 py-3 text-base font-medium text-ink-600 hover:bg-surface-100 rounded-xl">
                                        Login
                                    </Link>
                                    <Link to="/booking"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block w-full text-center px-4 py-3 text-base font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md">
                                        Book Now
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;