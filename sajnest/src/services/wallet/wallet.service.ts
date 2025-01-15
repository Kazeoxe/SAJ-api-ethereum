import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
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
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async getWallet(userId: string): Promise<any> {
    this.logger.debug(`Fetching wallet for user ${userId}`);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    this.logger.debug('User found:', user);
    return { wallet: user?.wallet || '' };
  }

  async updateWallet(userId: string, walletAddress: string): Promise<any> {
    this.logger.debug(`Updating wallet for user ${userId} with address ${walletAddress}`);

    let user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      this.logger.error('User not found');
      throw new Error('User not found');
    }

    try {
      user.wallet = walletAddress;
      const savedUser = await this.userRepository.save(user);
      this.logger.debug('Wallet updated successfully:', savedUser);
      return { wallet: savedUser.wallet };
    } catch (error) {
      this.logger.error('Error updating wallet:', error);
      throw error;
    }
  }

  async getWalletHistory(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user?.wallet) {
      return [];
    }
    
    return this.getPriceHistory('ETH');
  }

  async getPriceHistory(symbol: string = 'ETH') {
    const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
    const limit = 30;
    
    try {
      const { data } = await axios.get<CryptoApiResponse>(
        `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&limit=${limit}&api_key=${apiKey}`
      );
      
      return data.Data.Data.map((item: CryptoDataPoint) => ({
        date: new Date(item.time * 1000).toISOString().split('T')[0],
        price: item.close,
      }));
    } catch (error) {
      console.error('Error fetching price history:', error);
      return [];
    }
  }
}