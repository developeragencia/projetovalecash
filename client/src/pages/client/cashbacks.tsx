import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { useMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { BadgeDollarSign, CreditCard, Clock, History, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatTransactionDate } from "@/lib/utils";

interface CashbackData {
  balance: string;
  pending: string;
  total_earned: string;
  history: {
    id: number;
    amount: string;
    cashback_amount: string;
    description: string;
    created_at: string;
    store_name: string | null;
  }[];
  by_category: {
    category: string;
    transaction_count: number;
    total_cashback: number;
  }[];
}

export default function ClientCashbacks() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isMobile = useMobile();

  const { data: cashbackData, isLoading: isCashbackLoading } = useQuery<CashbackData>({
    queryKey: ["/api/client/cashbacks"],
    enabled: !!user,
  });

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const parseAmount = (value: string): number => {
    return parseFloat(value) || 0;
  };

  // Force mobile layout for consistency
  if (false) {
    return (
      <DashboardLayout title="Meu Cashback" type="client">
        <div className="space-y-6">
        {/* Cashback Balance Card */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-6">
            <div className="flex flex-col items-center space-y-2">
              <BadgeDollarSign className="h-12 w-12" />
              <h3 className="text-lg">Saldo de Cashback</h3>
              {isCashbackLoading ? (
                <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
              ) : (
                <p className="text-3xl font-bold">{formatCurrency(parseAmount(cashbackData?.balance || "0"))}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center space-x-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Ganho</h3>
                  {isCashbackLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">{formatCurrency(parseAmount(cashbackData?.total_earned || "0"))}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center space-x-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Pendente</h3>
                  {isCashbackLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">{formatCurrency(parseAmount(cashbackData?.pending || "0"))}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Cashback Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Histórico de Cashback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCashbackLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : cashbackData?.history && cashbackData.history.length > 0 ? (
              <div className="space-y-4">
                {cashbackData.history.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{transaction.store_name || 'Loja'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTransactionDate(transaction.created_at, 'full')}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(parseAmount(transaction.cashback_amount))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BadgeDollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhum cashback encontrado</p>
                <p className="text-sm">Suas transações aparecerão aqui</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Layout mobile - MobileLayout is already provided by ProtectedRouteMobile
  return (
    <div className="space-y-4">
      {/* Mobile Cashback Balance Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="py-6">
          <div className="flex flex-col items-center space-y-2">
            <BadgeDollarSign className="h-12 w-12" />
            <h3 className="text-lg">Saldo de Cashback</h3>
            {isCashbackLoading ? (
              <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
            ) : (
              <p className="text-3xl font-bold">{formatCurrency(parseAmount(cashbackData?.balance || "0"))}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col items-center space-y-1">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-sm font-medium">Total Ganho</h3>
              {isCashbackLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="text-xl font-bold">{formatCurrency(parseAmount(cashbackData?.total_earned || "0"))}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col items-center space-y-1">
              <Clock className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-sm font-medium">Pendente</h3>
              {isCashbackLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="text-xl font-bold">{formatCurrency(parseAmount(cashbackData?.pending || "0"))}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cashback Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Últimos Cashbacks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCashbackLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : cashbackData?.history && cashbackData.history.length > 0 ? (
            <div className="space-y-3">
              {cashbackData.history.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.store_name || 'Loja'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTransactionDate(transaction.created_at, 'short')}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-green-600 text-sm">
                    +{formatCurrency(parseAmount(transaction.cashback_amount))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BadgeDollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum cashback encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}