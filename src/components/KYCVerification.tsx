import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle, FileText, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface KYCVerificationProps {
  userId: string;
  profile: any;
  onVerificationUpdate: () => void;
}

export const KYCVerification = ({ userId, profile, onVerificationUpdate }: KYCVerificationProps) => {
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmitKYC = async () => {
    if (!documentType || !documentNumber || !dateOfBirth) {
      toast.error("Compila tutti i campi richiesti");
      return;
    }

    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      toast.error("Devi avere almeno 18 anni per utilizzare questa piattaforma");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          document_type: documentType,
          document_number: documentNumber,
          date_of_birth: dateOfBirth,
          kyc_status: "pending",
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Richiesta KYC inviata! Verrai notificato una volta completata la verifica.");
      onVerificationUpdate();
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'invio della richiesta KYC");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUnderAge = dateOfBirth ? calculateAge(dateOfBirth) < 18 : false;
  const isPending = profile?.kyc_status === "pending";
  const isVerified = profile?.kyc_verified;

  return (
    <Card id="kyc-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Verifica KYC (Know Your Customer)
        </CardTitle>
        <CardDescription>
          La verifica dell'identità è obbligatoria per accedere ai servizi di trading e finanziari
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isVerified ? (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              <strong>Account Verificato</strong> - Hai accesso completo a tutti i servizi della piattaforma
            </AlertDescription>
          </Alert>
        ) : isPending ? (
          <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <AlertDescription className="text-yellow-900 dark:text-yellow-100">
              <strong>Verifica in Corso</strong> - La tua richiesta è in fase di revisione. Riceverai una notifica entro 24-48 ore.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {isUnderAge && (
              <Alert variant="destructive">
                <AlertCircle className="w-5 h-5" />
                <AlertDescription>
                  <strong>Età Insufficiente</strong> - Devi avere almeno 18 anni per utilizzare questa piattaforma.
                  I servizi di trading sono limitati fino al compimento della maggiore età.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="documentType">Tipo di Documento *</Label>
                <Select value={documentType} onValueChange={setDocumentType} disabled={isUnderAge}>
                  <SelectTrigger id="documentType">
                    <SelectValue placeholder="Seleziona tipo documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passaporto</SelectItem>
                    <SelectItem value="id_card">Carta d'Identità</SelectItem>
                    <SelectItem value="drivers_license">Patente di Guida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="documentNumber">Numero Documento *</Label>
                <Input
                  id="documentNumber"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
                  placeholder="Es. AB123456"
                  disabled={isUnderAge}
                />
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Data di Nascita *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                {dateOfBirth && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Età: {calculateAge(dateOfBirth)} anni
                    {isUnderAge && " - Minorenne"}
                  </p>
                )}
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <FileText className="w-5 h-5 text-blue-600" />
                <AlertDescription className="text-blue-900 dark:text-blue-100 text-sm">
                  <strong>Requisiti KYC:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Età minima: 18 anni</li>
                    <li>Documento di identità valido</li>
                    <li>Dati anagrafici completi e corretti</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleSubmitKYC}
                disabled={isSubmitting || isUnderAge || !documentType || !documentNumber || !dateOfBirth}
                className="w-full"
              >
                {isSubmitting ? "Invio in corso..." : "Invia Richiesta Verifica"}
              </Button>

              {isUnderAge && (
                <p className="text-sm text-destructive text-center">
                  La verifica KYC non può essere completata per utenti minorenni.
                  Alcune funzionalità della piattaforma sono disabilitate.
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
