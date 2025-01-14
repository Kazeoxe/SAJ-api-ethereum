import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { Wallet } from './wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [WalletController],
  providers: [
    {
      provide: 'IWalletService',
      useClass: WalletService,
    },
  ],
  exports: ['IWalletService'],
})
export class WalletModule {}