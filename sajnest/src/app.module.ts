import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WalletModule } from './services/wallet/wallet.module';
import { AuthModule } from './services/auth/auth.module';
import { Wallet } from './services/wallet/wallet.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(), // Charge les variables d'environnement depuis .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'your_password',
      database: process.env.DB_NAME || 'wallet_db',
      entities: [Wallet],
      synchronize: true, // À désactiver en production
      logging: true, // Pour voir les requêtes SQL pendant le développement
    }),
    HttpModule,
    WalletModule,
    AuthModule
  ],
})
export class AppModule {}