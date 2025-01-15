import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WalletModule } from './services/wallet/wallet.module';
import { AuthModule } from './services/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './services/user/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot(), // Charge les variables d'environnement depuis .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ,
      port: parseInt(process.env.DB_PORT ),
      username: process.env.DB_USERNAME ,
      password: process.env.DB_PASSWORD ,
      database: process.env.DB_NAME ,
      entities: [User],
      synchronize: false,
      logging: true, // Pour voir les requêtes SQL pendant le développement
    }),
    HttpModule,
    WalletModule,
    AuthModule
  ],
})
export class AppModule {}