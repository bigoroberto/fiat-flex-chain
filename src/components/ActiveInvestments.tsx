import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import AssetDetail from "./AssetDetail";

interface Investment {
  asset_code: string;
  balance: number;
  current_price?: number;
  price_change_24h?: number;
}

interface ActiveInvestmentsProps {
  userId: string;
}

const ActiveInvestments = ({ userId }: ActiveInvestmentsProps) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Investment | null>(null);

  useEffect(() => {
    fetchInvestments();
  }, [userId]);

  const fetchInvestments = async () => {
    setIsLoading(true);
    try {
      // Fetch user's wallets
      const { data: wallets, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .not("asset_code", "in", '("EUR","USD")');

      if (walletsError) throw walletsError;

      // Fetch current prices from trading_assets
      const { data: assets, error: assetsError } = await supabase
        .from("trading_assets")
        .select("symbol, current_price, price_change_24h");

      if (assetsError) throw assetsError;

      // Merge wallet data with current prices
      const investmentsData = wallets
        ?.filter(w => parseFloat(w.balance.toString()) > 0)
        .map(wallet => {
          const asset = assets?.find(a => a.symbol === wallet.asset_code);
          return {
            asset_code: wallet.asset_code,
            balance: parseFloat(wallet.balance.toString()),
            current_price: asset?.current_price,
            price_change_24h: asset?.price_change_24h,
          };
        }) || [];

      setInvestments(investmentsData);
    } catch (error) {
      console.error("Error fetching investments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Investimenti Attivi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Investimenti Attivi</CardTitle>
      </CardHeader>
      <CardContent>
        {investments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nessun investimento attivo
          </p>
        ) : (
          <div className="space-y-3">
            {investments.map((investment) => {
              const value = investment.current_price 
                ? investment.balance * investment.current_price 
                : 0;
              const isPositive = (investment.price_change_24h || 0) > 0;

              return (
                <div
                  key={investment.asset_code}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedAsset(investment)}
                >
                  <div>
                    <p className="font-semibold text-lg">{investment.asset_code}</p>
                    <p className="text-sm text-muted-foreground">
                      {investment.balance.toLocaleString('it-IT', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      })} unità
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      €{value.toLocaleString('it-IT', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    {investment.price_change_24h !== undefined && (
                      <div className={`flex items-center gap-1 justify-end ${isPositive ? 'text-success' : 'text-destructive'}`}>
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {isPositive ? '+' : ''}{investment.price_change_24h.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      {selectedAsset && (
        <AssetDetail
          assetCode={selectedAsset.asset_code}
          balance={selectedAsset.balance}
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          userId={userId}
        />
      )}
    </Card>
  );
};

export default ActiveInvestments;
