import React, { useState, useEffect } from "react";
import API from "../services/api";

const Profile = () => {
  const [wallet, setWallet] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      try {
        var userId = localStorage.getItem("userID");
        
        const { data } = await API.wallet.getWallet(userId);

        setWallet(data.wallet);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch wallet", error);
        setError("Failed to fetch wallet");
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.wallet.updateWallet({ wallet });
      setError(null);
    } catch (error) {
      console.error("Failed to update wallet", error);
      setError("Failed to update wallet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="wallet"
            className="block text-sm font-medium text-gray-700"
          >
            Ethereum Wallet Address
          </label>
          <input
            id="wallet"
            type="text"
            placeholder="0x..."
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="mt-1 w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Updating..." : "Update Wallet"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
