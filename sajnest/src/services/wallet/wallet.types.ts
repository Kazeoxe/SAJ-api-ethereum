export interface IWallet {
    id: number;
    userId: string;
    address: string;
    createdAt: Date;
  }
  
  export interface IWalletResponse {
    wallet: string;
    id: number;
    userId: string;
    createdAt: Date;
  }
  
  export interface PriceHistoryResponse {
    date: string;
    price: number;
  }
  
  export interface IWalletService {
    getWallet(userId: string): Promise<IWalletResponse | null>;
    updateWallet(userId: string, address: string): Promise<IWalletResponse>;
    getPriceHistory(symbol?: string): Promise<PriceHistoryResponse[]>;
    getWalletHistory(userId: string): Promise<PriceHistoryResponse[]>;
  }