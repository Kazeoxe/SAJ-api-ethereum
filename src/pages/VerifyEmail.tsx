import React, { useState } from "react";
import API from "../services/api";

const VerifyEmail = () => {
    const [message, setMessage] = useState("");

    const verifyEmail = async () => {
        try {
            const token = window.location.pathname.split("/").pop();
            const { data } = await API.post("/auth/verify-email", { token });
            setMessage(data.message);
        } catch (error) {
            setMessage("Email verification failed.");
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold text-center">Verify Email</h1>

            <button
                onClick={verifyEmail}
                className="w-full bg-blue-500 text-white p-2 rounded"
            >
                Verify Email
            </button>

            {message && <div className="text-center">{message}</div>}
        </div>
    );
}

export default VerifyEmail;