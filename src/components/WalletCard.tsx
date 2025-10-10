import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface WalletCardProps {
  asset: string;
  balance: number;
  trend?: number;
  symbol: string;
}

const assetIcons: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  USDT: "$",
  USDC: "$",
  EUR: "€",
  USD: "$",
};

const WalletCard = ({ asset, balance, trend, symbol }: WalletCardProps) => {
  const isPositive = (trend ?? 0) >= 0;
  
  return (
    <Card className="shadow-card hover:shadow-lg-custom transition-all duration-300 hover:scale-105">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center text-2xl font-bold text-white">
              {assetIcons[asset] || asset[0]}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{asset}</p>
              <p className="text-lg font-semibold">{symbol}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-bold">
            {balance.toLocaleString('it-IT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: asset === 'BTC' ? 8 : 2,
            })}
          </p>
          
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend).toFixed(2)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletCard;
