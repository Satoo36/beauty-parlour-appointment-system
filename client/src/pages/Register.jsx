import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api/api";
import { AuthContext } from "../context/AuthContext";

function Register() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({...form, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if(!form.name || !form.email || !form.password) {
            return setError("All fields are required");
        }
        try {
            setLoading(true);
            const res = await authService.register(form);
            login(res.data.user, res.data.token);
            navigate("/dashboard");
        } catch(err) {
            setError(err.response?.data?.message || "Registration failed. please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-100 py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1620331309609-80c4b2a382d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-no-repeat relative">
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"></div>

            <div className="max-w-md w-full space-y-8 relative z-10 bg-white/90 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/50">
                <div>
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg mx-auto mb-4 ring-2 ring-rose-100">
                        G
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-serif font-bold text-ink-900">
                        Create Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-ink-500">
                        Already have an account? <Link to="/login" className="font-medium text-rose-600 hover:text-rose-500 transition">Sign in here</Link>
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
                            <label htmlFor="name" className="block text-sm font-medium text-ink-700 mb-1">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={form.name}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-3 py-3 border border-ui-200 placeholder-ink-300 text-ink-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm transition bg-white/50 hover:bg-white"
                                placeholder="Kavya"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-ink-700 mb-1">Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={form.email}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-3 py-3 border border-ui-200 placeholder-ink-300 text-ink-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm transition bg-white/50 hover:bg-white"
                                placeholder="kavya@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-ink-700 mb-1">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={form.password}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-3 py-3 border border-ui-200 placeholder-ink-300 text-ink-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm transition bg-white/50 hover:bg-white"
                                placeholder="••••••••"
                            />
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
                            ) : "Create Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Register;