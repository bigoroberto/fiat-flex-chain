import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ShoppingCart, LogOut, User } from "lucide-react";
import WalletCard from "@/components/WalletCard";
import TransactionList from "@/components/TransactionList";
import ActionModal from "@/components/ActionModal";
import Tutorial from "@/components/Tutorial";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<"deposit" | "withdraw" | "swap" | "buy">("deposit");

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
    } else {
      navigate("/auth");
    }
  };

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .order("asset_code");

      if (walletsError) throw walletsError;
      setWallets(walletsData || []);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error: any) {
      toast.error(error.message || "Errore nel caricamento dei dati");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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
        <p className="text-lg text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  const cryptoWallets = wallets.filter(w => ["BTC", "ETH", "USDT", "USDC"].includes(w.asset_code));
  const fiatWallets = wallets.filter(w => ["EUR", "USD"].includes(w.asset_code));
  const totalBalance = fiatWallets.reduce((sum, w) => sum + parseFloat(w.balance), 0);

  return (
    <div className="min-h-screen bg-background">
      <Tutorial onComplete={() => {}} />
      
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              CryptoBank
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Esci
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Balance Overview */}
        <div className="bg-gradient-primary rounded-2xl p-8 text-white shadow-lg-custom">
          <p className="text-sm opacity-80 mb-2">Saldo Totale</p>
          <h2 className="text-5xl font-bold mb-6">
            €{totalBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => openModal("deposit")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/20"
            >
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Deposita
            </Button>
            <Button
              onClick={() => openModal("withdraw")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/20"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Preleva
            </Button>
            <Button
              onClick={() => openModal("buy")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/20"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Acquista
            </Button>
            <Button
              onClick={() => openModal("swap")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/20"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Swap
            </Button>
          </div>
        </div>

        {/* Crypto Wallets */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Portafoglio Crypto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cryptoWallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                asset={wallet.asset_code}
                balance={parseFloat(wallet.balance)}
                symbol={wallet.asset_code}
                trend={Math.random() * 20 - 10}
              />
            ))}
          </div>
        </div>

        {/* Fiat Wallets */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Conti Fiat</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fiatWallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                asset={wallet.asset_code}
                balance={parseFloat(wallet.balance)}
                symbol={wallet.asset_code}
              />
            ))}
          </div>
        </div>

        {/* Transactions */}
        <TransactionList transactions={transactions} />
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
