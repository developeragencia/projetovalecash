import { MobileCard } from "@/components/mobile-card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "@/components/ui/mobile-layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, ChevronRight, CreditCard, Receipt, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

// Interface para dados reais da API de cashbacks
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
  const isMobile = useIsMobile();

  // Query para buscar dados de cashback reais
  const { data: cashbackData, isLoading: isCashbackLoading } = useQuery<CashbackData>({
    queryKey: ['/api/client/cashbacks'],
    enabled: !!user,
    retry: 2,
    staleTime: 30000
  });

  // Função para converter string para número
  const parseAmount = (value: string): number => {
    return parseFloat(value) || 0;
  };

  // Decidimos se vamos usar o layout de desktop ou apenas o conteúdo
  if (!isMobile) {
    return (
      <DashboardLayout title="Meu Cashback" type="client">
        <div className="space-y-6">
        {/* Cashback Balance Card */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-6">
            <div className="flex flex-col items-center space-y-2">
              <BadgeDollarSign className="h-12 w-12" />
              <h3 className="text-lg">Saldo de Cashback</h3>
              {isBalanceLoading ? (
                <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
              ) : (
                <p className="text-3xl font-bold">{formatCurrency(parseAmount(balanceData?.balance || "0"))}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cashback Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col items-center space-y-1">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
                <h3 className="text-sm font-medium">Ganho este mês</h3>
                {isBalanceLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(parseAmount(balanceData?.monthly_stats?.cashback_earned || "0"))}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col items-center space-y-1">
                <Receipt className="h-6 w-6 text-muted-foreground" />
                <h3 className="text-sm font-medium">Total pendente</h3>
                {isBalanceLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(parseAmount(balanceData?.pending_cashback || "0"))}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for History */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Cashback</CardTitle>
              </CardHeader>
              <CardContent>
                {isCashbackLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : !cashbackData || cashbackData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum cashback encontrado</p>
                    <p className="text-sm">Faça compras para começar a ganhar cashback!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cashbackData.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.store_name || 'Loja'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+{formatCurrency(parseAmount(item.cashback_amount))}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(parseAmount(item.amount))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cashback Concluído</CardTitle>
              </CardHeader>
              <CardContent>
                {isCashbackLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cashbackData?.filter(item => item.status === 'completed').map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-green-100 rounded-full">
                            <ShoppingBag className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{item.store_name || 'Loja'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+{formatCurrency(parseAmount(item.cashback_amount))}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(parseAmount(item.amount))}</p>
                        </div>
                      </div>
                    )) || <p className="text-center text-muted-foreground py-8">Nenhum cashback concluído</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cashback Pendente</CardTitle>
              </CardHeader>
              <CardContent>
                {isCashbackLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cashbackData?.filter(item => item.status === 'pending').map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-yellow-100 rounded-full">
                            <ShoppingBag className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium">{item.store_name || 'Loja'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-yellow-600">+{formatCurrency(parseAmount(item.cashback_amount))}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(parseAmount(item.amount))}</p>
                        </div>
                      </div>
                    )) || <p className="text-center text-muted-foreground py-8">Nenhum cashback pendente</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </DashboardLayout>
    );
  }

  // Mobile Layout
  return (
    <MobileLayout title="Meu Cashback">
      <div className="space-y-6 p-4">
        {/* Mobile Cashback Balance Card */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-6">
            <div className="flex flex-col items-center space-y-2">
              <BadgeDollarSign className="h-12 w-12" />
              <h3 className="text-lg">Saldo de Cashback</h3>
              {isBalanceLoading ? (
                <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
              ) : (
                <p className="text-3xl font-bold">{formatCurrency(parseAmount(balanceData?.balance || "0"))}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mobile Cashback Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col items-center space-y-1">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
                <h3 className="text-sm font-medium">Ganho este mês</h3>
                {isBalanceLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(parseAmount(balanceData?.monthly_stats?.cashback_earned || "0"))}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col items-center space-y-1">
                <Receipt className="h-6 w-6 text-muted-foreground" />
                <h3 className="text-sm font-medium">Total pendente</h3>
                {isBalanceLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(parseAmount(balanceData?.pending_cashback || "0"))}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Tabs for History */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Cashback</CardTitle>
              </CardHeader>
              <CardContent>
                {isCashbackLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : !cashbackData || cashbackData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum cashback encontrado</p>
                    <p className="text-sm">Faça compras para começar a ganhar cashback!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cashbackData.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.store_name || 'Loja'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+{formatCurrency(parseAmount(item.cashback_amount))}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(parseAmount(item.amount))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cashback Concluído</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cashbackData?.filter(item => item.status === 'completed').map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-100 rounded-full">
                          <ShoppingBag className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{item.store_name || 'Loja'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">+{formatCurrency(parseAmount(item.cashback_amount))}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(parseAmount(item.amount))}</p>
                      </div>
                    </div>
                  )) || <p className="text-center text-muted-foreground py-8">Nenhum cashback concluído</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cashback Pendente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cashbackData?.filter(item => item.status === 'pending').map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          <ShoppingBag className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium">{item.store_name || 'Loja'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-yellow-600">+{formatCurrency(parseAmount(item.cashback_amount))}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(parseAmount(item.amount))}</p>
                      </div>
                    </div>
                  )) || <p className="text-center text-muted-foreground py-8">Nenhum cashback pendente</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}