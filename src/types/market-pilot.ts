
export interface OrderBookLevelData {
  price: string;
  quantity: string;
}

export interface RawOrderBookData {
  timestamp: string;
  exchange: string;
  symbol: string;
  asks: [string, string][]; // [price, quantity]
  bids: [string, string][];
}

export interface FormSchemaType {
  exchange: string;
  spotAsset: string;
  orderType: string;
  quantity: number;
  volatility: number;
  feeRate: number;
}

export interface OutputData {
  expectedSlippage: number | null;
  expectedFees: number | null;
  marketImpact: number | null;
  netCost: number | null;
  makerProportion: number | null;
  takerProportion: number | null;
  internalLatency: number | null;
}

export interface OrderBookDisplayData {
  price: string;
  quantity: string;
  total: string;
}

