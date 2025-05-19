
"use client";

import type { OutputData } from '@/types/market-pilot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingDown, 
  Landmark, 
  Activity, 
  DollarSign, 
  Timer, 
  AlertCircle,
  ClipboardPlus, // Icon for Maker
  ClipboardMinus // Icon for Taker
} from "lucide-react";

interface OutputPanelProps {
  outputs: OutputData;
  isLoading: boolean;
  error: string | null;
}

interface OutputMetricProps {
  icon: React.ElementType;
  label: string;
  value: number | null;
  unit?: string;
  isLoading: boolean;
  tooltip?: string;
  isPercentage?: boolean;
}

const OutputMetric = ({ icon: Icon, label, value, unit, isLoading, tooltip, isPercentage = false }: OutputMetricProps) => (
  <div className="flex items-center justify-between py-3 border-b last:border-b-0">
    <div className="flex items-center">
      <Icon className="mr-3 h-5 w-5 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    {isLoading ? (
      <Skeleton className="h-5 w-20" />
    ) : (
      <span className="text-sm font-semibold text-primary">
        {value !== null && value !== undefined 
          ? `${isPercentage ? (value * 100).toFixed(2) : value.toFixed(4)}${unit || ''}` 
          : 'N/A'}
      </span>
    )}
  </div>
);


export function OutputPanel({ outputs, isLoading, error }: OutputPanelProps) {
  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <DollarSign className="mr-2 h-6 w-6 text-primary" />
          Simulation Results
        </CardTitle>
        {error && (
          <CardDescription className="flex items-center text-destructive pt-2">
             <AlertCircle className="mr-2 h-4 w-4" /> {error}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <OutputMetric
            icon={TrendingDown}
            label="Expected Slippage"
            value={outputs.expectedSlippage}
            unit=" USD"
            isLoading={isLoading && outputs.expectedSlippage === null}
          />
          <OutputMetric
            icon={Landmark}
            label="Expected Fees"
            value={outputs.expectedFees}
            unit=" USD"
            isLoading={isLoading && outputs.expectedFees === null}
          />
          <OutputMetric
            icon={Activity}
            label="Market Impact"
            value={outputs.marketImpact}
            unit=" USD"
            isLoading={isLoading && outputs.marketImpact === null}
          />
          <OutputMetric
            icon={DollarSign}
            label="Net Cost"
            value={outputs.netCost}
            unit=" USD"
            isLoading={isLoading && outputs.netCost === null}
          />
          <OutputMetric
            icon={ClipboardPlus}
            label="Maker Proportion"
            value={outputs.makerProportion}
            unit="%"
            isLoading={isLoading && outputs.makerProportion === null}
            isPercentage={true}
          />
          <OutputMetric
            icon={ClipboardMinus}
            label="Taker Proportion"
            value={outputs.takerProportion}
            unit="%"
            isLoading={isLoading && outputs.takerProportion === null}
            isPercentage={true}
          />
          <OutputMetric
            icon={Timer}
            label="Processing Latency"
            value={outputs.internalLatency}
            unit=" ms"
            isLoading={false} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
