"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWebSocket } from '@/hooks/useWebSocket';
import { InputPanel } from '@/components/market-pilot/InputPanel';
import { OutputPanel } from '@/components/market-pilot/OutputPanel';
import { OrderBookDisplay } from '@/components/market-pilot/OrderBookDisplay';
import type { FormSchemaType, OutputData, RawOrderBookData } from '@/types/market-pilot';
import { slippagePrediction } from '@/ai/flows/slippage-prediction';
import { marketImpactEstimation } from '@/ai/flows/market-impact-estimation';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  exchange: z.string().default("OKX"),
  spotAsset: z.string().default("BTC-USDT-SWAP"),
  orderType: z.string().default("market"),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  volatility: z.number().min(0, "Volatility must be non-negative").max(1, "Volatility usually between 0 and 1"),
  feeRate: z.number().min(0, "Fee rate must be non-negative").max(0.1, "Fee rate seems high"),
});

const DEBOUNCE_DELAY = 500; // milliseconds

export default function MarketPilotPage() {
  const { toast } = useToast();
  const { orderBookData, isConnected, error: wsError } = useWebSocket();
  
  const [outputs, setOutputs] = useState<OutputData>({
    expectedSlippage: null,
    expectedFees: null,
    marketImpact: null,
    netCost: null,
    internalLatency: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exchange: "OKX",
      spotAsset: "BTC-USDT-SWAP",
      orderType: "market",
      quantity: 100,
      volatility: 0.02,
      feeRate: 0.001,
    },
  });

  const watchedFormValues = useWatch({ control: form.control });

  const runSimulation = useCallback(async (currentFormData: FormSchemaType, currentOrderBookData: RawOrderBookData | null) => {
    if (!currentOrderBookData) {
      // Don't run if order book isn't ready, unless it's the initial load for fees.
      if (outputs.expectedFees === null) { // Initial fee calculation
         const fees = currentFormData.quantity * currentFormData.feeRate;
         setOutputs(prev => ({ ...prev, expectedFees: fees, netCost: fees + (prev.expectedSlippage || 0) + (prev.marketImpact || 0) }));
      }
      return;
    }

    setIsLoading(true);
    setSimulationError(null);
    const startTime = performance.now();

    try {
      const { quantity, volatility, feeRate } = currentFormData;

      // Slippage Prediction
      const slippageInput = {
        orderBookData: currentOrderBookData,
        quantity,
        volatility,
      };
      const slippageResult = await slippagePrediction(slippageInput);
      const expectedSlippage = slippageResult.expectedSlippage;

      // Market Impact Estimation
      const marketImpactInput = {
        orderSize: quantity,
        assetVolatility: volatility,
        tradeDuration: 1, // Default: 1 day
        riskAversion: 0.5, // Default
        temporaryImpactCoefficient: 0.1, // Default
        permanentImpactCoefficient: 0.1, // Default
      };
      const marketImpactResult = await marketImpactEstimation(marketImpactInput);
      const marketImpact = marketImpactResult.estimatedMarketImpact;
      
      const expectedFees = quantity * feeRate;
      const netCost = (expectedSlippage || 0) + (expectedFees || 0) + (marketImpact || 0);
      const internalLatency = performance.now() - startTime;

      setOutputs({
        expectedSlippage,
        expectedFees,
        marketImpact,
        netCost,
        internalLatency,
      });

    } catch (err) {
      console.error("Simulation error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during simulation.";
      setSimulationError(errorMessage);
      toast({
        title: "Simulation Error",
        description: errorMessage,
        variant: "destructive",
      });
      // Reset AI-dependent outputs on error
      setOutputs(prev => ({
        ...prev,
        expectedSlippage: null,
        marketImpact: null,
        netCost: prev.expectedFees, // Keep fees if calculable
        internalLatency: performance.now() - startTime,
      }));
    } finally {
      setIsLoading(false);
    }
  }, [toast, outputs.expectedFees]); // Added outputs.expectedFees to ensure it's stable for initial fee calc

  // Effect for WebSocket errors
  useEffect(() => {
    if (wsError) {
      toast({
        title: "WebSocket Error",
        description: wsError,
        variant: "destructive",
      });
    }
  }, [wsError, toast]);

  // Effect for running simulation on form data change (debounced) or order book update
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Validate form before proceeding
    const isValid = formSchema.safeParse(watchedFormValues).success;
    if (!isValid) {
       // Calculate fees even if form is partially invalid, if quantity and feeRate are numbers
      if (typeof watchedFormValues.quantity === 'number' && typeof watchedFormValues.feeRate === 'number') {
        const fees = watchedFormValues.quantity * watchedFormValues.feeRate;
        setOutputs(prev => ({ 
            ...prev, 
            expectedSlippage: null,
            marketImpact: null,
            expectedFees: fees, 
            netCost: fees 
        }));
      }
      return; // Don't run simulation if form is invalid
    }

    debounceTimeoutRef.current = setTimeout(() => {
      runSimulation(watchedFormValues, orderBookData);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [watchedFormValues, orderBookData, runSimulation, formSchema]);


  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary">MarketPilot</h1>
        <p className="text-lg text-muted-foreground">
          Real-time Trade Cost & Market Impact Simulator
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <InputPanel form={form} onSubmit={() => {}} isLoading={isLoading} />
        </div>
        
        <div className="w-full md:w-2/3 flex flex-col gap-6">
          <OutputPanel outputs={outputs} isLoading={isLoading} error={simulationError} />
          <OrderBookDisplay data={orderBookData} isConnected={isConnected} />
        </div>
      </div>

      {!isConnected && (
         <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg flex items-center">
           <Loader2 className="h-4 w-4 animate-spin mr-2" />
           WebSocket disconnected. Attempting to reconnect...
         </div>
      )}
       {isLoading && (
         <div className="fixed bottom-4 left-4 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg flex items-center">
           <Loader2 className="h-4 w-4 animate-spin mr-2" />
           Processing...
         </div>
      )}
    </div>
  );
}
