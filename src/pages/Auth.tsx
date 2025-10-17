import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Wallet, Shield, TrendingUp } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupDob, setSignupDob] = useState("");
  const [signupAddress, setSignupAddress] = useState("");
  const [signupCity, setSignupCity] = useState("");
  const [signupCountry, setSignupCountry] = useState("");
  const [signupDocType, setSignupDocType] = useState("");
  const [signupDocNumber, setSignupDocNumber] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleDemoLogin = async (isAdmin: boolean = false) => {
    setIsLoading(true);
    try {
      const demoEmail = isAdmin ? "admin@demo.com" : "user@demo.com";
      const demoPassword = "demo123456";

      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error) throw error;

      if (isAdmin) {
        toast.success("Benvenuto Admin Demo!");
        navigate("/admin");
      } else {
        toast.success("Benvenuto Utente Demo!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error("Account demo non disponibile. Crealo prima nel database.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Check user role
      if (data.user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (roleError) {
          console.error("Error checking role:", roleError);
        }

        const userRole = roleData?.role || 'user';

        // Navigate based on role
        if (userRole === 'admin') {
          toast.success("Benvenuto Admin!");
          navigate("/admin");
        } else {
          toast.success("Login effettuato con successo!");
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Login fallito");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast.success("Email di recupero inviata! Controlla la tua casella di posta.");
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Errore nell'invio dell'email di recupero");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate age (must be 18+)
      const dob = new Date(signupDob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      if (age < 18) {
        toast.error("Devi avere almeno 18 anni per registrarti");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: signupName,
            date_of_birth: signupDob,
            address: signupAddress,
            city: signupCity,
            country: signupCountry,
            document_type: signupDocType,
            document_number: signupDocNumber,
          },
        },
      });

      if (error) throw error;

      // Update profile with KYC data
      if (data.user) {
        await supabase.from("profiles").update({
          date_of_birth: signupDob,
          address: signupAddress,
          city: signupCity,
          country: signupCountry,
          document_type: signupDocType,
          document_number: signupDocNumber,
        }).eq("id", data.user.id);
      }

      toast.success("Account creato! Puoi ora effettuare il login.");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Registrazione fallita");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden md:block space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              CryptoBank
            </h1>
            <p className="text-xl text-muted-foreground">
              La tua banca digitale per criptovalute
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-lg bg-accent/10">
                <Wallet className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Multi-Asset Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  Gestisci BTC, ETH, USDT, USDC e valute fiat
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Swap Istantaneo</h3>
                <p className="text-sm text-muted-foreground">
                  Scambia crypto e fiat con il miglior prezzo
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Sicurezza Avanzata</h3>
                <p className="text-sm text-muted-foreground">
                  2FA, cold storage e monitoraggio 24/7
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <Card className="shadow-lg-custom">
          <CardHeader>
            <CardTitle>Benvenuto</CardTitle>
            <CardDescription>
              Accedi o crea un nuovo account per iniziare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Registrati</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                {!showResetPassword ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="nome@esempio.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Accesso in corso..." : "Accedi"}
                    </Button>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          O prova la demo
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleDemoLogin(false)}
                        disabled={isLoading}
                      >
                        Demo Utente
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleDemoLogin(true)}
                        disabled={isLoading}
                      >
                        Demo Admin
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-sm"
                      onClick={() => setShowResetPassword(true)}
                    >
                      Password dimenticata?
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="nome@esempio.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ti invieremo un'email con le istruzioni per reimpostare la password.
                    </p>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Invio in corso..." : "Invia Email di Recupero"}
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-sm"
                      onClick={() => setShowResetPassword(false)}
                    >
                      Torna al Login
                    </Button>
                  </form>
                )}
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo *</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Mario Rossi"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="nome@esempio.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">Verifica KYC (Obbligatorio)</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-dob">Data di Nascita * (Minimo 18 anni)</Label>
                      <Input
                        id="signup-dob"
                        type="date"
                        value={signupDob}
                        onChange={(e) => setSignupDob(e.target.value)}
                        required
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-address">Indirizzo *</Label>
                      <Input
                        id="signup-address"
                        type="text"
                        placeholder="Via Roma 123"
                        value={signupAddress}
                        onChange={(e) => setSignupAddress(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="signup-city">Città *</Label>
                        <Input
                          id="signup-city"
                          type="text"
                          placeholder="Milano"
                          value={signupCity}
                          onChange={(e) => setSignupCity(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-country">Paese *</Label>
                        <Input
                          id="signup-country"
                          type="text"
                          placeholder="Italia"
                          value={signupCountry}
                          onChange={(e) => setSignupCountry(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-doctype">Tipo Documento *</Label>
                      <select
                        id="signup-doctype"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={signupDocType}
                        onChange={(e) => setSignupDocType(e.target.value)}
                        required
                      >
                        <option value="">Seleziona tipo documento</option>
                        <option value="passport">Passaporto</option>
                        <option value="id_card">Carta d'Identità</option>
                        <option value="driving_license">Patente</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-docnumber">Numero Documento *</Label>
                      <Input
                        id="signup-docnumber"
                        type="text"
                        placeholder="AA1234567"
                        value={signupDocNumber}
                        onChange={(e) => setSignupDocNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creazione account..." : "Crea Account"}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    I tuoi dati sono protetti e verranno verificati per garantire la sicurezza
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
