import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Upload, Check, AlertCircle, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface KYCVerificationCompleteProps {
  userId: string;
  onVerificationComplete?: () => void;
}

export const KYCVerificationComplete = ({ userId, onVerificationComplete }: KYCVerificationCompleteProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showKYCDialog, setShowKYCDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    documentType: "ID",
    documentNumber: "",
    dateOfBirth: "",
    address: "",
    city: "",
    country: "",
    acceptTerms: false,
  });

  const [documentFile, setDocumentFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const validateKYC = (): string | null => {
    if (!formData.documentNumber) return "Numero documento obbligatorio";
    if (!formData.dateOfBirth) return "Data di nascita obbligatoria";
    if (!formData.address) return "Indirizzo obbligatorio";
    if (!formData.city) return "Città obbligatoria";
    if (!formData.country) return "Paese obbligatorio";
    if (!formData.acceptTerms) return "Accettazione termini obbligatoria";
    if (!documentFile) return "Documento di identità obbligatorio";

    const age = calculateAge(formData.dateOfBirth);
    if (age < 18) return "Devi avere almeno 18 anni";

    return null;
  };

  const handleVerify = async () => {
    const error = validateKYC();
    if (error) {
      toast.error(error);
      return;
    }

    setIsProcessing(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          document_type: formData.documentType,
          document_number: formData.documentNumber,
          date_of_birth: formData.dateOfBirth,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          kyc_verified: true,
          kyc_status: "verified",
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast.success("KYC verificato con successo!");
      setShowKYCDialog(false);
      await fetchProfile();
      onVerificationComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Errore durante la verifica KYC");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Caricamento...</div>;
  }

  const isVerified = profile?.kyc_verified;
  const age = profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const isMinorOrUnverified = !isVerified || (age !== null && age < 18);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isVerified ? (
                  <>
                    <Check className="w-5 h-5 text-success" />
                    KYC Verificato
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-warning" />
                    KYC Pendente
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isVerified
                  ? `Verificato il ${new Date(profile?.created_at).toLocaleDateString("it-IT")}`
                  : "Completa la verifica di identità per accedere a tutte le funzioni"}
              </CardDescription>
            </div>
            {!isVerified && (
              <Button onClick={() => setShowKYCDialog(true)} variant="default">
                <Upload className="w-4 h-4 mr-2" />
                Avvia Verifica
              </Button>
            )}
          </div>
        </CardHeader>

        {isMinorOrUnverified && (
          <CardContent>
            <Alert className="border-warning/50 bg-warning/10">
              <Lock className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                {age !== null && age < 18
                  ? "Account disabilitato: devi avere almeno 18 anni per accedere ai servizi finanziari."
                  : "Il tuo account è limitato fino al completamento della verifica KYC."}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        {isVerified && profile && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo Documento</p>
                <p className="font-medium">{profile.document_type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data Nascita</p>
                <p className="font-medium">
                  {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString("it-IT") : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Città</p>
                <p className="font-medium">{profile.city}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Paese</p>
                <p className="font-medium">{profile.country}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={showKYCDialog} onOpenChange={setShowKYCDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verifica KYC Completa</DialogTitle>
            <DialogDescription>
              Completa la procedura di verifica di identità (Know Your Customer)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Devi avere almeno 18 anni per accedere ai servizi finanziari.
              </AlertDescription>
            </Alert>

            <div>
              <Label>Tipo Documento*</Label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
              >
                <option>ID</option>
                <option>Passaporto</option>
                <option>Patente</option>
              </select>
            </div>

            <div>
              <Label>Numero Documento*</Label>
              <Input
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
              />
            </div>

            <div>
              <Label>Data di Nascita*</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            <div>
              <Label>Indirizzo*</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Città*</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Paese*</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Upload Documento*</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="doc-upload"
                />
                <label htmlFor="doc-upload" className="cursor-pointer block">
                  <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">{documentFile?.name || "Clicca per caricare"}</p>
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
              />
              <label htmlFor="terms" className="text-sm cursor-pointer">
                Accetto i termini di verifica KYC*
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKYCDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleVerify} disabled={isProcessing}>
              {isProcessing ? "Verifica in corso..." : "Verifica Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
