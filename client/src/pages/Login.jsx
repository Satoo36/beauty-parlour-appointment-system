import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api/api";
import { AuthContext } from "../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [form, setForm] = useState({ identifier: "", password: "" });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!form.identifier || !form.password) return setError("All fields are required.");
        try {
            setLoading(true);
            const res = await authService.login(form); // send { identifier, password }
            login(res.data.user, res.data.token);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Redirect to backend Google OAuth
        window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1596462502278-27bfdd403348?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"></div>

            <div className="max-w-md w-full space-y-6 relative z-10 bg-white/90 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/50">
                <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg mx-auto mb-4 ring-2 ring-rose-100">G</div>
                    <h2 className="text-3xl font-serif font-bold text-ink-900">Welcome Back</h2>
                    <p className="mt-2 text-sm text-ink-500">
                        Or <Link to="/register" className="font-medium text-rose-600 hover:text-rose-500">Start your journey with us</Link>
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg p-4">{error}</div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">
                            Email or Phone Number
                        </label>
                        <input
                            name="identifier"
                            type="text"
                            required
                            value={form.identifier}
                            onChange={handleChange}
                            className="w-full px-3 py-3 border border-ui-200 text-ink-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 sm:text-sm bg-white/50 hover:bg-white transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            value={form.password}
                            onChange={handleChange}
                            className="w-full px-3 py-3 border border-ui-200 text-ink-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 sm:text-sm bg-white/50 hover:bg-white transition"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                            <input type="checkbox" className="h-4 w-4 text-rose-600 rounded" />
                            Remember me
                        </label>
                        <Link to="/forgot-password" className="text-sm font-medium text-rose-600 hover:text-rose-500">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 text-sm font-bold rounded-lg text-white bg-rose-500 hover:bg-rose-600 transition disabled:opacity-70 shadow-lg shadow-rose-200 hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-ui-200"></div>
                    <span className="text-xs text-ink-400">or continue with</span>
                    <div className="flex-1 border-t border-ui-200"></div>
                </div>

                {/* Google Sign-In Button */}
                <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-ui-200 rounded-lg text-sm font-medium text-ink-700 bg-white hover:bg-gray-50 transition shadow-sm hover:shadow"
                >
                    <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.2-2.7-.4-4z" />
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
                        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.8 39.7 16.4 44 24 44z" />
                        <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C41 35.3 44 30 44 24c0-1.3-.2-2.7-.4-4z" />
                    </svg>
                    Continue with Google
                </button>

                {/* Demo Credentials */}
                <div>
                    <p className="text-center text-xs text-ink-400 mb-3">Demo Credentials</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div onClick={() => setForm({ identifier: "admin@beautyparlour.com", password: "admin123" })}
                            className="cursor-pointer bg-rose-50 hover:bg-rose-100 transition p-3 rounded-xl">
                            <p className="font-semibold text-rose-700 text-sm">Admin</p>
                            <p className="text-xs text-ink-600">admin@beautyparlour.com</p>
                            <p className="text-xs text-ink-600">admin123</p>
                        </div>
                        <div onClick={() => setForm({ identifier: "staffname@example.com", password: "password123" })}
                            className="cursor-pointer bg-rose-50 hover:bg-rose-100 transition p-3 rounded-xl">
                            <p className="font-semibold text-rose-700 text-sm">Staff</p>
                            <p className="text-xs text-ink-600">staffname@example.com</p>
                            <p className="text-xs text-ink-600">password123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;