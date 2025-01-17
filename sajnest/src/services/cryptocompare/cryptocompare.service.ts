import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CryptoCompareService {
  private readonly logger = new Logger(CryptoCompareService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://min-api.cryptocompare.com/data';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('CRYPTOCOMPARE_API_KEY');
  }

  async getHistoricalPrices(timestamps: number[]): Promise<Record<number, number>> {
    try {
      // Sort timestamps and remove duplicates
      const uniqueTimestamps = [...new Set(timestamps)].sort();
      const priceData: Record<number, number> = {};

      // CryptoCompare has a rate limit, so we'll process in batches if needed
      const batchSize = 15;
      for (let i = 0; i < uniqueTimestamps.length; i += batchSize) {
        const batch = uniqueTimestamps.slice(i, i + batchSize);
        const promises = batch.map(timestamp =>
          axios.get(`${this.baseUrl}/v2/histohour`, {
            params: {
              fsym: 'ETH',
              tsym: 'EUR',
              limit: 1,
              toTs: timestamp,
              api_key: this.apiKey
            },
            headers: {
              'Authorization': `Apikey ${this.apiKey}`
            }
          })
        );

        const responses = await Promise.all(promises);
        
        responses.forEach((response, index) => {
          const timestamp = batch[index];
          if (response.data.Response === 'Success' && 
              response.data.Data && 
              response.data.Data.Data && 
              response.data.Data.Data.length > 0) {
            // Prendre le prix de clôture (close) pour cette période
            priceData[timestamp] = response.data.Data.Data[0].close;
          }
        });

        // Ajouter un petit délai entre les lots pour respecter les limites de l'API
        if (i + batchSize < uniqueTimestamps.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      return priceData;
    } catch (error) {
      this.logger.error('Error fetching historical prices:', error);
      throw error;
    }
  }
  
  // Ajout d'une méthode pour obtenir le prix actuel
  async getCurrentPrice(): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/price`, {
        params: {
          fsym: 'ETH',
          tsyms: 'EUR',
          api_key: this.apiKey
        },
        headers: {
          'Authorization': `Apikey ${this.apiKey}`
        }
      });

      if (response.data && response.data.EUR) {
        return response.data.EUR;
      }
      throw new Error('Failed to fetch current price');
    } catch (error) {
      this.logger.error('Error fetching current price:', error);
      throw error;
    }
  }
}