import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLivePricesAPI } from "@/hooks/useLivePricesAPI";
import { TrendingUp, TrendingDown, Banknote, Coins, TrendingUpIcon } from "lucide-react";

interface PortfolioCategory {
  name: string;
  icon: any;
  color: string;
  assets: any[];
  totalValue: number;
  percentageChange: number;
}

interface OrganizedPortfolioProps {
  userId: string;
}

export const OrganizedPortfolio = ({ userId }: OrganizedPortfolioProps) => {
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allSymbols, setAllSymbols] = useState<string[]>([]);

  const { prices } = useLivePricesAPI(allSymbols);

  useEffect(() => {
    fetchPortfolio();
  }, [userId]);

  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      updateCategoriesWithPrices();
    }
  }, [prices]);

  const fetchPortfolio = async () => {
    setIsLoading(true);
    try {
      const { data: wallets, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      // Collect all symbols for price fetching
      const symbols = wallets?.map(w => w.asset_code) || [];
      setAllSymbols(symbols);

      // Organize wallets into categories
      const fiatAssets = wallets?.filter(w => ["EUR", "USD", "GBP", "JPY"].includes(w.asset_code)) || [];
      const cryptoAssets = wallets?.filter(w => !["EUR", "USD", "GBP", "JPY"].includes(w.asset_code) && w.asset_code.length <= 5) || [];
      const stockAssets = wallets?.filter(w => !["EUR", "USD", "GBP", "JPY"].includes(w.asset_code) && w.asset_code.length > 5) || [];

      const categorized: PortfolioCategory[] = [
        {
          name: "Liquidità",
          icon: Banknote,
          color: "from-green-500 to-emerald-600",
          assets: fiatAssets,
          totalValue: calculateCategoryValue(fiatAssets, prices),
          percentageChange: 0,
        },
        {
          name: "Criptovalute",
          icon: Coins,
          color: "from-blue-500 to-cyan-600",
          assets: cryptoAssets,
          totalValue: calculateCategoryValue(cryptoAssets, prices),
          percentageChange: calculateCategoryChange(cryptoAssets, prices),
        },
        {
          name: "Azioni",
          icon: TrendingUpIcon,
          color: "from-purple-500 to-pink-600",
          assets: stockAssets,
          totalValue: calculateCategoryValue(stockAssets, prices),
          percentageChange: calculateCategoryChange(stockAssets, prices),
        },
      ];

      setCategories(categorized);
      const total = categorized.reduce((sum, cat) => sum + cat.totalValue, 0);
      setTotalPortfolioValue(total);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCategoryValue = (assets: any[], prices: any): number => {
    return assets.reduce((sum, asset) => {
      const price = prices[asset.asset_code]?.price || 0;
      const balance = parseFloat(asset.balance) || 0;
      return sum + balance * price;
    }, 0);
  };

  const calculateCategoryChange = (assets: any[], prices: any): number => {
    if (assets.length === 0) return 0;
    const totalChange = assets.reduce((sum, asset) => {
      const change = prices[asset.asset_code]?.change24h || 0;
      const balance = parseFloat(asset.balance) || 0;
      const price = prices[asset.asset_code]?.price || 1;
      return sum + (balance * price * change) / 100;
    }, 0);
    return totalChange / calculateCategoryValue(assets, prices);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Caricamento portfolio...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Total Portfolio Value */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-white/70">Valore Totale Portfolio</p>
              <h2 className="text-4xl font-bold mt-2">€{totalPortfolioValue.toLocaleString("it-IT", { maximumFractionDigits: 2 })}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70">Distribuzione</p>
              <p className="text-lg font-semibold">3 Categorie</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          const isPositive = category.percentageChange >= 0;

          return (
            <Card key={category.name} className={`bg-gradient-to-br ${category.color} text-white border-0`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{category.name}</CardTitle>
                    <CardDescription className="text-white/70">
                      {category.assets.length} asset{category.assets.length !== 1 ? "i" : ""}
                    </CardDescription>
                  </div>
                  <Icon className="w-8 h-8 opacity-80" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">€{category.totalValue.toLocaleString("it-IT", { maximumFractionDigits: 2 })}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-300" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-300" />
                    )}
                    <span className={isPositive ? "text-green-300" : "text-red-300"}>
                      {isPositive ? "+" : ""}{category.percentageChange.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Asset List */}
                {category.assets.length > 0 && (
                  <div className="space-y-2 mt-4 border-t border-white/20 pt-4">
                    {category.assets.slice(0, 3).map((asset) => {
                      const price = prices[asset.asset_code]?.price || 0;
                      const balance = parseFloat(asset.balance) || 0;
                      const value = balance * price;

                      return (
                        <div key={asset.id} className="flex justify-between items-center text-sm">
                          <div>
                            <p className="font-medium">{asset.asset_code}</p>
                            <p className="text-white/70">{balance.toFixed(8)}</p>
                          </div>
                          <p className="font-semibold">€{value.toLocaleString("it-IT", { maximumFractionDigits: 2 })}</p>
                        </div>
                      );
                    })}
                    {category.assets.length > 3 && (
                      <p className="text-xs text-white/60 text-center mt-2">
                        +{category.assets.length - 3} altro{category.assets.length - 3 > 1 ? "i" : ""}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
