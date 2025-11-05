import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Coins, DollarSign } from "lucide-react";

interface PortfolioSummaryProps {
  userId: string;
}

export const PortfolioSummary = ({ userId }: PortfolioSummaryProps) => {
  const [liquidCash, setLiquidCash] = useState(0);
  const [cryptoValue, setCryptoValue] = useState(0);
  const [stocksValue, setStocksValue] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchPortfolioData();

      // Set up realtime subscription
      const channel = supabase
        .channel('portfolio-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${userId}`
          },
          () => {
            fetchPortfolioData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      const { data: wallets } = await supabase
        .from("wallets")
        .select("asset_code, balance")
        .eq("user_id", userId);

      if (!wallets) return;

      // Calcola contanti liquidi (EUR, USD)
      const cash = wallets
        .filter((w) => ["EUR", "USD"].includes(w.asset_code))
        .reduce((sum, w) => sum + Number(w.balance), 0);

      // Calcola valore crypto
      const crypto = wallets
        .filter((w) => ["BTC", "ETH", "USDT", "USDC", "BNB", "XRP", "ADA", "SOL", "DOT", "DOGE", "LTC"].includes(w.asset_code))
        .reduce((sum, w) => sum + Number(w.balance), 0);

      // Calcola valore azioni (tutti gli altri asset)
      const stocks = wallets
        .filter((w) => !["EUR", "USD", "BTC", "ETH", "USDT", "USDC", "BNB", "XRP", "ADA", "SOL", "DOT", "DOGE", "LTC"].includes(w.asset_code))
        .reduce((sum, w) => sum + Number(w.balance), 0);

      setLiquidCash(cash);
      setCryptoValue(crypto);
      setStocksValue(stocks);
      setTotalValue(cash + crypto + stocks);
    } catch (error) {
      console.error("Error fetching portfolio data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Caricamento portfolio...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            Valore Totale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Patrimonio complessivo</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-600" />
            Liquidità
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(liquidCash)}</p>
          <p className="text-xs text-muted-foreground mt-1">Denaro disponibile (EUR, USD)</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Coins className="w-4 h-4 text-orange-600" />
            Criptovalute
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(cryptoValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">BTC, ETH, e altre crypto</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Azioni & Asset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(stocksValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Investimenti in azioni</p>
        </CardContent>
      </Card>
    </div>
  );
};
