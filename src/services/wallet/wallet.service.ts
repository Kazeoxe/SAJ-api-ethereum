import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './wallet.entity';
import { IWalletService, IWalletResponse } from './types';
import axios from 'axios';

interface CryptoDataPoint {
  time: number;
  close: number;
}

interface CryptoApiResponse {
  Data: {
    Data: CryptoDataPoint[];
  };
}

@Injectable()
export class WalletService implements IWalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>
  ) {}

  private transformToResponse(wallet: Wallet): IWalletResponse {
    return {
      id: wallet.id,
      userId: wallet.userId,
      wallet: wallet.wallet,
      createdAt: wallet.createdAt
    };
  }

  async getWallet(userId: string): Promise<IWalletResponse | null> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });
    return wallet ? this.transformToResponse(wallet) : null;
  }

  async updateWallet(userId: string, walletAddress: string): Promise<IWalletResponse> {
    let wallet = await this.walletRepository.findOne({ where: { userId } });
    if (!wallet) {
      wallet = this.walletRepository.create({ 
        userId, 
        wallet: walletAddress 
      });
    } else {
      wallet.wallet = walletAddress;
    }
    const savedWallet = await this.walletRepository.save(wallet);
    return this.transformToResponse(savedWallet);
  }

  async getPriceHistory(symbol: string = 'BTC') {
    const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
    const limit = 30;
    
    const { data } = await axios.get<CryptoApiResponse>(
      `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&limit=${limit}&api_key=${apiKey}`
    );
    
    return data.Data.Data.map((item: CryptoDataPoint) => ({
      date: new Date(item.time * 1000).toISOString().split('T')[0],
      price: item.close,
    }));
  }
}