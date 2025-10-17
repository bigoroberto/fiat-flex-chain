import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3 } from "lucide-react";

interface AssetDetailProps {
  assetCode: string;
  balance: number;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const AssetDetail = ({ assetCode, balance, isOpen, onClose, userId }: AssetDetailProps) => {
  const [assetData, setAssetData] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && assetCode) {
      fetchAssetDetails();
    }
  }, [isOpen, assetCode]);

  const fetchAssetDetails = async () => {
    setIsLoading(true);
    try {
      const { data: asset } = await supabase
        .from("trading_assets")
        .select("*")
        .eq("symbol", assetCode)
        .maybeSingle();

      setAssetData(asset);

      const { data: history } = await supabase
        .from("asset_price_history")
        .select("*")
        .eq("symbol", assetCode)
        .order("timestamp", { ascending: false })
        .limit(30);

      if (history && history.length > 0) {
        const formattedHistory = history.reverse().map((item) => ({
          date: new Date(item.timestamp).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "short",
          }),
          price: parseFloat(item.price.toString()),
        }));
        setPriceHistory(formattedHistory);
      } else {
        const mockHistory = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "short",
          }),
          price: asset?.current_price * (1 + (Math.random() - 0.5) * 0.2) || 0,
        }));
        setPriceHistory(mockHistory);
      }

      const { data: userTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .or(`asset_to.eq.${assetCode},asset_from.eq.${assetCode}`)
        .order("created_at", { ascending: false });

      setTransactions(userTransactions || []);
    } catch (error) {
      console.error("Error fetching asset details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !assetData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <p className="text-center py-8">Caricamento...</p>
        </DialogContent>
      </Dialog>
    );
  }

  const currentValue = balance * assetData.current_price;
  const totalInvested = transactions
    .filter((t) => t.transaction_type === "buy" && t.asset_to === assetCode)
    .reduce((sum, t) => sum + t.amount * assetData.current_price, 0);

  const profitLoss = currentValue - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  const isProfit = profitLoss >= 0;

  const lowestPrice = Math.min(...priceHistory.map((h) => h.price));
  const highestPrice = Math.max(...priceHistory.map((h) => h.price));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {assetData.name} ({assetCode})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                <span>Prezzo Attuale</span>
              </div>
              <p className="text-2xl font-bold">
                €{assetData.current_price.toLocaleString("it-IT", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Calendar className="w-4 h-4" />
                <span>Variazione 24h</span>
              </div>
              <p className={`text-2xl font-bold ${isProfit ? "text-success" : "text-destructive"}`}>
                {assetData.price_change_24h >= 0 ? "+" : ""}
                {assetData.price_change_24h.toFixed(2)}%
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <BarChart3 className="w-4 h-4" />
                <span>Posseduto</span>
              </div>
              <p className="text-2xl font-bold">
                {balance.toLocaleString("it-IT", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8,
                })}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                {isProfit ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                <span>Valore Totale</span>
              </div>
              <p className="text-2xl font-bold">
                €{currentValue.toLocaleString("it-IT", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Investito</p>
              <p className="text-xl font-semibold">
                €{totalInvested.toLocaleString("it-IT", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                {isProfit ? "Guadagno" : "Perdita"}
              </p>
              <p className={`text-xl font-semibold ${isProfit ? "text-success" : "text-destructive"}`}>
                {isProfit ? "+" : ""}
                €{profitLoss.toLocaleString("it-IT", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Percentuale</p>
              <p className={`text-xl font-semibold ${isProfit ? "text-success" : "text-destructive"}`}>
                {isProfit ? "+" : ""}
                {profitLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Storico Prezzi (30 Giorni)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickLine={{ stroke: "hsl(var(--muted))" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickLine={{ stroke: "hsl(var(--muted))" }}
                    tickFormatter={(value) => `€${value.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [`€${parseFloat(value).toFixed(2)}`, "Prezzo"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isProfit ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Minimo (30g)</p>
              <p className="text-lg font-semibold">
                €{lowestPrice.toFixed(2)}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Massimo (30g)</p>
              <p className="text-lg font-semibold">
                €{highestPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {assetData.market_cap && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Capitalizzazione</p>
                <p className="text-lg font-semibold">
                  €{(assetData.market_cap / 1000000).toFixed(2)}M
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Volume 24h</p>
                <p className="text-lg font-semibold">
                  €{assetData.volume_24h ? (assetData.volume_24h / 1000000).toFixed(2) + "M" : "N/A"}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssetDetail;
