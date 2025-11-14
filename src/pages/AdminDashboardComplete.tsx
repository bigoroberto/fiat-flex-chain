import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  LogOut,
  Users,
  Activity,
  TrendingUp,
  Shield,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wallet,
} from "lucide-react";

interface UserData {
  id: string;
  full_name: string;
  kyc_status: string;
  kyc_verified: boolean;
  created_at: string;
}

interface Subscription {
  plan_id: string;
  subscription_plans: {
    name: string;
    price: number;
  };
}

const AdminDashboardComplete = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    totalRevenue: 0,
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showKYCDialog, setShowKYCDialog] = useState(false);
  const [kycAction, setKycAction] = useState<"approve" | "reject">("approve");
  const [kycReason, setKycReason] = useState("");
  const [withdrawalAccounts, setWithdrawalAccounts] = useState<any[]>([]);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    accountType: "stripe",
    accountIdentifier: "",
    accountHolderName: "",
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
    await fetchAdminData(session.user.id);
  };

  const fetchAdminData = async (adminId: string) => {
    setIsLoading(true);
    try {
      // Fetch all users with subscriptions
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*, user_subscriptions(subscription_plans(name, price))")
        .order("created_at", { ascending: false });

      setAllUsers(usersData || []);

      // Fetch stats
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("status", "completed");

      const { data: revenueData } = await supabase
        .from("transactions")
        .select("amount")
        .like("asset_to", "PLAN_%");

      const totalVolume = (transactionsData || []).reduce(
        (sum, t) => sum + parseFloat(t.amount || 0),
        0
      );

      const totalRevenue = (revenueData || []).reduce(
        (sum, t) => sum + parseFloat(t.amount || 0),
        0
      );

      setStats({
        totalUsers: usersData?.length || 0,
        totalTransactions: transactionsData?.length || 0,
        totalVolume,
        totalRevenue,
      });

      // Fetch withdrawal accounts
      const { data: withdrawalData } = await supabase
        .from("admin_withdrawal_accounts")
        .select("*")
        .eq("admin_id", adminId);

      setWithdrawalAccounts(withdrawalData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = async (userData: UserData) => {
    setSelectedUser(userData);

    try {
      // Fetch detailed user data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.id)
        .single();

      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: subscriptionData } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", userData.id);

      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userData.id);

      setUserDetails({
        profile: profileData,
        transactions: transactionsData,
        subscriptions: subscriptionData,
        wallets: walletData,
      });
      setShowUserDetail(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleKYCReview = async () => {
    if (!selectedUser) return;

    try {
      // Update profile KYC status
      await supabase
        .from("profiles")
        .update({
          kyc_verified: kycAction === "approve",
          kyc_status: kycAction === "approve" ? "verified" : "rejected",
        })
        .eq("id", selectedUser.id);

      // Record KYC review
      await supabase
        .from("kyc_reviews")
        .insert({
          user_id: selectedUser.id,
          reviewed_by: user.id,
          status: kycAction,
          reason: kycReason,
        });

      toast.success(`KYC ${kycAction === "approve" ? "approvato" : "rifiutato"}`);
      setShowKYCDialog(false);
      setKycReason("");
      await fetchAdminData(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddWithdrawalAccount = async () => {
    if (!withdrawalForm.accountIdentifier) {
      toast.error("Identificativo account obbligatorio");
      return;
    }

    try {
      await supabase
        .from("admin_withdrawal_accounts")
        .insert({
          admin_id: user.id,
          account_type: withdrawalForm.accountType,
          account_identifier: withdrawalForm.accountIdentifier,
          account_holder_name: withdrawalForm.accountHolderName,
        });

      toast.success("Account di prelievo aggiunto");
      setShowWithdrawalDialog(false);
      setWithdrawalForm({
        accountType: "stripe",
        accountIdentifier: "",
        accountHolderName: "",
      });
      await fetchAdminData(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getPlanColor = (planName: string) => {
    const lower = planName.toLowerCase();
    if (lower.includes("deluxe")) return "text-purple-600";
    if (lower.includes("ultra")) return "text-blue-600";
    if (lower.includes("premium")) return "text-amber-600";
    return "text-slate-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const usersByPlan: Record<string, any[]> = {};
  allUsers.forEach(u => {
    const planName = u.user_subscriptions?.[0]?.subscription_plans?.name || "Standard";
    if (!usersByPlan[planName]) usersByPlan[planName] = [];
    usersByPlan[planName].push(u);
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="text-2xl font-bold">€{stats.totalVolume.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ricavi</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Utenti per Piano</TabsTrigger>
            <TabsTrigger value="kyc">Verifiche KYC</TabsTrigger>
            <TabsTrigger value="withdrawal">Prelievi</TabsTrigger>
            <TabsTrigger value="transactions">Transazioni</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            {Object.entries(usersByPlan).map(([planName, users]) => (
              <Card key={planName}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${getPlanColor(planName)}`}>
                    <Shield className="w-5 h-5" />
                    {planName} ({users.length} utenti)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>KYC Status</TableHead>
                        <TableHead>Data Iscrizione</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell className="font-medium">{userData.full_name || "N/A"}</TableCell>
                          <TableCell>{userData.id.substring(0, 8)}...</TableCell>
                          <TableCell>
                            {userData.kyc_verified ? (
                              <div className="flex items-center gap-2 text-success">
                                <CheckCircle className="w-4 h-4" />
                                Verificato
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-warning">
                                <AlertCircle className="w-4 h-4" />
                                {userData.kyc_status === "rejected" ? "Rifiutato" : "Pendente"}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{new Date(userData.created_at).toLocaleDateString("it-IT")}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserClick(userData)}
                            >
                              Dettagli
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verifiche KYC Pendenti</CardTitle>
                <CardDescription>Approva o rifiuta le verifiche di identità</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Invio</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers
                      .filter(u => u.kyc_status === "pending")
                      .map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell>{userData.full_name || "N/A"}</TableCell>
                          <TableCell>
                            <AlertCircle className="w-4 h-4 text-warning" />
                          </TableCell>
                          <TableCell>{new Date(userData.created_at).toLocaleDateString("it-IT")}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(userData);
                                setShowKYCDialog(true);
                              }}
                            >
                              Revisionare
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawal" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Account di Prelievo</CardTitle>
                  <CardDescription>Gestisci gli account dove depositare i fondi dai pagamenti</CardDescription>
                </div>
                <Button onClick={() => setShowWithdrawalDialog(true)}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Aggiungi Account
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withdrawalAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold capitalize">{account.account_type}</p>
                        <p className="text-sm text-muted-foreground">{account.account_identifier}</p>
                        {account.account_holder_name && (
                          <p className="text-sm text-muted-foreground">Intestatario: {account.account_holder_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Ricevuti: €{account.total_received.toLocaleString("it-IT", { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Badge variant={account.is_active ? "default" : "secondary"}>
                        {account.is_active ? "Attivo" : "Inattivo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ultime Transazioni</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Da</TableHead>
                      <TableHead>A</TableHead>
                      <TableHead>Importo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Fetched transactions would go here */}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* User Detail Dialog */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Utente: {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>

          {userDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email/ID</p>
                  <p className="font-medium">{selectedUser?.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">KYC Status</p>
                  <p className="font-medium">{selectedUser?.kyc_status}</p>
                </div>
              </div>

              {userDetails.subscriptions?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Abbonamenti</p>
                  {userDetails.subscriptions.map((sub: any) => (
                    <Badge key={sub.id}>{sub.subscription_plans?.name}</Badge>
                  ))}
                </div>
              )}

              {userDetails.wallets?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Portafogli</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails.wallets.map((wallet: any) => (
                        <TableRow key={wallet.id}>
                          <TableCell>{wallet.asset_code}</TableCell>
                          <TableCell>{parseFloat(wallet.balance).toFixed(8)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUserDetail(false)}
            >
              Chiudi
            </Button>
            {selectedUser?.kyc_status !== "verified" && (
              <Button
                onClick={() => {
                  setShowUserDetail(false);
                  setShowKYCDialog(true);
                }}
              >
                Revisionare KYC
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KYC Review Dialog */}
      <Dialog open={showKYCDialog} onOpenChange={setShowKYCDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisione KYC</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Utente: {selectedUser?.full_name}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Decisione</Label>
              <div className="flex gap-2">
                <Button
                  variant={kycAction === "approve" ? "default" : "outline"}
                  onClick={() => setKycAction("approve")}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approva
                </Button>
                <Button
                  variant={kycAction === "reject" ? "destructive" : "outline"}
                  onClick={() => setKycAction("reject")}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rifiuta
                </Button>
              </div>
            </div>

            <div>
              <Label>Motivo (opzionale)</Label>
              <Input
                placeholder="Es: Documento non leggibile"
                value={kycReason}
                onChange={(e) => setKycReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKYCDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleKYCReview}>
              Conferma Decisione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Account Dialog */}
      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Account di Prelievo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo Account</Label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={withdrawalForm.accountType}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountType: e.target.value })}
              >
                <option>stripe</option>
                <option>paypal</option>
                <option>bank_transfer</option>
                <option>crypto_wallet</option>
              </select>
            </div>

            <div>
              <Label>Identificativo Account*</Label>
              <Input
                placeholder="Es: acct_1234567890"
                value={withdrawalForm.accountIdentifier}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountIdentifier: e.target.value })}
              />
            </div>

            <div>
              <Label>Intestatario (opzionale)</Label>
              <Input
                placeholder="Nome account"
                value={withdrawalForm.accountHolderName}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountHolderName: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawalDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleAddWithdrawalAccount}>
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardComplete;
