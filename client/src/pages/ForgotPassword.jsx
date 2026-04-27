import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../api/api";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        if (!email) return setError("Email is required.");

        try {
            setLoading(true);
            const res = await authService.forgotPassword(email);
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1596462502278-27bfdd403348?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center relative font-sans">
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"></div>

            <div className="max-w-md w-full space-y-6 relative z-10 bg-white/90 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/50">
                <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg mx-auto mb-4 ring-2 ring-rose-100">G</div>
                    <h2 className="text-3xl font-serif font-bold text-ink-900">Forgot Password</h2>
                    <p className="mt-2 text-sm text-ink-500">
                        Enter your email to receive a password reset link.
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg p-4">{error}</div>
                )}

                {message && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-lg p-4">{message}</div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">
                            Email address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-3 border border-ui-200 text-ink-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 sm:text-sm bg-white/50 hover:bg-white transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 text-sm font-bold rounded-lg text-white bg-rose-500 hover:bg-rose-600 transition disabled:opacity-70 shadow-lg shadow-rose-200 hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-sm text-ink-500">
                        Remembered your password? <Link to="/login" className="font-medium text-rose-600 hover:text-rose-500">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
