import { Controller, Get, Put, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { IWalletService } from './types';
import { User } from '../decorators/user.decorator';

interface UserRequest {
  userId: string;
  username: string;
}

interface WalletUpdateDto {
  wallet: string;
}

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: IWalletService) {}

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
    if (!walletData.wallet || walletData.wallet.trim().length === 0) {
      throw new BadRequestException('Wallet address is required');
    }

    try {
      const updated = await this.walletService.updateWallet(user.userId, walletData.wallet);
      return { 
        message: 'Wallet updated successfully', 
        wallet: updated.wallet 
      };
    } catch (error) {
      throw new BadRequestException('Failed to update wallet');
    }
  }

  @Get('get_data')
  async getWalletData(@User() user: UserRequest) {
    try {
      const history = await this.walletService.getWalletHistory(user.userId);
      return history;
    } catch (error) {
      throw new BadRequestException('Failed to fetch wallet history');
    }
  }
}