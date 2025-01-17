import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface Transaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  isError: string;
}

interface WalletBalance {
  timestamp: number;
  balance: number;
  txHash: string;
  change: number;
  type: 'IN' | 'OUT';
}

@Injectable()
export class EtherscanService {
  private readonly logger = new Logger(EtherscanService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.etherscan.io/api';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ETHERSCAN_API_KEY');
  }

  async getWalletBalanceHistory(address: string): Promise<WalletBalance[]> {
    try {
      const transactions = await this.getAllTransactions(address);
      return this.calculateBalanceHistory(address, transactions);
    } catch (error) {
      this.logger.error('Error fetching wallet history:', error);
      throw error;
    }
  }

  private async getAllTransactions(address: string): Promise<any[]> {
    try {
      const [normalTxs, internalTxs] = await Promise.all([
        axios.get(this.baseUrl, {
          params: {
            module: 'account',
            action: 'txlist',
            address,
            startblock: 0,
            endblock: 99999999,
            sort: 'asc',
            apikey: this.apiKey
          }
        }),
        axios.get(this.baseUrl, {
          params: {
            module: 'account',
            action: 'txlistinternal',
            address,
            startblock: 0,
            endblock: 99999999,
            sort: 'asc',
            apikey: this.apiKey
          }
        })
      ]);

      return [
        ...(normalTxs.data.status === '1' ? normalTxs.data.result : []),
        ...(internalTxs.data.status === '1' ? internalTxs.data.result : [])
      ];
    } catch (error) {
      this.logger.error('Error fetching transactions:', error);
      return [];
    }
  }

  private calculateBalanceHistory(address: string, transactions: any[]): WalletBalance[] {
    const history: WalletBalance[] = [];
    const addressLower = address.toLowerCase();
    
    // Filtrer et trier les transactions
    const validTransactions = transactions
      .filter(tx => tx.isError === '0')
      .sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));

    let runningBalance = 0;

    validTransactions.forEach(tx => {
      const timestamp = parseInt(tx.timeStamp);
      const value = parseFloat(tx.value) / 1e18;// 1e18 = 1 ether
      let change = 0;

      if (tx.to.toLowerCase() === addressLower) {
        // Transaction entrante : ajouter uniquement la valeur
        change = value;
        runningBalance += value;
      } else if (tx.from.toLowerCase() === addressLower) {
        // Transaction sortante : soustraire la valeur et les frais
        const gasCost = (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice)) / 1e18;
        change = -(value + gasCost);
        runningBalance -= (value + gasCost);
      }

      if (Math.abs(change) >= 0.000001 || history.length === 0) {
        history.push({
          timestamp,
          balance: Number(Math.max(0, runningBalance).toFixed(8)),
          txHash: tx.hash,
          change: Number(change.toFixed(8)),
          type: change >= 0 ? 'IN' : 'OUT'
        });
      }
    });

    return history;
  }

  async getCurrentBalance(address: string): Promise<number> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          module: 'account',
          action: 'balance',
          address,
          tag: 'latest',
          apikey: this.apiKey
        }
      });

      if (response.data.status === '1') {
        return parseFloat(response.data.result) / 1e18;
      }
      throw new Error('Failed to fetch current balance');
    } catch (error) {
      this.logger.error('Error fetching current balance:', error);
      throw error;
    }
  }
}