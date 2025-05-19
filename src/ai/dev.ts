
import { config } from 'dotenv';
config();

import '@/ai/flows/slippage-prediction.ts';
import '@/ai/flows/market-impact-estimation.ts';
import '@/ai/flows/maker-taker-prediction.ts';
