import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { User } from '../user/user.entity';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User])
  ],
  controllers: [WalletController],
  providers: [WalletService, AuthGuard],
  exports: [WalletService]
})
export class WalletModule {}