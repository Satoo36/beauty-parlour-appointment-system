import { useState, useRef, useEffect } from "react";

// ─── Point to your backend, NOT n8n ───────────────────────────────────────
const API_BASE = import.meta.env.VITE_BACKEND_URL;
const CHAT_URL = `${API_BASE}/api/chat`;
const CHAT_START_URL = `${API_BASE}/api/chat/start`;

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
};

// ─── Render text with newlines ────────────────────────────────────────────
const MessageText = ({ text }) => (
    <span>
        {text.split("\n").map((line, i, arr) => (
            <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
            </span>
        ))}
    </span>
);

// ─── Option buttons ───────────────────────────────────────────────────────
const OptionButtons = ({ options, onSelect, disabled, handlePayment }) => {
    if (!options || options.length === 0) return null;
    // Filter out type_input — those are "type your answer" hints, no button
    const visible = options.filter(o => o.type !== 'type_input');
    if (visible.length === 0) return null;

    return (
        <div style={{
            display: "flex", flexWrap: "wrap", gap: 6,
            marginTop: 8, alignSelf: "flex-start", maxWidth: "98%"
        }}>
            {visible.map((opt, i) => (
                <button
                    key={i}
                    onClick={() => {
                        if (opt.type === "link") {
                            handlePayment(opt.value);
                        } else {
                            !disabled && onSelect(opt);
                        }
                    }}
                    disabled={disabled}
                    style={{
                        background: disabled ? "#fdf0f7" : "#fff",
                        color: disabled ? "#d4a0bc" : "#e91e8c",
                        border: `1.5px solid ${disabled ? "#f0c0d8" : "#e91e8c"}`,
                        borderRadius: 20,
                        padding: "5px 12px",
                        fontSize: 12.5,
                        cursor: disabled ? "not-allowed" : "pointer",
                        fontWeight: 500,
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "#fce4f3"; }}
                    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = "#fff"; }}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
};

// ─── Main Widget ──────────────────────────────────────────────────────────
export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const sessionId = useRef(`session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const bottomRef = useRef(null);
    const initialized = useRef(false);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // When chat opens for the first time, call /start to get greeting
    useEffect(() => {
        if (open && !initialized.current) {
            initialized.current = true;
            callStart();
        }
    }, [open]);

    // ─── Call /api/chat/start ───────────────────────────────────────────
    const callStart = async () => {
        setLoading(true);
        try {
            const res = await fetch(CHAT_START_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: sessionId.current })
            });
            const data = await res.json();
            setMessages([{
                role: "assistant",
                text: data.message || "Hi! How can I help you?",
                options: data.options || []
            }]);
        } catch {
            setMessages([{
                role: "assistant",
                text: "Hi! Welcome to GlamourBeauty 💅 How can I help you today?",
                options: []
            }]);
        } finally {
            setLoading(false);
        }
    };

    // ─── Send a message (typed or button) ──────────────────────────────
    const sendMessage = async (textOverride, buttonOption = null) => {
        const userText = (textOverride || input).trim();
        if (!userText || loading) return;

        setInput("");

        const isButtonClick = buttonOption !== null;

        // Show user bubble (use label for buttons, raw text for typed)
        const displayText = isButtonClick ? buttonOption.label : userText;
        setMessages(prev => [...prev, { role: "user", text: displayText }]);
        setLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem("user"));
            const res = await fetch(CHAT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },

                body: JSON.stringify({
                    message: userText,           // raw value (e.g. ObjectId or action name)
                    sessionId: sessionId.current,
                    isButtonClick,
                    type: buttonOption?.type || "",
                    meta: buttonOption?.meta || {},
                    user
                })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            setMessages(prev => [...prev, {
                role: "assistant",
                text: data.message || "I'm not sure how to respond. Please try again.",
                options: data.options || []
            }]);

        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                text: "Sorry, I'm having trouble connecting. Please try again in a moment.",
                options: []
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (url) => {
        try {
            const appointmentId = url.split("/").pop();
            const storedUser = getStoredUser();

            const res = await fetch(`${API_BASE}/api/payment/create-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ appointmentId })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to create payment order");
            }

            const orderId = data.orderId || data?.data?.order?.id;
            const amount = data.amount || data?.data?.order?.amount;
            const key = data.key || data?.data?.key;

            const options = {
                key,
                amount,
                currency: "INR",
                name: "GlamourBeauty",
                description: "Appointment Payment",
                order_id: orderId,
                handler: async function (response) {
                    const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...getAuthHeaders()
                        },
                        body: JSON.stringify({
                            ...response,
                            appointmentId,
                            email: storedUser?.email || undefined
                        })
                    });

                    if (!verifyRes.ok) {
                        const verifyData = await verifyRes.json().catch(() => ({}));
                        throw new Error(verifyData.message || "Payment verification failed");
                    }

                    alert("✅ Payment successful!");
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error(err);
            alert("Payment failed");
        }
    };

    // Button click handler — passes full option object (value + type + meta)
    const handleButtonClick = (option) => {
        if (loading) return;
        sendMessage(option.value, option);
    };

    return (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000 }}>
            {open && (
                <div style={{
                    width: 365, height: 560,
                    background: "#fff", borderRadius: 18,
                    boxShadow: "0 8px 40px rgba(233,30,140,0.2)",
                    display: "flex", flexDirection: "column",
                    overflow: "hidden", border: "1px solid #f0d0e8"
                }}>
                    {/* ── Header ─────────────────────────────────────── */}
                    <div style={{
                        background: "linear-gradient(135deg, #e91e8c, #c2185b)",
                        color: "#fff", padding: "13px 18px",
                        fontWeight: 700, fontSize: 15,
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", flexShrink: 0
                    }}>
                        <span>💅 Beauty Assistant</span>
                        <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>GlamourBeauty</span>
                    </div>

                    {/* ── Messages ────────────────────────────────────── */}
                    <div style={{
                        flex: 1, overflowY: "auto",
                        padding: "12px 12px 8px",
                        display: "flex", flexDirection: "column",
                        gap: 8, background: "#fdf6f9"
                    }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{
                                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                                    background: m.role === "user" ? "#e91e8c" : "#fff",
                                    color: m.role === "user" ? "#fff" : "#333",
                                    borderRadius: m.role === "user"
                                        ? "16px 16px 4px 16px"
                                        : "16px 16px 16px 4px",
                                    padding: "10px 14px",
                                    maxWidth: "84%",
                                    fontSize: 13.5, lineHeight: 1.6,
                                    boxShadow: "0 1px 6px rgba(0,0,0,0.07)"
                                }}>
                                    <MessageText text={m.text} />
                                </div>

                                {/* Options only on the latest assistant message */}
                                {m.role === "assistant" &&
                                    m.options?.length > 0 &&
                                    i === messages.length - 1 && (
                                        <OptionButtons
                                            options={m.options}
                                            onSelect={handleButtonClick}
                                            disabled={loading}
                                            handlePayment={handlePayment}
                                        />
                                    )}
                            </div>
                        ))}

                        {loading && (
                            <div style={{
                                alignSelf: "flex-start", background: "#fff",
                                borderRadius: "16px 16px 16px 4px",
                                padding: "10px 16px", fontSize: 13,
                                color: "#ccc", boxShadow: "0 1px 4px rgba(0,0,0,0.07)"
                            }}>
                                Typing...
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* ── Input ───────────────────────────────────────── */}
                    <div style={{
                        display: "flex", borderTop: "1px solid #f0d0e8",
                        padding: "10px", gap: 8, background: "#fff",
                        alignItems: "center", flexShrink: 0
                    }}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Or type your message..."
                            disabled={loading}
                            style={{
                                flex: 1, border: "1px solid #f0d0e8",
                                borderRadius: 20, padding: "8px 14px",
                                fontSize: 13, outline: "none",
                                background: "#fdf6f9", color: "#333"
                            }}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                            style={{
                                background: (loading || !input.trim()) ? "#f0c0d8" : "#e91e8c",
                                color: "#fff", border: "none",
                                borderRadius: 20, padding: "8px 16px",
                                cursor: (loading || !input.trim()) ? "not-allowed" : "pointer",
                                fontWeight: 700, fontSize: 13
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}

            {/* ── Toggle button ──────────────────────────────────────── */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    background: "linear-gradient(135deg, #e91e8c, #c2185b)",
                    color: "#fff", border: "none", borderRadius: "50%",
                    width: 58, height: 58, fontSize: 26, cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(233,30,140,0.45)",
                    display: "block", marginLeft: "auto"
                }}
            >
                {open ? "✕" : "💬"}
            </button>
        </div>
    );
}
