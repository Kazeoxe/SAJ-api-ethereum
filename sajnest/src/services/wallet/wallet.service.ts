import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import axios from 'axios';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  private validateUserId(userId: string): number {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const numericId = parseInt(userId, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    return numericId;
  }

  async getWallet(userId: string): Promise<any> {
    try {
      const numericId = this.validateUserId(userId);
      this.logger.debug(`Fetching wallet for user ${numericId}`);

      const user = await this.userRepository
        .createQueryBuilder('user')
        .select(['user.wallet'])
        .where('user.id = :id', { id: numericId })
        .getOne();

      return { wallet: user?.wallet || '' };
    } catch (error) {
      this.logger.error('Error fetching wallet:', error);
      throw error;
    }
  }

  async updateWallet(userId: string, walletAddress: string): Promise<any> {
    try {
      const numericId = this.validateUserId(userId);
      this.logger.debug(`Updating wallet for user ${numericId} with address ${walletAddress}`);

      const result = await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ wallet: walletAddress })
        .where('id = :id', { id: numericId })
        .execute();

      if (result.affected === 0) {
        throw new NotFoundException('User not found');
      }

      return { wallet: walletAddress };
    } catch (error) {
      this.logger.error('Error updating wallet:', error);
      throw error;
    }
  }

  async getWalletHistory(userId: string) {
    const user = await this.getWallet(userId);
    if (!user?.wallet) {
      return [];
    }
    
    return this.getPriceHistory('ETH');
  }

  private async getPriceHistory(symbol: string = 'ETH') {
    const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
    const limit = 30;
    
    try {
      const { data } = await axios.get(
        `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&limit=${limit}&api_key=${apiKey}`
      );
      
      return data.Data.Data.map((item: any) => ({
        date: new Date(item.time * 1000).toISOString().split('T')[0],
        price: item.close,
      }));
    } catch (error) {
      this.logger.error('Error fetching price history:', error);
      return [];
    }
  }
}