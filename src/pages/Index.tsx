import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, TrendingUp, Zap, Lock, Globe, BarChart3 } from "lucide-react";

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
              Il Futuro del Trading è Qui
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

      {/* Cards Animation Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Come Investire con CryptoBank
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-full aspect-[1.586] bg-gradient-to-br from-primary via-primary-glow to-accent rounded-2xl p-6 shadow-elegant transform hover:scale-105 transition-transform duration-300">
                <div className="h-full flex flex-col justify-between text-primary-foreground">
                  <div className="text-left">
                    <div className="w-12 h-12 bg-background/20 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-2xl">1</span>
                    </div>
                    <p className="font-semibold">Registrazione</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">CryptoBank</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold">Crea il Tuo Account</h3>
              <p className="text-muted-foreground">
                Registrati in pochi minuti con email e password. Verifica la tua identità per accedere a tutte le funzionalità.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-full aspect-[1.586] bg-gradient-to-br from-accent via-primary to-primary-glow rounded-2xl p-6 shadow-elegant transform hover:scale-105 transition-transform duration-300">
                <div className="h-full flex flex-col justify-between text-primary-foreground">
                  <div className="text-left">
                    <div className="w-12 h-12 bg-background/20 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-2xl">2</span>
                    </div>
                    <p className="font-semibold">Deposito</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">€1,000</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold">Deposita Fondi</h3>
              <p className="text-muted-foreground">
                Aggiungi fondi al tuo wallet in modo sicuro tramite bonifico bancario o carta. Inizia con qualsiasi importo.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="w-full aspect-[1.586] bg-gradient-to-br from-success via-primary-glow to-primary rounded-2xl p-6 shadow-elegant transform hover:scale-105 transition-transform duration-300">
                <div className="h-full flex flex-col justify-between text-primary-foreground">
                  <div className="text-left">
                    <div className="w-12 h-12 bg-background/20 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-2xl">3</span>
                    </div>
                    <p className="font-semibold">Investimento</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">+12.5%</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold">Inizia a Investire</h3>
              <p className="text-muted-foreground">
                Scegli tra crypto e azioni, monitora i tuoi investimenti in tempo reale e diversifica il tuo portfolio.
              </p>
            </div>
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
