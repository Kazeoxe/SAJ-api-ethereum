import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import axios from 'axios';
import { EtherscanService } from '../etherscan/etherscan.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private etherscanService: EtherscanService
  ) {}

  private validateUserId(userId: number): number {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const numericId = parseInt(userId.toString(), 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    return numericId;
  }

  async getWallet(userId: number): Promise<any> {
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

  async updateWallet(userId: number, walletAddress: string): Promise<any> {
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

  private async getPriceHistory(symbol: string = 'ETH') {
    const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
    const limit = 10;
    
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

  async getWalletBalanceHistory(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user?.wallet) {
      throw new NotFoundException('Wallet not found');
    }

    try {
      const balanceHistory = await this.etherscanService.getWalletBalanceHistory(user.wallet);
      const currentBalance = await this.etherscanService.getCurrentBalance(user.wallet);

      return {
        currentBalance,
        history: balanceHistory.map(item => ({
          date: new Date(item.timestamp * 1000).toISOString(),
          balance: item.balance
        }))
      };
    } catch (error) {
      this.logger.error('Error fetching balance history:', error);
      throw error;
    }
  }
}