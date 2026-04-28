import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;

export default function useSocket() {
    const socketRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        socketRef.current = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            auth: {
                token,
            },
        });

        socketRef.current.on("connect", () => {
            console.log("socket connected:", socketRef.current.id);
        });

        socketRef.current.on("disconnect", (reason) => {
            console.log("socket disconnected:", reason);
        });

        socketRef.current.on("cnnect_error", (err) => {
            console.log("socket connection error:", err.message);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const on = (event, callback) => {
        socketRef.current?.on(event, callback);
    };

    const off = (event, callback) => {
        socketRef.current?.off(event, callback);
    };

    const emit = (event, data) => {
        socketRef.current?.emit(event, data);
    };

    const reconnect = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            const token = localStorage.getItem("token");
            socketRef.current.auth = { token };
            socketRef.current.connect();
        }
    };

    return {
        on,
        off,
        emit,
        reconnect,
        socket: socketRef.current,
    };
}