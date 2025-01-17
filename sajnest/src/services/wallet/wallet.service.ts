import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { EtherscanService } from '../etherscan/etherscan.service';
import { CryptoCompareService } from '../cryptocompare/cryptocompare.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private etherscanService: EtherscanService,
    private cryptoCompareService: CryptoCompareService
  ) {}

  private async getUserById(userId: number): Promise<User> {
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'wallet'] // Only select needed fields
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async getWallet(userId: number): Promise<{ wallet: string } | null> {
    try {
      this.logger.debug(`Fetching wallet for user ${userId}`);
      const user = await this.getUserById(userId);
      return { wallet: user.wallet || '' };
    } catch (error) {
      this.logger.error(`Error fetching wallet: ${error.message}`);
      throw error;
    }
  }

  async updateWallet(userId: number, walletAddress: string): Promise<{ wallet: string }> {
    try {
      this.logger.debug(`Updating wallet for user ${userId} with address ${walletAddress}`);
      
      // Vérifier d'abord si l'utilisateur existe
      await this.getUserById(userId);

      const result = await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ wallet: walletAddress })
        .where('id = :id', { id: userId })
        .execute();

      if (result.affected === 0) {
        throw new NotFoundException('Failed to update wallet');
      }

      return { wallet: walletAddress };
    } catch (error) {
      this.logger.error(`Error updating wallet: ${error.message}`);
      throw error;
    }
  }

  async getWalletBalanceHistory(userId: number) {
    try {
      const user = await this.getUserById(userId);
      
      if (!user.wallet) {
        throw new BadRequestException('No wallet address found for this user');
      }

      const balanceHistory = await this.etherscanService.getWalletBalanceHistory(user.wallet);
      const currentBalance = await this.etherscanService.getCurrentBalance(user.wallet);
      
      // Get historical prices for each timestamp
      const timestamps = balanceHistory.map(item => item.timestamp);
      const historicalPrices = await this.cryptoCompareService.getHistoricalPrices(timestamps);
      
      // Get current price for the current balance
      const currentPrice = await this.cryptoCompareService.getCurrentPrice();

      return {
        currentBalance,
        currentBalanceEur: (Number(currentBalance) * currentPrice).toString(),
        history: balanceHistory.map(item => {
          const ethBalance = Number(item.balance);
          const eurPrice = historicalPrices[item.timestamp];
          return {
            date: new Date(item.timestamp * 1000).toISOString(),
            balance: item.balance,
            balanceEur: eurPrice ? (ethBalance * eurPrice).toString() : null,
            ethPrice: eurPrice ? eurPrice.toString() : null
          };
        })
      };
    } catch (error) {
      this.logger.error(`Error fetching balance history: ${error.message}`);
      throw error;
    }
  }
}