import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Check, Crown, Sparkles, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Settings = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    await fetchData(session.user.id);
  };

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: plansData, error: plansError } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price", { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      const { data: subscriptionData } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      setCurrentSubscription(subscriptionData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) return;

    try {
      if (currentSubscription) {
        await supabase
          .from("user_subscriptions")
          .update({ status: "cancelled" })
          .eq("id", currentSubscription.id);
      }

      const { error } = await supabase.from("user_subscriptions").insert({
        user_id: user.id,
        plan_id: planId,
        status: "active",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;

      toast.success("Piano attivato con successo!");
      await fetchData(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("premium") || name.includes("pro")) {
      return <Crown className="w-6 h-6 text-yellow-500" />;
    } else if (name.includes("gold") || name.includes("plus")) {
      return <Sparkles className="w-6 h-6 text-amber-500" />;
    }
    return <Zap className="w-6 h-6 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              Impostazioni
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Piano Attivo</CardTitle>
            <CardDescription>
              {currentSubscription
                ? `Attualmente stai utilizzando il piano ${currentSubscription.subscription_plans.name}`
                : "Nessun piano attivo. Seleziona un piano per iniziare."}
            </CardDescription>
          </CardHeader>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-6">Scegli il Tuo Piano</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const features = typeof plan.features === 'string'
                ? JSON.parse(plan.features)
                : plan.features || [];
              const isActive = currentSubscription?.plan_id === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={`relative transition-all ${
                    isActive
                      ? "border-primary shadow-lg scale-105"
                      : "hover:shadow-md hover:scale-102"
                  }`}
                >
                  {isActive && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Piano Attivo
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      {getPlanIcon(plan.name)}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        €{plan.price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">/mese</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                      {plan.trading_fee_discount > 0 && (
                        <li className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                          <span className="text-sm">
                            {plan.trading_fee_discount}% sconto commissioni trading
                          </span>
                        </li>
                      )}
                      {plan.withdrawal_fee_discount > 0 && (
                        <li className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                          <span className="text-sm">
                            {plan.withdrawal_fee_discount}% sconto commissioni prelievo
                          </span>
                        </li>
                      )}
                      {plan.priority_support && (
                        <li className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                          <span className="text-sm">Supporto prioritario</span>
                        </li>
                      )}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isActive ? "outline" : "default"}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isActive}
                    >
                      {isActive ? "Piano Attivo" : "Seleziona Piano"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
