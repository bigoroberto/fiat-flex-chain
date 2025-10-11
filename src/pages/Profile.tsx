import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    address: "",
    city: "",
    country: "",
    postal_code: "",
  });

  const [cardData, setCardData] = useState({
    holder_name: "",
    last_four: "",
  });

  const [bankData, setBankData] = useState({
    holder_name: "",
    iban: "",
  });

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
    await fetchProfile(session.user.id);
    await fetchPaymentMethods(session.user.id);
  };

  const fetchProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        date_of_birth: data.date_of_birth || "",
        address: data.address || "",
        city: data.city || "",
        country: data.country || "",
        postal_code: data.postal_code || "",
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentMethods = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profilo aggiornato con successo");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddCard = async () => {
    try {
      const { error } = await supabase.from("payment_methods").insert({
        user_id: user.id,
        method_type: "card",
        holder_name: cardData.holder_name,
        last_four: cardData.last_four,
      });

      if (error) throw error;
      toast.success("Carta aggiunta con successo");
      setShowAddCard(false);
      setCardData({ holder_name: "", last_four: "" });
      await fetchPaymentMethods(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddBank = async () => {
    try {
      const { error } = await supabase.from("payment_methods").insert({
        user_id: user.id,
        method_type: "bank_account",
        holder_name: bankData.holder_name,
        iban: bankData.iban,
      });

      if (error) throw error;
      toast.success("Conto bancario aggiunto con successo");
      setShowAddBank(false);
      setBankData({ holder_name: "", iban: "" });
      await fetchPaymentMethods(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
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
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              {t("profile.title")}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.personalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t("auth.fullName")}</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("auth.dateOfBirth")}</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("auth.address")}</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Città</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Paese</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div>
                <Label>CAP</Label>
                <Input
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleSaveProfile}>{t("common.save")}</Button>
          </CardContent>
        </Card>

        {/* KYC Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.kyc")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  profile?.kyc_verified
                    ? "bg-success/10 text-success"
                    : "bg-yellow-500/10 text-yellow-600"
                }`}
              >
                {profile?.kyc_verified ? "Verificato" : "In attesa di verifica"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("profile.paymentMethods")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddCard(true)}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t("profile.addCard")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddBank(true)}>
                  <Building2 className="w-4 h-4 mr-2" />
                  {t("profile.addBank")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {method.method_type === "card" ? (
                      <CreditCard className="w-5 h-5" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                    <div>
                      <p className="font-medium">{method.holder_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {method.method_type === "card"
                          ? `**** ${method.last_four}`
                          : method.iban}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {paymentMethods.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nessun metodo di pagamento aggiunto
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Carta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Intestatario</Label>
              <Input
                value={cardData.holder_name}
                onChange={(e) => setCardData({ ...cardData, holder_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Ultime 4 Cifre</Label>
              <Input
                value={cardData.last_four}
                onChange={(e) => setCardData({ ...cardData, last_four: e.target.value })}
                maxLength={4}
              />
            </div>
            <Button onClick={handleAddCard} className="w-full">
              Aggiungi Carta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Bank Dialog */}
      <Dialog open={showAddBank} onOpenChange={setShowAddBank}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Conto Bancario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Intestatario</Label>
              <Input
                value={bankData.holder_name}
                onChange={(e) => setBankData({ ...bankData, holder_name: e.target.value })}
              />
            </div>
            <div>
              <Label>IBAN</Label>
              <Input
                value={bankData.iban}
                onChange={(e) => setBankData({ ...bankData, iban: e.target.value })}
              />
            </div>
            <Button onClick={handleAddBank} className="w-full">
              Aggiungi Conto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
