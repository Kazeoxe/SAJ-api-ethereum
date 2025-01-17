export interface EtherscanTransaction {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    isError: string;
    txreceipt_status: string;
  }
  
  export interface EtherscanResponse {
    status: string;
    message: string;
    result: EtherscanTransaction[];
  }