import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Shield, TrendingUp, Zap, Globe, Lock, Crown, Check, ArrowRight, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [topAssets, setTopAssets] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    fetchTopAssets();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/");
    }
    setIsAuthenticated(!!session);
  };

  const fetchTopAssets = async () => {
    const { data } = await supabase
      .from("trading_assets")
      .select("*")
      .order("price_change_24h", { ascending: false })
      .limit(3);
    
    if (data) setTopAssets(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10 animate-pulse" />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-accent bg-clip-text text-transparent leading-tight">
              L'Online Banking Fatto per Te
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Investi in azioni, crypto e asset globali con la piattaforma più sicura e innovativa
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="text-lg h-14 px-8 hover-scale"
                onClick={() => navigate("/auth")}
              >
                Inizia Ora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg h-14 px-8"
                onClick={() => navigate("/trading")}
              >
                Esplora i Mercati
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center hover-scale border-primary/20 animate-fade-in">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex p-4 rounded-full bg-primary/10">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-4xl font-bold mb-2">50+</h3>
                <p className="text-muted-foreground">Asset Disponibili</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover-scale border-success/20 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex p-4 rounded-full bg-success/10">
                  <TrendingUp className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-4xl font-bold mb-2">€2.4B+</h3>
                <p className="text-muted-foreground">Volume Giornaliero</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover-scale border-accent/20 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex p-4 rounded-full bg-accent/10">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-4xl font-bold mb-2">100%</h3>
                <p className="text-muted-foreground">Sicuro e Verificato</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Top Assets Section */}
      {topAssets.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Asset in Tendenza
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topAssets.map((asset, index) => (
                  <Card 
                    key={asset.id} 
                    className="hover-scale cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => navigate("/trading")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{asset.symbol}</h3>
                          <p className="text-sm text-muted-foreground">{asset.name}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                          {asset.asset_type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          €{asset.current_price.toLocaleString('it-IT', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="flex items-center gap-1 text-success font-semibold">
                          <TrendingUp className="w-4 h-4" />
                          +{asset.price_change_24h.toFixed(2)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-accent/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perché Scegliere CryptoBank
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-full bg-primary/10 w-fit">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Trading Veloce</h3>
              <p className="text-muted-foreground">
                Esegui operazioni in millisecondi con la nostra infrastruttura ad alte prestazioni
              </p>
            </div>
            
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="p-4 rounded-full bg-success/10 w-fit">
                <Lock className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold">Sicurezza Massima</h3>
              <p className="text-muted-foreground">
                Protezione avanzata con cold storage, 2FA e monitoraggio 24/7 delle tue risorse
              </p>
            </div>
            
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="p-4 rounded-full bg-accent/10 w-fit">
                <Globe className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Mercati Globali</h3>
              <p className="text-muted-foreground">
                Accedi a crypto, azioni e commodities da tutto il mondo in un'unica piattaforma
              </p>
            </div>
            
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="p-4 rounded-full bg-primary/10 w-fit">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Analisi Avanzate</h3>
              <p className="text-muted-foreground">
                Strumenti professionali per analizzare i mercati e prendere decisioni informate
              </p>
            </div>
            
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="p-4 rounded-full bg-success/10 w-fit">
                <Shield className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold">KYC Verificato</h3>
              <p className="text-muted-foreground">
                Piattaforma regolamentata con verifica KYC per la tua sicurezza e conformità
              </p>
            </div>
            
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="p-4 rounded-full bg-accent/10 w-fit">
                <BarChart3 className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Portfolio Diversificato</h3>
              <p className="text-muted-foreground">
                Costruisci il tuo portfolio ideale con accesso a centinaia di asset differenti
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cards Animation Section - Premium Credit Cards Style */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Come Investire con CryptoBank
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 - American Express Style - Interactive */}
            <div className="text-center space-y-4 animate-fade-in group">
              <div 
                className="w-full aspect-[1.586] relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer transform transition-all duration-500 hover:scale-110 hover:-rotate-3 perspective-1000"
                style={{ 
                  transformStyle: 'preserve-3d',
                  boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.5)'
                }}
                onClick={() => navigate("/auth")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900" 
                     style={{ transform: 'translateZ(20px)' }} />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative h-full flex flex-col justify-between p-6 text-white" style={{ transform: 'translateZ(30px)' }}>
                  <div className="text-left">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 border border-white/30 shadow-lg">
                      <span className="text-3xl font-bold">1</span>
                    </div>
                    <p className="font-bold text-lg tracking-wide">REGISTRAZIONE</p>
                    <p className="text-xs opacity-80 mt-1">Membro Platinum</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-60 mb-1">CRYPTOBANK</p>
                    <div className="flex justify-end items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm" />
                      <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm -ml-4" />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <h3 className="text-xl font-semibold">Crea il Tuo Account</h3>
              <p className="text-muted-foreground">
                Registrati in pochi minuti con email e password. Verifica la tua identità per accedere a tutte le funzionalità.
              </p>
            </div>

            {/* Card 2 - Visa Infinite Style - Interactive */}
            <div className="text-center space-y-4 animate-fade-in group" style={{ animationDelay: "0.2s" }}>
              <div 
                className="w-full aspect-[1.586] relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer transform transition-all duration-500 hover:scale-110 hover:rotate-3 perspective-1000"
                style={{ 
                  transformStyle: 'preserve-3d',
                  boxShadow: '0 25px 50px -12px rgba(234, 179, 8, 0.5)'
                }}
                onClick={() => navigate("/dashboard")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" 
                     style={{ transform: 'translateZ(20px)' }} />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="relative h-full flex flex-col justify-between p-6 text-white" style={{ transform: 'translateZ(30px)' }}>
                  <div className="text-left">
                    <div className="w-12 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg mb-4 shadow-lg" 
                         style={{ boxShadow: '0 4px 15px rgba(234, 179, 8, 0.5)' }} />
                    <p className="font-bold text-lg tracking-wider">DEPOSITO</p>
                    <p className="text-xs opacity-80 mt-1">Carte Premium</p>
                  </div>
                  <div>
                    <p className="text-2xl font-mono font-bold tracking-wider mb-4">
                      •••• •••• •••• 1000
                    </p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs opacity-60">Saldo Disponibile</p>
                        <p className="font-semibold">€1,000.00</p>
                      </div>
                      <p className="text-xs font-bold tracking-widest">VISA</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <h3 className="text-xl font-semibold">Deposita Fondi</h3>
              <p className="text-muted-foreground">
                Aggiungi fondi al tuo wallet in modo sicuro tramite bonifico bancario o carta. Inizia con qualsiasi importo.
              </p>
            </div>

            {/* Card 3 - Mastercard World Elite Style - Interactive */}
            <div className="text-center space-y-4 animate-fade-in group" style={{ animationDelay: "0.4s" }}>
              <div 
                className="w-full aspect-[1.586] relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer transform transition-all duration-500 hover:scale-110 hover:-rotate-2 perspective-1000"
                style={{ 
                  transformStyle: 'preserve-3d',
                  boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.5)'
                }}
                onClick={() => navigate("/trading")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800" 
                     style={{ transform: 'translateZ(20px)' }} />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full" />
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-black/10 rounded-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative h-full flex flex-col justify-between p-6 text-white" style={{ transform: 'translateZ(30px)' }}>
                  <div className="text-left">
                    <div className="flex gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-red-500/80 border-2 border-white shadow-lg" 
                           style={{ boxShadow: '0 4px 15px rgba(239, 68, 68, 0.5)' }} />
                      <div className="w-8 h-8 rounded-full bg-orange-400/80 border-2 border-white -ml-4 shadow-lg"
                           style={{ boxShadow: '0 4px 15px rgba(251, 146, 60, 0.5)' }} />
                    </div>
                    <p className="font-bold text-lg tracking-wide">INVESTIMENTO</p>
                    <p className="text-xs opacity-80 mt-1">World Elite</p>
                  </div>
                  <div>
                    <div className="mb-4">
                      <p className="text-xs opacity-60 mb-1">Rendimento Annuale</p>
                      <p className="text-3xl font-bold text-green-300">+12.5%</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs opacity-60">Portfolio Attivo</p>
                        <p className="text-sm font-semibold">Dal 2025</p>
                      </div>
                      <p className="text-xs font-bold tracking-widest">MASTERCARD</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <h3 className="text-xl font-semibold">Inizia a Investire</h3>
              <p className="text-muted-foreground">
                Scegli tra crypto e azioni, monitora i tuoi investimenti in tempo reale e diversifica il tuo portfolio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Scegli il Tuo Piano
            </h2>
            <p className="text-xl text-muted-foreground">
              Piani flessibili per ogni tipo di investitore
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Standard Plan - Free */}
            <Card className="relative hover-scale animate-fade-in border-2">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Standard</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">Gratis</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Perfetto per iniziare</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span className="text-sm">Trading base</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span className="text-sm">5 operazioni/mese</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span className="text-sm">Commissioni 2%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span className="text-sm">Supporto email</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
                  Inizia Gratis
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative hover-scale animate-fade-in border-2 border-primary/50" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-primary">Premium</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">€9.99</span>
                    <span className="text-muted-foreground">/mese</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Per investitori attivi</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span className="text-sm">Trading avanzato</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span className="text-sm">50 operazioni/mese</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span className="text-sm">Commissioni 1%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span className="text-sm">Analisi avanzate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span className="text-sm">Supporto prioritario</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  Scegli Premium
                </Button>
              </CardContent>
            </Card>

            {/* Ultra Plan */}
            <Card className="relative hover-scale animate-fade-in border-2 border-accent/50" style={{ animationDelay: "0.2s" }}>
              <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-3 py-1 text-xs font-bold rounded-bl-lg rounded-tr-lg">
                POPOLARE
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-accent">Ultra</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">€24.99</span>
                    <span className="text-muted-foreground">/mese</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Per professionisti</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-accent text-xs">✓</span>
                    </div>
                    <span className="text-sm">Trading professionale</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-accent text-xs">✓</span>
                    </div>
                    <span className="text-sm">Operazioni illimitate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-accent text-xs">✓</span>
                    </div>
                    <span className="text-sm">Commissioni 0.5%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-accent text-xs">✓</span>
                    </div>
                    <span className="text-sm">API trading</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-accent text-xs">✓</span>
                    </div>
                    <span className="text-sm">Account manager dedicato</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-accent text-xs">✓</span>
                    </div>
                    <span className="text-sm">Dati in tempo reale</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  Scegli Ultra
                </Button>
              </CardContent>
            </Card>

            {/* Deluxe Plan */}
            <Card className="relative hover-scale animate-fade-in border-2 border-success/50 bg-gradient-to-br from-card to-success/5" style={{ animationDelay: "0.3s" }}>
              <div className="absolute top-0 right-0 bg-success text-success-foreground px-3 py-1 text-xs font-bold rounded-bl-lg rounded-tr-lg">
                VIP
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-success">Deluxe</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">€49.99</span>
                    <span className="text-muted-foreground">/mese</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Esperienza premium</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <span className="text-success text-xs">✓</span>
                    </div>
                    <span className="text-sm font-semibold">Tutto da Ultra +</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <span className="text-success text-xs">✓</span>
                    </div>
                    <span className="text-sm">Commissioni 0.1%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <span className="text-success text-xs">✓</span>
                    </div>
                    <span className="text-sm">Trading AI assistito</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <span className="text-success text-xs">✓</span>
                    </div>
                    <span className="text-sm">Consulenza finanziaria</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <span className="text-success text-xs">✓</span>
                    </div>
                    <span className="text-sm">Accesso eventi esclusivi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <span className="text-success text-xs">✓</span>
                    </div>
                    <span className="text-sm">Assicurazione investimenti</span>
                  </li>
                </ul>
                <Button className="w-full bg-success hover:bg-success/90" onClick={() => navigate("/auth")}>
                  Scegli Deluxe
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
            Inizia a Investire Oggi
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Unisciti a migliaia di investitori che si fidano di CryptoBank per gestire i loro asset
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg h-14 px-8 hover-scale animate-fade-in"
            style={{ animationDelay: "0.2s" }}
            onClick={() => navigate("/auth")}
          >
            Crea Account Gratuito
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">© 2025 CryptoBank. Tutti i diritti riservati.</p>
            <p className="text-sm">
              Gli investimenti comportano rischi. Investi responsabilmente.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
