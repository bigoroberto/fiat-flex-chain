import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { LogOut, Users, Activity, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
  });

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Accesso negato: non sei un amministratore");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    await fetchAdminData();
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch all transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(50);

      setAllTransactions(transactionsData || []);

      // Fetch all users
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      setAllUsers(profilesData || []);

      // Calculate stats
      const totalVolume = (transactionsData || []).reduce(
        (sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount),
        0
      );

      setStats({
        totalUsers: profilesData?.length || 0,
        totalTransactions: transactionsData?.length || 0,
        totalVolume,
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {t("common.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transazioni</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Volume Totale</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{stats.totalVolume.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Tutte le Transazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Importo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.profiles?.full_name || "N/A"}</TableCell>
                      <TableCell className="capitalize">{transaction.transaction_type}</TableCell>
                      <TableCell>
                        {transaction.asset_from && `${transaction.asset_from} → `}
                        {transaction.asset_to}
                      </TableCell>
                      <TableCell>
                        {transaction.amount.toLocaleString('it-IT', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 8,
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === "completed"
                              ? "bg-success/10 text-success"
                              : transaction.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-600"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString('it-IT')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Utenti Registrati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>KYC Verificato</TableHead>
                    <TableHead>Telefono</TableHead>
                    <TableHead>Registrato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>{profile.full_name || "N/A"}</TableCell>
                      <TableCell>{profile.id}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            profile.kyc_verified
                              ? "bg-success/10 text-success"
                              : "bg-yellow-500/10 text-yellow-600"
                          }`}
                        >
                          {profile.kyc_verified ? "Verificato" : "In attesa"}
                        </span>
                      </TableCell>
                      <TableCell>{profile.phone || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(profile.created_at).toLocaleDateString('it-IT')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
