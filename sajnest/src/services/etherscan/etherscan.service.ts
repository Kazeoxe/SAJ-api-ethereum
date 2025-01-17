import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {ethers} from 'ethers'

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
  balance: string;
  txHash: string;
  change: string;
  type: 'IN' | 'OUT';
}

@Injectable()
export class EtherscanService {
  private readonly logger = new Logger(EtherscanService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.etherscan.io/api';
  private readonly WEI_PER_ETH = BigInt('1000000000000000000'); // 1e18

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ETHERSCAN_API_KEY');
  }

  // convert Wei (as BigInt) to ETH (as string)
  private weiToEth(wei: bigint): string {
    const eth = wei / this.WEI_PER_ETH;
    const remainder = wei % this.WEI_PER_ETH;
    const decimals = remainder.toString().padStart(18, '0');
    return `${eth.toString()}.${decimals}`;
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

  private async getAllTransactions(address: string): Promise<Transaction[]> {
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

      const txs = [
        ...(normalTxs.data.status === '1' ? normalTxs.data.result : []),
        ...(internalTxs.data.status === '1' ? internalTxs.data.result : [])
      ];
      console.log('Fetched ' + txs.length + ' transactions');
      return txs
    } catch (error) {
      this.logger.error('Error fetching transactions:', error);
      return [];
    }
  }

  private calculateBalanceHistory(address: string, transactions: Transaction[]): WalletBalance[] {
    const history: WalletBalance[] = [];
    const addressLower = address.toLowerCase();
    
    // Filter and sort transactions
    const validTransactions = transactions
      .sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));

    console.log(validTransactions.length + ' valid transactions');

    let runningBalance = BigInt(0);

    validTransactions.forEach(tx => {
      const timestamp = parseInt(tx.timeStamp);
      const value = BigInt(tx.value);
      let change = BigInt(0);

      if (tx.to.toLowerCase() === addressLower) {
        // transaction entrante: ajouter la valeur
        change = value;
        runningBalance += value;
      } else if (tx.from.toLowerCase() === addressLower) {
        // transaction sortante: soustraire la valeur et les frais de gaz
        const gasCost = tx.gasUsed && tx.gasPrice ? BigInt(tx.gasUsed) * BigInt(tx.gasPrice) : 0n; 
        change = -(value + gasCost);
        runningBalance -= (value + gasCost);
      }

      history.push({
        timestamp,
        balance: ethers.formatEther(runningBalance),
        txHash: tx.hash,
        change: ethers.formatEther(change),
        type: change >= 0n ? 'IN' : 'OUT'
      });
  });

  return history;
}

  async getCurrentBalance(address: string): Promise<string> {
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
        const balanceWei = BigInt(response.data.result);
        return this.weiToEth(balanceWei);
      }
      throw new Error('Failed to fetch current balance');
    } catch (error) {
      this.logger.error('Error fetching current balance:', error);
      throw error;
    }
  }
}