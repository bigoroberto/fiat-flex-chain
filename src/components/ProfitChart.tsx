import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ProfitChartProps {
  userId: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

const ProfitChart = ({ userId }: ProfitChartProps) => {
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [profitPercentage, setProfitPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfitData();
  }, [userId]);

  const fetchProfitData = async () => {
    setIsLoading(true);
    try {
      // Fetch user's wallets
      const { data: wallets, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId);

      if (walletsError) throw walletsError;

      // Fetch current prices
      const { data: assets, error: assetsError } = await supabase
        .from("trading_assets")
        .select("symbol, current_price");

      if (assetsError) throw assetsError;

      // Calculate portfolio value
      let totalValue = 0;
      const portfolioDistribution: any[] = [];

      wallets?.forEach(wallet => {
        const balance = parseFloat(wallet.balance.toString());
        if (balance > 0) {
          let value = balance;
          
          // For crypto/stocks, multiply by current price
          if (!['EUR', 'USD'].includes(wallet.asset_code)) {
            const asset = assets?.find(a => a.symbol === wallet.asset_code);
            if (asset) {
              value = balance * asset.current_price;
            }
          }

          totalValue += value;
          
          if (value > 0) {
            portfolioDistribution.push({
              name: wallet.asset_code,
              value: value,
            });
          }
        }
      });

      // Mock profit data (in realtà dovresti salvare il costo di acquisto)
      // Per ora assumiamo un profitto del 12% sul valore totale
      const initialInvestment = totalValue / 1.12;
      const profit = totalValue - initialInvestment;
      const profitPct = ((profit / initialInvestment) * 100);

      setTotalProfit(profit);
      setProfitPercentage(profitPct);
      setPortfolioData(portfolioDistribution);

    } catch (error) {
      console.error("Error fetching profit data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock historical data for line chart
  const historicalData = [
    { date: 'Gen', profit: totalProfit * 0.3 },
    { date: 'Feb', profit: totalProfit * 0.5 },
    { date: 'Mar', profit: totalProfit * 0.7 },
    { date: 'Apr', profit: totalProfit * 0.85 },
    { date: 'Mag', profit: totalProfit },
  ];

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Analisi Guadagni</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  const isPositive = profitPercentage >= 0;

  return (
    <div className="space-y-6">
      {/* Profit Summary */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Riepilogo Guadagni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-accent/5">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Profitto Totale</p>
                <p className="text-3xl font-bold">
                  €{totalProfit.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className={`flex items-center gap-2 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? (
                  <TrendingUp className="w-8 h-8" />
                ) : (
                  <TrendingDown className="w-8 h-8" />
                )}
                <span className="text-2xl font-bold">
                  {isPositive ? '+' : ''}{profitPercentage.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Historical Profit Chart */}
            <div className="h-64 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => [
                      `€${value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
                      'Profitto'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--success))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Distribution */}
      {portfolioData.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Distribuzione Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => [
                      `€${value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
                      'Valore'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfitChart;
