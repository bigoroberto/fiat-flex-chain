import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, ShoppingCart, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Transaction {
  id: string;
  transaction_type: string;
  asset_from: string | null;
  asset_to: string;
  amount: number;
  status: string;
  created_at: string;
}

interface TransactionListProps {
  transactions: Transaction[];
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
      return <RefreshCw className="w-5 h-5 text-muted-foreground" />;
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

const TransactionList = ({ transactions }: TransactionListProps) => {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Transazioni Recenti</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nessuna transazione ancora
          </p>
        ) : (
          <div className="space-y-4">
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
                      {format(new Date(transaction.created_at), 'dd MMM', { locale: it })}
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

export default TransactionList;
