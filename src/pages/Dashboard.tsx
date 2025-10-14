import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  ShoppingCart, 
  LogOut, 
  User, 
  TrendingUp,
  CreditCard,
  Settings,
  Shield,
  Globe
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Tutorial from "@/components/Tutorial";
import ActionModal from "@/components/ActionModal";
import PortfolioHistory from "@/components/PortfolioHistory";
import ActiveInvestments from "@/components/ActiveInvestments";
import ProfitChart from "@/components/ProfitChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLivePrices } from "@/hooks/useLivePrices";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<"deposit" | "withdraw" | "swap" | "buy">("deposit");
  
  // Initialize live price updates
  useLivePrices();

  useEffect(() => {
    checkAuth();
    setupAuthListener();
  }, []);

  const setupAuthListener = () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchData(session.user.id);
      } else {
        setUser(null);
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await fetchData(session.user.id);
      await checkAdminRole(session.user.id);
    } else {
      navigate("/");
    }
  };

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();
    
    setIsAdmin(!!data);
  };

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: walletsData, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .order("asset_code");

      if (walletsError) throw walletsError;
      setWallets(walletsData || []);
    } catch (error: any) {
      toast.error(error.message || "Errore nel caricamento dei dati");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const openModal = (action: "deposit" | "withdraw" | "swap" | "buy") => {
    setCurrentAction(action);
    setModalOpen(true);
  };

  const handleActionSuccess = () => {
    if (user) {
      fetchData(user.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const totalBalance = wallets
    .filter(w => ["EUR", "USD"].includes(w.asset_code))
    .reduce((sum, w) => sum + parseFloat(w.balance), 0);

  return (
    <div className="min-h-screen bg-background">
      <Tutorial onComplete={() => {}} />
      
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate("/dashboard")}
              className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer border-none bg-transparent"
            >
              {t("app.title")}
            </button>
            <div className="flex items-center gap-4">
              <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                <SelectTrigger className="w-32">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {t("common.logout")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Balance Card */}
        <div className="bg-gradient-primary rounded-2xl p-8 text-white shadow-lg-custom">
          <p className="text-sm opacity-80 mb-2">{t("dashboard.totalBalance")}</p>
          <h2 className="text-5xl font-bold mb-2">
            €{totalBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Main Menu - Revolut Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/trading")}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
              <div className="p-4 rounded-full bg-primary/10">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <span className="font-semibold">{t("nav.trading")}</span>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/profile")}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
              <div className="p-4 rounded-full bg-primary/10">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <span className="font-semibold">{t("nav.profile")}</span>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/profile")}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
              <div className="p-4 rounded-full bg-primary/10">
                <Settings className="w-8 h-8 text-primary" />
              </div>
              <span className="font-semibold">Impostazioni</span>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-primary"
              onClick={() => navigate("/admin")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                <div className="p-4 rounded-full bg-primary/10">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <span className="font-semibold">{t("nav.admin")}</span>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Azioni Rapide</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => openModal("deposit")}
              >
                <ArrowDownLeft className="w-5 h-5" />
                <span className="text-sm">{t("dashboard.deposit")}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => openModal("withdraw")}
              >
                <ArrowUpRight className="w-5 h-5" />
                <span className="text-sm">{t("dashboard.withdraw")}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => openModal("buy")}
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm">{t("dashboard.buy")}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => openModal("swap")}
              >
                <ArrowLeftRight className="w-5 h-5" />
                <span className="text-sm">{t("dashboard.swap")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Tabs */}
        <Tabs defaultValue="investments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="investments">Investimenti Attivi</TabsTrigger>
            <TabsTrigger value="history">Storico</TabsTrigger>
            <TabsTrigger value="profit">Guadagni</TabsTrigger>
          </TabsList>
          
          <TabsContent value="investments" className="mt-6">
            <ActiveInvestments userId={user?.id || ""} />
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <PortfolioHistory userId={user?.id || ""} />
          </TabsContent>
          
          <TabsContent value="profit" className="mt-6">
            <ProfitChart userId={user?.id || ""} />
          </TabsContent>
        </Tabs>
      </main>

      <ActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        action={currentAction}
        wallets={wallets}
        userId={user?.id || ""}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
};

export default Dashboard;
