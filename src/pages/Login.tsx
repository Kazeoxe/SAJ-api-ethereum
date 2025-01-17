import React, { useState } from "react";
import API from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

const Login = () => {
    const { user, login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await API.auth.login({ email, password });
            login();
            localStorage.setItem("token", data.token);
            localStorage.setItem("userID", data.userId);
        } catch (error: any) {
            console.error("Login failed:", error);
            setError(error.response?.data?.message || "Login failed");
        }
    };

    if (user) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">Login</h1>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
            />
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                Login
            </button>
        </form>
    );
};

export default Login;