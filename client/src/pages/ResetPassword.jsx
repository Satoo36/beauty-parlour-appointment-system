import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authService } from "../api/api";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("The reset token is missing. Please check your link.");
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!password || !confirmPassword) {
            return setError("All fields are required.");
        }
        if (password !== confirmPassword) {
            return setError("Passwords do not match.");
        }
        if (password.length < 6) {
            return setError("Password must be at least 6 characters.");
        }

        try {
            setLoading(true);
            const res = await authService.resetPassword({ token, password });
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
                    <h2 className="text-3xl font-serif font-bold text-ink-900">Set New Password</h2>
                    <p className="mt-2 text-sm text-ink-500">
                        Enter your new secure password below.
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg p-4">{error}</div>
                )}

                {message && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-lg p-4">
                        {message}. <Link to="/login" className="font-bold underline">Login now</Link>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-3 border border-ui-200 text-ink-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 sm:text-sm bg-white/50 hover:bg-white transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-3 border border-ui-200 text-ink-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 sm:text-sm bg-white/50 hover:bg-white transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="w-full py-3 px-4 text-sm font-bold rounded-lg text-white bg-rose-500 hover:bg-rose-600 transition disabled:opacity-70 shadow-lg shadow-rose-200 hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        {loading ? "Updating..." : "Reset Password"}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-sm text-ink-500">
                        Back to <Link to="/login" className="font-medium text-rose-600 hover:text-rose-500">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
