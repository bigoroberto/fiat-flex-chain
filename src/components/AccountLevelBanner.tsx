import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Zap, Star } from "lucide-react";

interface AccountLevelBannerProps {
  planName: string;
  planFeatures: any;
  tradingFeeDiscount: number;
  withdrawalFeeDiscount: number;
  prioritySupport: boolean;
}

export const AccountLevelBanner = ({
  planName,
  planFeatures,
  tradingFeeDiscount,
  withdrawalFeeDiscount,
  prioritySupport,
}: AccountLevelBannerProps) => {
  const getPlanIcon = () => {
    switch (planName) {
      case "Standard":
        return <Star className="w-6 h-6" />;
      case "Premium":
        return <Zap className="w-6 h-6" />;
      case "VIP":
        return <Crown className="w-6 h-6" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  const getPlanGradient = () => {
    switch (planName) {
      case "Standard":
        return "from-blue-500 to-blue-600";
      case "Premium":
        return "from-purple-500 to-purple-600";
      case "VIP":
        return "from-amber-500 to-amber-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const features = [
    {
      label: `Sconto commissioni trading: ${tradingFeeDiscount}%`,
      active: tradingFeeDiscount > 0,
    },
    {
      label: `Sconto prelievi: ${withdrawalFeeDiscount}%`,
      active: withdrawalFeeDiscount > 0,
    },
    {
      label: "Grafici avanzati",
      active: planFeatures?.advanced_charts || false,
    },
    {
      label: "Accesso API",
      active: planFeatures?.api_access || false,
    },
    {
      label: "Supporto prioritario",
      active: prioritySupport,
    },
  ];

  return (
    <Card className={`bg-gradient-to-r ${getPlanGradient()} text-white border-0 shadow-xl`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getPlanIcon()}
            <div>
              <h3 className="text-2xl font-bold">{planName}</h3>
              <p className="text-white/80 text-sm">Piano attivo</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            Attivo
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {feature.active ? (
                <Check className="w-4 h-4 text-white flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-white/40 flex-shrink-0" />
              )}
              <span className={feature.active ? "text-white" : "text-white/40"}>
                {feature.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
