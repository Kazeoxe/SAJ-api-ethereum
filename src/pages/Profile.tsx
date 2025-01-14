import React, { useState, useEffect } from "react";
import API from "../services/api";

const Profile = () => {
    const [wallet, setWallet] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    useEffect(() => {
        // const fetchWallet = async () => {
        //     try {
        //         const { data } = await API.get("/wallet/get_wallet");
        //         setWallet(data.wallet);
        //     } catch (error) {
        //         console.error("Failed to fetch wallet:", error);
        //         setError("Failed to fetch wallet");
        //     }
        // };

        //fetchWallet();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        
        try {
            console.log("Sending wallet update:", { wallet });  // Debug log

            const response = await API.put("/wallet/update_wallet", { wallet });
            
            console.log("Update response:", response);  // Debug log
            setSuccess("Wallet updated successfully");
        } catch (error: any) {
            console.error("Failed to update wallet:", error.response || error);
            setError(error.response?.data?.message || "Failed to update wallet");
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">Profile</h1>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {success}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    placeholder="Wallet"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="w-full p-2 border rounded"
                />
                <button 
                    type="submit" 
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                    Update Wallet
                </button>
            </form>
        </div>
    );
};

export default Profile;