import { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface KYCGuardProps {
  profile: any;
  children: ReactNode;
}

export const KYCGuard = ({ profile, children }: KYCGuardProps) => {
  const navigate = useNavigate();
  
  const isVerified = profile?.kyc_verified === true;
  const isUnderAge = profile?.date_of_birth 
    ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() < 18
    : false;

  if (isUnderAge || !isVerified) {
    return (
      <div className="space-y-4">
        <Alert variant={isUnderAge ? "destructive" : "default"} className="border-2">
          <AlertCircle className="w-5 h-5" />
          <AlertDescription>
            {isUnderAge ? (
              <>
                <strong>Account Non Idoneo</strong> - Devi avere almeno 18 anni per accedere 
                a servizi di trading e prodotti finanziari. Tutte le funzionalità sono disabilitate.
              </>
            ) : (
              <>
                <strong>Verifica KYC Richiesta</strong> - Per accedere a questa funzionalità, 
                devi completare la verifica KYC nel tuo profilo.
              </>
            )}
          </AlertDescription>
        </Alert>
        
        {!isUnderAge && (
          <Button onClick={() => navigate("/profile")} className="w-full">
            <Shield className="w-4 h-4 mr-2" />
            Completa Verifica KYC
          </Button>
        )}
        
        <div className="relative">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="text-center p-6">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold text-muted-foreground">
                {isUnderAge ? "Funzionalità Bloccata" : "Verifica KYC Necessaria"}
              </p>
            </div>
          </div>
          <div className="pointer-events-none opacity-30">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
