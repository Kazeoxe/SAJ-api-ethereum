import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { EtherscanService } from '../etherscan/etherscan.service';
import { User } from '../user/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
    HttpModule
  ],
  controllers: [WalletController],
  providers: [WalletService, EtherscanService, AuthGuard],
  exports: [WalletService]
})
export class WalletModule {}