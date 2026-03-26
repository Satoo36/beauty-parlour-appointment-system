import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api/api";
import { AuthContext } from "../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.email || !form.password) {
            return setError("Email and password are required.");
        }

        try {
            setLoading(true);
            const res = await authService.login(form);
            login(res.data.user, res.data.token);
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-100 py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1596462502278-27bfdd403348?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-no-repeat relative">
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"></div>

            <div className="max-w-md w-full space-y-8 relative z-10 bg-white/90 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/50">
                <div>
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg mx-auto mb-4 ring-2 ring-rose-100">
                        G
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-serif font-bold text-ink-900">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-center text-sm text-ink-500">
                        Or <Link to="/register" className="font-medium text-rose-600 hover:text-rose-500 transition">Start your journey with us</Link>
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg p-4 animate-shake">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-ink-700 mb-1">Email Address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={form.email}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-3 py-3 border border-ui-200 placeholder-ink-300 text-ink-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm transition bg-white/50 hover:bg-white"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-ink-700 mb-1">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={form.password}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-3 py-3 border border-ui-200 placeholder-ink-300 text-ink-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm transition bg-white/50 hover:bg-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-ui-300 rounded cursor-pointer"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-ink-700">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <a href="#" className="font-medium text-rose-600 hover:text-rose-500">
                                Forgot password?
                            </a>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-rose-500 hover:bg-rose-600 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-rose-200 hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <svg className="h-5 w-5 text-rose-200 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            )}
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </div>
                </form>
                <div className="mt-6">
                    <div className="border-t border-ui-200 my-4"></div>

                    <p className="text-center text-sm text-ink-500 mb-3">
                        Demo Credentials
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Admin */}
                        <div
                            onClick={() => setForm({ email: "admin@beautyparlour.com", password: "admin123" })}
                            className="cursor-pointer bg-rose-50 hover:bg-rose-100 transition p-3 rounded-xl text-left"
                        >
                            <p className="font-semibold text-rose-700">Admin</p>
                            <p className="text-xs text-ink-600">admin@beautyparlour.com</p>
                            <p className="text-xs text-ink-600">admin123</p>
                        </div>

                        {/* Staff */}
                        <div
                            onClick={() => setForm({ email: "staffname@example.com", password: "password123" })}
                            className="cursor-pointer bg-rose-50 hover:bg-rose-100 transition p-3 rounded-xl text-left"
                        >
                            <p className="font-semibold text-rose-700">Staff</p>
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