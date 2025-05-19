// src/ai/flows/market-impact-estimation.ts
'use server';

/**
 * @fileOverview Estimates the market impact of a trade using the Almgren-Chriss model.
 *
 * - marketImpactEstimation - A function that estimates the market impact of a trade.
 * - MarketImpactEstimationInput - The input type for the marketImpactEstimation function.
 * - MarketImpactEstimationOutput - The return type for the marketImpactEstimation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MarketImpactEstimationInputSchema = z.object({
  orderSize: z.number().describe('The size of the order to be executed.'),
  assetVolatility: z.number().describe('The volatility of the asset.'),
  tradeDuration: z.number().describe('The duration of the trade execution in days.'),
  riskAversion: z.number().describe('The risk aversion coefficient of the trader.'),
  temporaryImpactCoefficient: z
    .number()
    .describe('The coefficient for temporary market impact.'),
  permanentImpactCoefficient: z
    .number()
    .describe('The coefficient for permanent market impact.'),
});
export type MarketImpactEstimationInput = z.infer<
  typeof MarketImpactEstimationInputSchema
>;

const MarketImpactEstimationOutputSchema = z.object({
  estimatedMarketImpact: z
    .number()
    .describe('The estimated market impact of the trade.'),
});
export type MarketImpactEstimationOutput = z.infer<
  typeof MarketImpactEstimationOutputSchema
>;

export async function marketImpactEstimation(
  input: MarketImpactEstimationInput
): Promise<MarketImpactEstimationOutput> {
  return marketImpactEstimationFlow(input);
}

const marketImpactEstimationPrompt = ai.definePrompt({
  name: 'marketImpactEstimationPrompt',
  input: {schema: MarketImpactEstimationInputSchema},
  output: {schema: MarketImpactEstimationOutputSchema},
  prompt: `You are an expert in quantitative finance, specializing in market impact modeling.
  Use the Almgren-Chriss model to estimate the market impact of a trade, given the following inputs:

  Order Size: {{{orderSize}}}
  Asset Volatility: {{{assetVolatility}}}
  Trade Duration (days): {{{tradeDuration}}}
  Risk Aversion: {{{riskAversion}}}
  Temporary Impact Coefficient: {{{temporaryImpactCoefficient}}}
  Permanent Impact Coefficient: {{{permanentImpactCoefficient}}}

  Based on these parameters, calculate the expected market impact of the trade using Almgren-Chriss model and provide the estimated market impact.

  Ensure the output is a number representing the estimated market impact.
  `,
});

const marketImpactEstimationFlow = ai.defineFlow(
  {
    name: 'marketImpactEstimationFlow',
    inputSchema: MarketImpactEstimationInputSchema,
    outputSchema: MarketImpactEstimationOutputSchema,
  },
  async input => {
    const {output} = await marketImpactEstimationPrompt(input);
    return output!;
  }
);
