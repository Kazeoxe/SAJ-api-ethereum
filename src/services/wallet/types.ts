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

export interface IWalletService {
  getWallet(userId: string): Promise<IWalletResponse | null>;
  updateWallet(userId: string, address: string): Promise<IWalletResponse>;
  getPriceHistory(symbol?: string): Promise<Array<{date: string; price: number}>>;
}