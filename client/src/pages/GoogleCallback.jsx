import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function GoogleCallback() {
    const [params] = useSearchParams();
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const token = params.get("token");
        const error = params.get("error");

        if (error || !token) {
            navigate("/login?error=google_failed");
            return;
        }

        // Decode user from token (or fetch /api/users/me)
        const payload = JSON.parse(atob(token.split(".")[1]));
        login({ id: payload.id, role: payload.role }, token);
        navigate("/dashboard");
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-ink-500">Signing you in with Google...</p>
        </div>
    );
}

export default GoogleCallback;