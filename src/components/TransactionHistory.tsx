import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface Transaction {
  id: string;
  transaction_type: string;
  asset_from: string | null;
  asset_to: string;
  amount: number;
  status: string;
  created_at: string;
  fee?: number;
}

interface TransactionHistoryProps {
  userId: string;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case "deposit":
      return <ArrowDownLeft className="w-5 h-5 text-success" />;
    case "withdraw":
      return <ArrowUpRight className="w-5 h-5 text-destructive" />;
    case "swap":
      return <ArrowLeftRight className="w-5 h-5 text-accent" />;
    case "buy":
      return <ShoppingCart className="w-5 h-5 text-primary" />;
    default:
      return null;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completato
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="w-3 h-3 mr-1" />
          In Attesa
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="w-3 h-3 mr-1" />
          Fallito
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

const TransactionHistory = ({ userId }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel('transaction-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = (filter: string) => {
    if (filter === "all") return transactions;
    if (filter === "deposit" || filter === "withdraw" || filter === "buy" || filter === "swap") {
      return transactions.filter((t) => t.transaction_type === filter);
    }
    return transactions.filter((t) => t.status === filter);
  };

  const renderTransactionList = (filteredTransactions: Transaction[]) => {
    if (filteredTransactions.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          Nessuna transazione trovata
        </p>
      );
    }

    return (
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {filteredTransactions.map((transaction) => (
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
                  {transaction.transaction_type === "buy"
                    ? "Acquisto"
                    : transaction.transaction_type === "withdraw"
                    ? "Prelievo"
                    : transaction.transaction_type === "deposit"
                    ? "Deposito"
                    : "Scambio"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {transaction.asset_from && `${transaction.asset_from} → `}
                  {transaction.asset_to}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(transaction.created_at), "dd MMM yyyy HH:mm", {
                    locale: it,
                  })}
                </p>
              </div>
            </div>

            <div className="text-right space-y-2">
              <p className="font-semibold">
                {transaction.amount.toLocaleString("it-IT", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8,
                })}
              </p>
              {transaction.fee && (
                <p className="text-xs text-muted-foreground">
                  Fee: €{transaction.fee.toFixed(2)}
                </p>
              )}
              {getStatusBadge(transaction.status)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Storico Transazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = transactions.filter((t) => t.status === "completed").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const depositCount = transactions.filter((t) => t.transaction_type === "deposit").length;
  const withdrawCount = transactions.filter((t) => t.transaction_type === "withdraw").length;
  const buyCount = transactions.filter((t) => t.transaction_type === "buy").length;
  const swapCount = transactions.filter((t) => t.transaction_type === "swap").length;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Storico Transazioni</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-7 h-auto">
            <TabsTrigger value="all" className="text-xs px-2">
              Tutte
              <Badge variant="secondary" className="ml-1 text-xs">
                {transactions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-2">
              Completate
              <Badge variant="secondary" className="ml-1 text-xs">
                {completedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-2">
              In Attesa
              <Badge variant="secondary" className="ml-1 text-xs">
                {pendingCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="deposit" className="text-xs px-2">
              Depositi
              <Badge variant="secondary" className="ml-1 text-xs">
                {depositCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="buy" className="text-xs px-2">
              Acquisti
              <Badge variant="secondary" className="ml-1 text-xs">
                {buyCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="text-xs px-2">
              Prelievi
              <Badge variant="secondary" className="ml-1 text-xs">
                {withdrawCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="swap" className="text-xs px-2">
              Scambi
              <Badge variant="secondary" className="ml-1 text-xs">
                {swapCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderTransactionList(filterTransactions("all"))}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            {renderTransactionList(filterTransactions("completed"))}
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            {renderTransactionList(filterTransactions("pending"))}
          </TabsContent>
          <TabsContent value="deposit" className="mt-4">
            {renderTransactionList(filterTransactions("deposit"))}
          </TabsContent>
          <TabsContent value="buy" className="mt-4">
            {renderTransactionList(filterTransactions("buy"))}
          </TabsContent>
          <TabsContent value="withdraw" className="mt-4">
            {renderTransactionList(filterTransactions("withdraw"))}
          </TabsContent>
          <TabsContent value="swap" className="mt-4">
            {renderTransactionList(filterTransactions("swap"))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
