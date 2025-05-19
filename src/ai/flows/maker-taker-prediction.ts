
'use server';
/**
 * @fileOverview Estimates the maker/taker proportion of a trade.
 *
 * - makerTakerPrediction - A function that estimates maker/taker proportions.
 * - MakerTakerPredictionInput - The input type for the makerTakerPrediction function.
 * - MakerTakerPredictionOutput - The return type for the makerTakerPrediction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MakerTakerPredictionInputSchema = z.object({
  orderBookData: z.object({
    timestamp: z.string().describe('The timestamp of the order book data.'),
    exchange: z.string().describe('The exchange the order book data is from.'),
    symbol: z.string().describe('The trading symbol of the order book data.'),
    asks: z.array(z.array(z.string())).describe('The asks (sell orders) in the order book. Each ask is an array containing price and quantity as strings.'),
    bids: z.array(z.array(z.string())).describe('The bids (buy orders) in the order book. Each bid is an array containing price and quantity as strings.'),
  }).describe('Real-time L2 order book data from the exchange.'),
  quantity: z.number().describe('The quantity of the asset to be traded (in USD equivalent).'),
  orderType: z.string().default('market').describe('The type of order (e.g., market, limit). For this simulation, it is typically "market".'),
});
export type MakerTakerPredictionInput = z.infer<typeof MakerTakerPredictionInputSchema>;

const MakerTakerPredictionOutputSchema = z.object({
  makerProportion: z.number().min(0).max(1).describe('The estimated proportion of the trade that would act as a "maker" order (adding liquidity). Value between 0 and 1.'),
  takerProportion: z.number().min(0).max(1).describe('The estimated proportion of the trade that would act as a "taker" order (removing liquidity). Value between 0 and 1.'),
});
export type MakerTakerPredictionOutput = z.infer<typeof MakerTakerPredictionOutputSchema>;

export async function makerTakerPrediction(input: MakerTakerPredictionInput): Promise<MakerTakerPredictionOutput> {
  return makerTakerPredictionFlow(input);
}

const makerTakerPredictionPrompt = ai.definePrompt({
  name: 'makerTakerPredictionPrompt',
  input: {schema: MakerTakerPredictionInputSchema},
  output: {schema: MakerTakerPredictionOutputSchema},
  prompt: `You are a financial markets expert specializing in order execution analysis.
  Based on the provided L2 order book data, the trade quantity, and order type, estimate the likely proportion of the trade that would be filled as a "maker" (adding liquidity) versus a "taker" (removing liquidity).

  A "market" order primarily acts as a "taker" by consuming existing liquidity from the order book.
  Consider the interaction of the order size with the immediate depth of the order book.

  Order Book Data:
  Exchange: {{{orderBookData.exchange}}}
  Symbol: {{{orderBookData.symbol}}}
  Timestamp: {{{orderBookData.timestamp}}}
  Asks: {{{orderBookData.asks}}}
  Bids: {{{orderBookData.bids}}}

  Trade Details:
  Quantity: {{{quantity}}} USD
  Order Type: {{{orderType}}}

  Provide the estimated makerProportion and takerProportion. These proportions must sum to 1.0.
  For a standard "market" order type, the takerProportion should be 1.0 and makerProportion should be 0.0.
  If the order type is not "market", you may need to infer based on general principles, but prioritize the "market" order case.
  `,
});

const makerTakerPredictionFlow = ai.defineFlow(
  {
    name: 'makerTakerPredictionFlow',
    inputSchema: MakerTakerPredictionInputSchema,
    outputSchema: MakerTakerPredictionOutputSchema,
  },
  async input => {
    const {output} = await makerTakerPredictionPrompt(input);
    
    if (output) {
      if (input.orderType.toLowerCase() === 'market') {
        // For market orders, it's definitively 100% taker.
        output.takerProportion = 1.0;
        output.makerProportion = 0.0;
      } else {
        // For other order types (if ever supported), ensure proportions sum to 1.
        // This is a fallback if the AI doesn't perfectly adhere to the sum=1 constraint.
        const sum = output.makerProportion + output.takerProportion;
        if (sum === 0) { // Avoid division by zero, default to taker if both are 0
            output.makerProportion = 0.0;
            output.takerProportion = 1.0;
        } else if (Math.abs(sum - 1.0) > 0.001) { // Allow for small floating point inaccuracies
            output.makerProportion = output.makerProportion / sum;
            output.takerProportion = output.takerProportion / sum;
        }
      }
      return output;
    }
    
    // Default if AI output is null or any other issue
    return { makerProportion: 0.0, takerProportion: 1.0 };
  }
);
