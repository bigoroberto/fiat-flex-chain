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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidatingDocument, setIsValidatingDocument] = useState(false);

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

  const validateDocument = async (): Promise<boolean> => {
    if (!documentFile) {
      setValidationErrors(["Documento obbligatorio"]);
      return false;
    }

    setIsValidatingDocument(true);
    setValidationErrors([]);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // Extract base64 part
        };
        reader.readAsDataURL(documentFile);
      });

      const base64 = await base64Promise;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate_kyc_document`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentType: formData.documentType,
            fullName: formData.documentNumber,
            dateOfBirth: formData.dateOfBirth,
            imageBase64: base64,
          }),
        }
      );

      const result = await response.json();

      if (!result.valid) {
        setValidationErrors(result.errors || ["Documento non valido"]);
        return false;
      }

      if (result.requiresManualReview) {
        toast.warning("Documento sottoposto a verifica manuale dell'admin");
      }

      return true;
    } catch (error) {
      console.error("Document validation error:", error);
      setValidationErrors(["Errore durante la validazione del documento"]);
      return false;
    } finally {
      setIsValidatingDocument(false);
    }
  };

  const handleVerify = async () => {
    const error = validateKYC();
    if (error) {
      toast.error(error);
      return;
    }

    // Validate document before submission
    const isDocumentValid = await validateDocument();
    if (!isDocumentValid) {
      toast.error(validationErrors[0] || "Documento non valido");
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
          kyc_verified: false, // Set to false, requires admin approval
          kyc_status: "pending", // Changed to pending for manual review
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast.success("Documento caricato! In attesa di verifica admin.");
      setShowKYCDialog(false);
      await fetchProfile();
      onVerificationComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Errore durante il caricamento del documento");
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
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setDocumentFile(file);
                    setValidationErrors([]); // Clear errors on new file
                  }}
                  className="hidden"
                  id="doc-upload"
                />
                <label htmlFor="doc-upload" className="cursor-pointer block">
                  <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">{documentFile?.name || "Clicca per caricare"}</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG o PDF</p>
                </label>
              </div>
              {documentFile && (
                <p className="text-xs text-success mt-2">✓ File caricato: {(documentFile.size / 1024).toFixed(0)} KB</p>
              )}
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx} className="text-sm">{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

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
