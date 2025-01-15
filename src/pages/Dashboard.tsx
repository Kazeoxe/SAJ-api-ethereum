import React, { useState, useEffect } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import API from "../services/api";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface PriceEvolution {
    date: string;
    price: number;
}

const Dashboard = () => {
    const [data, setData] = useState<PriceEvolution[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await API.wallet.getWalletData();
                setData(response.data);
                setError(null);
            } catch (err) {
                setError("Failed to fetch wallet data. Please ensure you have set up your wallet address in the Profile section.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const chartData = {
        labels: data.map((entry) => entry.date),
        datasets: [
            {
                label: "Crypto Wallet Price Evolution",
                data: data.map((entry) => entry.price),
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
            },
            title: {
                display: true,
                text: "Crypto Wallet Value Evolution",
            },
        },
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Crypto Wallet Dashboard</h1>
            {isLoading && (
                <div className="flex justify-center items-center h-64">
                    <p>Loading wallet data...</p>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                </div>
            )}
            {!isLoading && !error && data.length > 0 && (
                <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
                    <Line data={chartData} options={chartOptions} />
                </div>
            )}
            {!isLoading && !error && data.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                    <p>No wallet data available. Please set up your wallet in the Profile section.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;