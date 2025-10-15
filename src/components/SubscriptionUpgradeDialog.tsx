import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: any;
  trading_fee_discount: number;
  withdrawal_fee_discount: number;
  priority_support: boolean;
}

interface SubscriptionUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredPlan: string;
  onUpgradeComplete?: () => void;
}

export const SubscriptionUpgradeDialog = ({
  open,
  onOpenChange,
  requiredPlan,
  onUpgradeComplete,
}: SubscriptionUpgradeDialogProps) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPlans();
      fetchCurrentPlan();
    }
  }, [open]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast.error("Errore nel caricamento dei piani");
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("subscription_plans(name)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (error) throw error;
      setCurrentPlan((data as any)?.subscription_plans?.name || "Standard");
    } catch (error: any) {
      console.error("Error fetching current plan:", error);
    }
  };

  const handleUpgrade = async (planId: string, planName: string) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Devi effettuare il login");
        return;
      }

      // In a real application, this would integrate with a payment provider
      // For now, we'll simulate the upgrade
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          plan_id: planId,
          status: "active",
          start_date: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(`Piano ${planName} attivato con successo!`);
      onOpenChange(false);
      if (onUpgradeComplete) {
        onUpgradeComplete();
      }
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'upgrade");
    } finally {
      setIsLoading(false);
    }
  };

  const targetPlan = plans.find(p => p.name === requiredPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Upgrade Richiesto
          </DialogTitle>
          <DialogDescription>
            Questa funzionalità richiede il piano <strong>{requiredPlan}</strong> o superiore.
            Il tuo piano attuale è: <strong>{currentPlan}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === currentPlan;
            const isTargetPlan = plan.name === requiredPlan;
            const features = plan.features || {};

            return (
              <Card
                key={plan.id}
                className={`p-6 relative ${
                  isTargetPlan
                    ? "border-primary border-2 shadow-lg"
                    : "border-border"
                }`}
              >
                {isTargetPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    Consigliato
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-xl">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold">€{plan.price}</span>
                      <span className="text-muted-foreground">/mese</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span>Sconto commissioni: {plan.trading_fee_discount}%</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span>Sconto prelievi: {plan.withdrawal_fee_discount}%</span>
                    </div>
                    {features.advanced_charts && (
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Grafici avanzati</span>
                      </div>
                    )}
                    {features.api_access && (
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Accesso API</span>
                      </div>
                    )}
                    {plan.priority_support && (
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Supporto prioritario</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    variant={isTargetPlan ? "default" : "outline"}
                    disabled={isCurrentPlan || isLoading}
                    onClick={() => handleUpgrade(plan.id, plan.name)}
                  >
                    {isCurrentPlan ? "Piano Attuale" : `Passa a ${plan.name}`}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Tutti i piani includono sicurezza avanzata e crittografia end-to-end
        </p>
      </DialogContent>
    </Dialog>
  );
};
