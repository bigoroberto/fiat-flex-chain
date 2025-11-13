import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, TrendingUp, Percent } from "lucide-react";

interface AccountLevelDisplayProps {
  userId: string;
}

export const AccountLevelDisplay = ({ userId }: AccountLevelDisplayProps) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAccountLevel();
  }, [userId]);

  const fetchAccountLevel = async () => {
    setIsLoading(true);
    try {
      const { data: subData } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      setSubscription(subData);

      if (subData?.subscription_plans) {
        const plan = subData.subscription_plans;
        const activeBonuses = [];

        if (plan.trading_fee_discount > 0) {
          activeBonuses.push({
            name: "Sconto Commissioni Trading",
            value: `${plan.trading_fee_discount}%`,
            icon: Percent,
          });
        }

        if (plan.withdrawal_fee_discount > 0) {
          activeBonuses.push({
            name: "Sconto Commissioni Prelievo",
            value: `${plan.withdrawal_fee_discount}%`,
            icon: TrendingUp,
          });
        }

        if (plan.priority_support) {
          activeBonuses.push({
            name: "Supporto Prioritario",
            value: "24/7",
            icon: Zap,
          });
        }

        const features = typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features || [];
        activeBonuses.push({
          name: "Vantaggi Piano",
          value: `${features.length} inclusi`,
          icon: Crown,
        });

        setBonuses(activeBonuses);
      }
    } catch (error) {
      console.error("Error fetching account level:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanColor = (planName: string) => {
    const lower = planName.toLowerCase();
    if (lower.includes("deluxe")) return "from-purple-600 to-pink-600";
    if (lower.includes("ultra")) return "from-blue-600 to-cyan-600";
    if (lower.includes("premium")) return "from-amber-500 to-orange-500";
    return "from-slate-500 to-slate-600";
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Caricamento...</div>;
  }

  if (!subscription) {
    return null;
  }

  const plan = subscription.subscription_plans;

  return (
    <Card className={`bg-gradient-to-br ${getPlanColor(plan.name)} text-white border-0`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Livello Account</CardTitle>
            <p className="text-sm text-white/80 mt-1">Piano attivo</p>
          </div>
          <Crown className="w-8 h-8 opacity-90" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            {plan.price > 0 && (
              <p className="text-white/90">€{plan.price}/mese</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-white/90">Bonus Attivi:</p>
            <div className="space-y-2">
              {bonuses.map((bonus, idx) => {
                const IconComponent = bonus.icon;
                return (
                  <div key={idx} className="flex items-center justify-between bg-white/10 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm">{bonus.name}</span>
                    </div>
                    <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                      {bonus.value}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
