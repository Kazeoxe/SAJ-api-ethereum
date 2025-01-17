import { Controller, Get, Put, Body, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { WalletService } from './wallet.service';
import { User } from '../decorators/user.decorator';

interface UserRequest {
  userId: number; // Reste en string car c'est ce que nous envoie l'AuthGuard
  username: string;
}

interface WalletUpdateDto {
  wallet: string;
}

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  private readonly logger = new Logger(WalletController.name);
  
  constructor(private walletService: WalletService) {}  

  @Get('get_wallet')
  async getWallet(@User() user: UserRequest) {
    try {
      const wallet = await this.walletService.getWallet(user.userId);
      return { wallet: wallet?.wallet || '' };
    } catch (error) {
      throw new BadRequestException('Failed to fetch wallet');
    }
  }

  @Put('update_wallet')
  async updateWallet(
    @User() user: UserRequest,
    @Body() walletData: WalletUpdateDto
  ) {
    this.logger.debug(`User from token: ${JSON.stringify(user)}`);
    this.logger.debug(`Received update wallet request for user ${user?.userId}`);
    this.logger.debug('Wallet data:', walletData);
  
    if (!user?.userId) {
      this.logger.error('No user ID found in request');
      throw new BadRequestException('User not authenticated');
    }
  
    if (!walletData.wallet || walletData.wallet.trim().length === 0) {
      throw new BadRequestException('Wallet address is required');
    }
  
    try {
      const updated = await this.walletService.updateWallet(user.userId, walletData.wallet);
      this.logger.debug('Wallet updated successfully:', updated);
      
      return { 
        message: 'Wallet updated successfully', 
        wallet: updated.wallet 
      };
    } catch (error) {
      this.logger.error('Failed to update wallet:', error);
      throw new BadRequestException('Failed to update wallet');
    }
  }

 
  @Get('balance-history')
  async getBalanceHistory(@User() user: UserRequest) {
    this.logger.debug(`Getting balance history for user: ${user.userId}`);
    try {
      return await this.walletService.getWalletBalanceHistory(user.userId);
    } catch (error) {
      this.logger.error('Failed to fetch balance history:', error);
      throw new BadRequestException('Failed to fetch balance history');
    }
  }
}