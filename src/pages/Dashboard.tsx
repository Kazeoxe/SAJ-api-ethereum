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
    balance: string;
    balanceEur: string | null;
}

interface WalletData {
    currentBalance: string;
    currentBalanceEur: string;
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

    const chartData = walletData ? {
        labels: walletData.history.map((entry) => {
            const date = new Date(entry.date);
            return date.toLocaleDateString();
        }),
        datasets: [
            {
                label: "Wallet Balance (ETH)",
                data: walletData.history.map((entry) => Number(entry.balance)),
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: "Wallet Value (EUR)",
                data: walletData.history.map((entry) => entry.balanceEur ? Number(entry.balanceEur) : null),
                borderColor: "rgba(153, 102, 255, 1)",
                backgroundColor: "rgba(153, 102, 255, 0.2)",
                tension: 0.4,
                yAxisID: 'y1'
            }
        ],
    } : null;

    const chartOptions = {
        responsive: true,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
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
                    label: (context: any) => {
                        if (context.datasetIndex === 0) {
                            return `Balance: ${Number(context.raw).toFixed(8)} ETH`;
                        } else {
                            return `Value: ${Number(context.raw).toFixed(2)} EUR`;
                        }
                    }
                }
            }
        },
        scales: {
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                    display: true,
                    text: 'ETH'
                },
                ticks: {
                    callback: (value: any) => `${Number(value).toFixed(8)} ETH`
                }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                    display: true,
                    text: 'EUR'
                },
                ticks: {
                    callback: (value: any) => `${Number(value).toFixed(2)} €`
                },
                grid: {
                    drawOnChartArea: false,
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
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Current Balance: {Number(walletData.currentBalance).toFixed(8)} ETH
                                </h2>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Current Value: {Number(walletData.currentBalanceEur).toFixed(2)} EUR
                                </h2>
                            </div>
                        </div>
                        {chartData && <Line data={chartData} options={chartOptions} />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;