import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const transactionData: any = {
        user_id: userId,
        transaction_type: action,
        asset_to: action === "swap" ? selectedAssetTo : selectedAsset,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {action === "swap" ? (
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
            </>
          ) : (
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
          )}
          
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
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Elaborazione..." : "Conferma"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActionModal;
