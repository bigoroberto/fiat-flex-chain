import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Trading = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [searchQuery, assets]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    await fetchAssets();
  };

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("trading_assets")
        .select("*")
        .order("price_change_24h", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
      setFilteredAssets(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAssets = () => {
    if (!searchQuery) {
      setFilteredAssets(assets);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(query) ||
        asset.symbol.toLowerCase().includes(query)
    );
    setFilteredAssets(filtered);
  };

  const handleInvest = async () => {
    if (!investAmount || parseFloat(investAmount) <= 0) {
      toast.error("Inserisci un importo valido");
      return;
    }

    try {
      // Create a buy transaction
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        transaction_type: "buy",
        asset_to: selectedAsset.symbol,
        amount: parseFloat(investAmount),
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success(`Investimento di €${investAmount} in ${selectedAsset.name} completato!`);
      setSelectedAsset(null);
      setInvestAmount("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const recommendedAssets = filteredAssets.filter((a) => a.price_change_24h > 0);
  const otherAssets = filteredAssets.filter((a) => a.price_change_24h <= 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              {t("trading.title")}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder={t("trading.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Recommended (Positive Change) */}
        {recommendedAssets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              {t("trading.recommended")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-success/20"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{asset.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{asset.name}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                        {asset.asset_type}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          €{asset.current_price.toLocaleString('it-IT', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="flex items-center gap-1 text-success font-medium">
                          <TrendingUp className="w-4 h-4" />
                          +{asset.price_change_24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Assets (Negative/Zero Change) */}
        {otherAssets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 opacity-70">
              <TrendingDown className="w-5 h-5" />
              {t("trading.allAssets")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer opacity-70"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{asset.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{asset.name}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                        {asset.asset_type}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          €{asset.current_price.toLocaleString('it-IT', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="flex items-center gap-1 text-destructive font-medium">
                          <TrendingDown className="w-4 h-4" />
                          {asset.price_change_24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Invest Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("trading.invest")} in {selectedAsset?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Prezzo Attuale</p>
              <p className="text-2xl font-bold">
                €{selectedAsset?.current_price.toLocaleString('it-IT', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Importo da Investire (EUR)</label>
              <Input
                type="number"
                placeholder="100.00"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInvest} className="flex-1">
                Conferma Investimento
              </Button>
              <Button variant="outline" onClick={() => setSelectedAsset(null)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trading;
