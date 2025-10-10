import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ShoppingCart } from "lucide-react";

interface TutorialProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    title: "Benvenuto in CryptoBank",
    description: "Questa guida ti mostrerà come utilizzare tutte le funzionalità della piattaforma.",
    icon: null,
  },
  {
    title: "Deposito",
    description: "Clicca su 'Deposita' per aggiungere fondi al tuo wallet. Puoi depositare sia crypto che valute fiat.",
    icon: <ArrowDownLeft className="w-12 h-12 text-success" />,
  },
  {
    title: "Prelievo",
    description: "Usa 'Preleva' per trasferire i tuoi fondi verso wallet esterni o conti bancari.",
    icon: <ArrowUpRight className="w-12 h-12 text-destructive" />,
  },
  {
    title: "Acquisto Crypto",
    description: "Con 'Acquista' puoi comprare criptovalute usando le tue valute fiat con carta o bonifico.",
    icon: <ShoppingCart className="w-12 h-12 text-primary" />,
  },
  {
    title: "Swap Valute",
    description: "Lo 'Swap' ti permette di scambiare istantaneamente tra criptovalute e valute fiat al miglior prezzo.",
    icon: <ArrowLeftRight className="w-12 h-12 text-accent" />,
  },
];

const Tutorial = ({ onComplete }: TutorialProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if tutorial was already completed
    const tutorialCompleted = localStorage.getItem("tutorial_completed");
    if (!tutorialCompleted) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("tutorial_completed", "true");
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("tutorial_completed", "true");
    setIsOpen(false);
    onComplete();
  };

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const step = tutorialSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>
        
        {step.icon && (
          <div className="flex justify-center py-6">
            <div className="p-4 rounded-full bg-muted">
              {step.icon}
            </div>
          </div>
        )}
        
        <Progress value={progress} className="w-full" />
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            Salta
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Indietro
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep < tutorialSteps.length - 1 ? "Avanti" : "Inizia"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Tutorial;
