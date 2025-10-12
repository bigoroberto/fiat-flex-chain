import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: "deposit" | "withdraw" | "swap" | "buy";
  wallets: Array<{ asset_code: string; balance: number }>;
  userId: string;
  onSuccess: () => void;
}

const ActionModal = ({ isOpen, onClose, action, wallets, userId, onSuccess }: ActionModalProps) => {
  const [amount, setAmount] = useState("");
  const [selectedAsset, setSelectedAsset] = useState("");
  const [selectedAssetTo, setSelectedAssetTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tradingAssets, setTradingAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTradingAsset, setSelectedTradingAsset] = useState<any>(null);

  useEffect(() => {
    if (action === "buy" && isOpen) {
      fetchTradingAssets();
    }
  }, [action, isOpen]);

  const fetchTradingAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("trading_assets")
        .select("*")
        .order("price_change_24h", { ascending: false });

      if (error) throw error;
      setTradingAssets(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredTradingAssets = tradingAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const transactionData: any = {
        user_id: userId,
        transaction_type: action,
        asset_to: action === "swap" ? selectedAssetTo : (action === "buy" ? selectedTradingAsset?.symbol : selectedAsset),
        amount: parseFloat(amount),
        status: "pending",
      };

      if (action === "swap") {
        transactionData.asset_from = selectedAsset;
      }

      const { error } = await supabase
        .from("transactions")
        .insert(transactionData);

      if (error) throw error;

      // Simulate transaction completion after 2 seconds
      setTimeout(async () => {
        const { error: updateError } = await supabase
          .from("transactions")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("status", "pending");

        if (!updateError) {
          toast.success("Operazione completata con successo!");
          onSuccess();
        }
      }, 2000);

      toast.success("Operazione in corso...");
      onClose();
      setAmount("");
      setSelectedAsset("");
      setSelectedAssetTo("");
      setSelectedTradingAsset(null);
      setSearchQuery("");
    } catch (error: any) {
      toast.error(error.message || "Operazione fallita");
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (action) {
      case "deposit": return "Deposita Fondi";
      case "withdraw": return "Preleva Fondi";
      case "swap": return "Scambia Valute";
      case "buy": return "Acquista Crypto";
    }
  };

  const getDescription = () => {
    switch (action) {
      case "deposit": return "Aggiungi fondi al tuo wallet";
      case "withdraw": return "Trasferisci fondi verso un wallet esterno";
      case "swap": return "Scambia tra criptovalute e valute fiat";
      case "buy": return "Acquista criptovalute con carta o bonifico";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {action === "buy" ? (
            <>
              {/* Search Bar for Trading Assets */}
              <div className="space-y-2">
                <Label>Cerca Asset</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Cerca per nome o simbolo (es. Apple, Nike, Bitcoin)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Trading Assets Grid */}
              {!selectedTradingAsset ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <p className="text-sm text-muted-foreground">Seleziona un asset da acquistare:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredTradingAssets.map((asset) => (
                      <Card
                        key={asset.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedTradingAsset(asset)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold">{asset.symbol}</h4>
                              <p className="text-xs text-muted-foreground">{asset.name}</p>
                            </div>
                            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                              {asset.asset_type}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">
                              €{asset.current_price.toLocaleString('it-IT', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <span
                              className={`flex items-center gap-1 text-sm font-medium ${
                                asset.price_change_24h > 0 ? "text-success" : "text-destructive"
                              }`}
                            >
                              {asset.price_change_24h > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {asset.price_change_24h > 0 ? "+" : ""}
                              {asset.price_change_24h.toFixed(2)}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {filteredTradingAssets.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nessun asset trovato
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Selected Asset Details */}
                  <Card className="bg-accent/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-lg">{selectedTradingAsset.symbol}</h4>
                          <p className="text-sm text-muted-foreground">{selectedTradingAsset.name}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTradingAsset(null)}
                        >
                          Cambia
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          €{selectedTradingAsset.current_price.toLocaleString('it-IT', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            selectedTradingAsset.price_change_24h > 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          {selectedTradingAsset.price_change_24h > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {selectedTradingAsset.price_change_24h > 0 ? "+" : ""}
                          {selectedTradingAsset.price_change_24h.toFixed(2)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label>Importo da Investire (EUR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="100.00"
                      required
                    />
                    {amount && selectedTradingAsset && (
                      <p className="text-sm text-muted-foreground">
                        Riceverai circa{" "}
                        <span className="font-semibold">
                          {(parseFloat(amount) / selectedTradingAsset.current_price).toFixed(8)}
                        </span>{" "}
                        {selectedTradingAsset.symbol}
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          ) : action === "swap" ? (
            <>
              <div className="space-y-2">
                <Label>Da</Label>
                <Select value={selectedAsset} onValueChange={setSelectedAsset} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona valuta" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.asset_code} value={wallet.asset_code}>
                        {wallet.asset_code} (Disponibile: {wallet.balance.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>A</Label>
                <Select value={selectedAssetTo} onValueChange={setSelectedAssetTo} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona valuta" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.filter(w => w.asset_code !== selectedAsset).map((wallet) => (
                      <SelectItem key={wallet.asset_code} value={wallet.asset_code}>
                        {wallet.asset_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Importo</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Valuta</Label>
                <Select value={selectedAsset} onValueChange={setSelectedAsset} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona valuta" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.asset_code} value={wallet.asset_code}>
                        {wallet.asset_code}
                        {action === "withdraw" && ` (Disponibile: ${wallet.balance.toFixed(2)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Importo</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (action === "buy" && !selectedTradingAsset)}
            >
              {isLoading ? "Elaborazione..." : "Conferma"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActionModal;
