import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, ShoppingCart, ArrowLeftRight } from "lucide-react";

interface Transaction {
  id: string;
  transaction_type: string;
  asset_from: string | null;
  asset_to: string;
  amount: number;
  status: string;
  created_at: string;
}

interface PortfolioHistoryProps {
  userId: string;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'deposit':
      return <ArrowDownLeft className="w-5 h-5 text-success" />;
    case 'withdraw':
      return <ArrowUpRight className="w-5 h-5 text-destructive" />;
    case 'swap':
      return <ArrowLeftRight className="w-5 h-5 text-accent" />;
    case 'buy':
      return <ShoppingCart className="w-5 h-5 text-primary" />;
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-success/10 text-success';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-600';
    case 'failed':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const PortfolioHistory = ({ userId }: PortfolioHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Storico Investimenti</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Storico Investimenti</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nessuna transazione ancora
          </p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    {getTransactionIcon(transaction.transaction_type)}
                  </div>
                  <div>
                    <p className="font-medium capitalize">
                      {transaction.transaction_type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.asset_from && `${transaction.asset_from} → `}
                      {transaction.asset_to}
                    </p>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <p className="font-semibold">
                    {transaction.amount.toLocaleString('it-IT', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.created_at), 'dd MMM HH:mm', { locale: it })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioHistory;
