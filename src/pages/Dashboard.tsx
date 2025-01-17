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

interface BalanceHistory {
    date: string;
    balance: number;
}

interface WalletData {
    currentBalance: number;
    history: BalanceHistory[];
}

const Dashboard = () => {
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await API.wallet.getBalanceHistory();
                setWalletData(response.data);
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
console.log(walletData?.history);
    const chartData = walletData ? {
        labels: walletData.history.map((entry) => {
            const date = new Date(entry.date);
            return date.toLocaleDateString();
        }),
        datasets: [
            {
                label: "Wallet Balance (ETH)",
                data: walletData.history.map((entry) => entry.balance),
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.4,
            },
        ],
    } : null;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
            },
            title: {
                display: true,
                text: "Wallet Balance Evolution",
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => `Balance: ${context.raw.toFixed(4)} ETH`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value: any) => `${value} ETH`
                }
            }
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Wallet Dashboard</h1>
            
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

            {!isLoading && !error && walletData && (
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">
                            Current Balance: {walletData.currentBalance.toFixed(10)} ETH
                        </h2>
                        {chartData && <Line data={chartData} options={chartOptions} />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;