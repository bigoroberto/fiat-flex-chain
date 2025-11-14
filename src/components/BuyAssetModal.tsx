import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertCircle, TrendingUp } from "lucide-react";

interface BuyAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: any;
  userWallets: any[];
  userId: string;
  onPurchaseComplete?: () => void;
}

export const BuyAssetModal = ({
  open,
  onOpenChange,
  asset,
  userWallets,
  userId,
  onPurchaseComplete,
}: BuyAssetModalProps) => {
  const [purchaseMode, setPurchaseMode] = useState<"units" | "amount">("units");
  const [units, setUnits] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableFunds, setAvailableFunds] = useState(0);

  useEffect(() => {
    if (open) {
      fetchAvailableFunds();
    }
  }, [open]);

  const fetchAvailableFunds = async () => {
    try {
      const eurWallet = userWallets.find(w => w.asset_code === "EUR");
      const usdWallet = userWallets.find(w => w.asset_code === "USD");

      const eur = parseFloat(eurWallet?.balance || 0);
      const usd = parseFloat(usdWallet?.balance || 0);

      setAvailableFunds(eur + usd);
    } catch (error) {
      console.error("Error fetching available funds:", error);
    }
  };

  const calculateFromUnits = (unitsValue: string) => {
    if (!unitsValue) return "";
    const u = parseFloat(unitsValue);
    if (isNaN(u)) return "";
    return (u * asset.current_price).toFixed(2);
  };

  const calculateFromAmount = (amountValue: string) => {
    if (!amountValue) return "";
    const a = parseFloat(amountValue);
    if (isNaN(a)) return "";
    return (a / asset.current_price).toFixed(8);
  };

  const handlePurchase = async () => {
    try {
      if (purchaseMode === "units" && !units) {
        toast.error("Inserisci il numero di unità");
        return;
      }
      if (purchaseMode === "amount" && !amount) {
        toast.error("Inserisci l'importo in EUR");
        return;
      }

      const finalUnits = purchaseMode === "units"
        ? parseFloat(units)
        : parseFloat(amount) / asset.current_price;

      const finalAmount = parseFloat(amount) || parseFloat(units) * asset.current_price;

      // Check if user has enough funds
      if (finalAmount > availableFunds) {
        toast.error(`Fondi insufficienti. Disponibili: €${availableFunds.toFixed(2)}`);
        return;
      }

      setIsProcessing(true);

      // 1. Debit from EUR/USD wallet
      const eurWallet = userWallets.find(w => w.asset_code === "EUR");
      if (eurWallet) {
        const newBalance = parseFloat(eurWallet.balance) - finalAmount;
        await supabase
          .from("wallets")
          .update({ balance: newBalance })
          .eq("id", eurWallet.id);
      }

      // 2. Credit to asset wallet
      const assetWallet = userWallets.find(w => w.asset_code === asset.symbol);
      if (assetWallet) {
        const newBalance = parseFloat(assetWallet.balance) + finalUnits;
        await supabase
          .from("wallets")
          .update({ balance: newBalance })
          .eq("id", assetWallet.id);
      } else {
        // Create new wallet if doesn't exist
        await supabase
          .from("wallets")
          .insert({
            user_id: userId,
            asset_code: asset.symbol,
            balance: finalUnits,
          });
      }

      // 3. Create transaction record
      await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          transaction_type: "buy",
          asset_from: "EUR",
          asset_to: asset.symbol,
          amount: finalUnits,
          fee: 0,
          status: "completed",
        });

      toast.success(`Acquisto completato! ${finalUnits.toFixed(8)} ${asset.symbol} acquistati`);
      setUnits("");
      setAmount("");
      onOpenChange(false);
      onPurchaseComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'acquisto");
      console.error("Purchase error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Acquista {asset.name}
          </DialogTitle>
          <DialogDescription>
            Prezzo corrente: €{asset.current_price?.toFixed(2) || "N/A"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Fondi disponibili: €{availableFunds.toFixed(2)}
            </AlertDescription>
          </Alert>

          <Tabs value={purchaseMode} onValueChange={(val) => setPurchaseMode(val as "units" | "amount")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="units">Per Unità</TabsTrigger>
              <TabsTrigger value="amount">Per Importo</TabsTrigger>
            </TabsList>

            <TabsContent value="units" className="space-y-4">
              <div>
                <Label>Numero di {asset.symbol}*</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="Es. 1.5"
                  value={units}
                  onChange={(e) => {
                    setUnits(e.target.value);
                    setAmount(calculateFromUnits(e.target.value));
                  }}
                />
              </div>
              <div>
                <Label>Importo EUR</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Auto-calcolato"
                  value={amount}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Riepiloga aquisto:</p>
                <p className="text-lg font-semibold">
                  {units ? `${parseFloat(units).toFixed(8)} ${asset.symbol}` : "-"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {amount ? `€${parseFloat(amount).toFixed(2)}` : "-"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="amount" className="space-y-4">
              <div>
                <Label>Importo EUR*</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Es. 100"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setUnits(calculateFromAmount(e.target.value));
                  }}
                />
              </div>
              <div>
                <Label>Numero di {asset.symbol}</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="Auto-calcolato"
                  value={units}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Riepilogo acquisto:</p>
                <p className="text-lg font-semibold">
                  {amount ? `€${parseFloat(amount).toFixed(2)}` : "-"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {units ? `${parseFloat(units).toFixed(8)} ${asset.symbol}` : "-"}
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {amount && parseFloat(amount) > availableFunds && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Fondi insufficienti. Deposita almeno €{(parseFloat(amount) - availableFunds).toFixed(2)} in più.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={isProcessing || !units || !amount || parseFloat(amount) > availableFunds}
          >
            {isProcessing ? "Elaborazione..." : `Acquista ${parseFloat(amount).toFixed(2) ? `€${parseFloat(amount).toFixed(2)}` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
