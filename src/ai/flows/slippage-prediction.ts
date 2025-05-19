'use server';
/**
 * @fileOverview Estimates the expected slippage of a trade using a linear regression model.
 *
 * - slippagePrediction - A function that handles the slippage prediction process.
 * - SlippagePredictionInput - The input type for the slippagePrediction function.
 * - SlippagePredictionOutput - The return type for the slippagePrediction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SlippagePredictionInputSchema = z.object({
  orderBookData: z.object({
    timestamp: z.string().describe('The timestamp of the order book data.'),
    exchange: z.string().describe('The exchange the order book data is from.'),
    symbol: z.string().describe('The trading symbol of the order book data.'),
    asks: z.array(z.array(z.string())).describe('The asks (sell orders) in the order book. Each ask is an array containing price and quantity as strings.'),
    bids: z.array(z.array(z.string())).describe('The bids (buy orders) in the order book. Each bid is an array containing price and quantity as strings.'),
  }).describe('Real-time L2 order book data from the exchange.'),
  quantity: z.number().describe('The quantity of the asset to be traded (in USD equivalent).'),
  volatility: z.number().describe('The market volatility parameter.'),
});
export type SlippagePredictionInput = z.infer<typeof SlippagePredictionInputSchema>;

const SlippagePredictionOutputSchema = z.object({
  expectedSlippage: z.number().describe('The estimated slippage cost for the trade.'),
});
export type SlippagePredictionOutput = z.infer<typeof SlippagePredictionOutputSchema>;

export async function slippagePrediction(input: SlippagePredictionInput): Promise<SlippagePredictionOutput> {
  return slippagePredictionFlow(input);
}

const slippagePredictionPrompt = ai.definePrompt({
  name: 'slippagePredictionPrompt',
  input: {schema: SlippagePredictionInputSchema},
  output: {schema: SlippagePredictionOutputSchema},
  prompt: `You are a financial analyst specializing in cryptocurrency trading.
  You will use the provided order book data, trade quantity, and market volatility to estimate the expected slippage for a market order.
  Slippage is the difference between the expected price of a trade and the price at which the trade is executed.
  It occurs because a market order is immediately filled at the best available prices in the order book, which may be different from the last traded price.

  Consider the following factors when estimating slippage:
  - Order book depth: The liquidity available at different price levels.
  - Order size: The quantity of the asset to be traded relative to the order book depth.
  - Market volatility: Higher volatility generally leads to higher slippage.

  Here is the order book data:
  Exchange: {{{orderBookData.exchange}}}
  Symbol: {{{orderBookData.symbol}}}
  Timestamp: {{{orderBookData.timestamp}}}
  Asks: {{{orderBookData.asks}}}
  Bids: {{{orderBookData.bids}}}

  Trade Details:
  Quantity: {{{quantity}}} USD
  Volatility: {{{volatility}}}

  Based on this information, estimate the expected slippage cost for the trade. Return the result as a floating point number.
  Ensure that the expectedSlippage is the total expected slippage in USD.
  `,
});

const slippagePredictionFlow = ai.defineFlow(
  {
    name: 'slippagePredictionFlow',
    inputSchema: SlippagePredictionInputSchema,
    outputSchema: SlippagePredictionOutputSchema,
  },
  async input => {
    const {output} = await slippagePredictionPrompt(input);
    return output!;
  }
);
