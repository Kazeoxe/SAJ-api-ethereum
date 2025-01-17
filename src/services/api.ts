import axios from "axios";

const AuthAPI = axios.create({
    baseURL: process.env.REACT_APP_AUTH_API_URL || "http://localhost:8080/api/v1",
    withCredentials: true,
});

const WalletAPI = axios.create({
    baseURL: process.env.REACT_APP_WALLET_API_URL || "http://localhost:5001/api/v1/",
    withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const TokenService = {
    getToken: () => localStorage.getItem("token"),
    setToken: (token: string) => localStorage.setItem("token", token),
    removeToken: () => localStorage.removeItem("token"),
};


const onRefreshed = (token: string) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

[AuthAPI, WalletAPI].forEach(api => {
    api.interceptors.request.use(
        (config) => {
            const token = TokenService.getToken();
            console.log('Token:', token);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                if (isRefreshing) {
                    return new Promise((resolve) => {
                        addRefreshSubscriber((token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(api(originalRequest));
                        });
                    });
                }

                isRefreshing = true;

                try {
                    const { data } = await AuthAPI.post(
                        "/auth/refresh-token",
                        {},
                        { withCredentials: true }
                    );

                    const { accessToken } = data;
                    TokenService.setToken(accessToken);
                    //

                    [AuthAPI, WalletAPI].forEach(instance => {
                        instance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
                    });

                    onRefreshed(accessToken);
                    isRefreshing = false;

                    return api(originalRequest);
                } catch (err: any) {
                    console.error("Token refresh failed:", err.message);
                    TokenService.removeToken();
                    isRefreshing = false;
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    window.location.href = "/login";
                    return Promise.reject(err);
                }
            }
            return Promise.reject(error);
        }
    );
});

const API = {

    auth: {
        login: (data: any) => AuthAPI.post("/auth/login", data),
        register: (data: any) => AuthAPI.post("/auth/register", data),
        verifyEmail: (data: any) => AuthAPI.post("/auth/verify-email", data),
        refresh: () => AuthAPI.post("/auth/refresh-token"),
        logout: () => AuthAPI.delete("/logout"),
    },

    wallet: {
        getWallet: (data :  any) => WalletAPI.get("/wallet/get_wallet",data),
        updateWallet: (data: any) => WalletAPI.put("/wallet/update_wallet", data),
        getBalanceHistory: () => WalletAPI.get("/wallet/balance-history")
    },

    get: (url: string) => {
        if (url.startsWith("/auth")) return AuthAPI.get(url);
        return WalletAPI.get(url);
    },
    post: (url: string, data?: any) => {
        if (url.startsWith("/auth")) return AuthAPI.post(url, data);
        return WalletAPI.post(url, data);
    },
    put: (url: string, data?: any) => {
        if (url.startsWith("/auth")) return AuthAPI.put(url, data);
        return WalletAPI.put(url, data);
    }
};

export default API;
