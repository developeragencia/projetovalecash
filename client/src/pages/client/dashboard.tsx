import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { LineChartComponent } from "@/components/ui/charts";
import { Wallet, ArrowRightLeft, QrCode, History, Tag, Gift, Loader2, Download } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { InstallButton } from "@/components/ui/install-button";
import { useTranslation } from "@/hooks/use-translation";

// Interfaces para tipagem das APIs reais
interface Transaction {
  id: number;
  amount: string;
  cashback_amount: string;
  description: string;
  created_at: string;
  store_name: string | null;
}

interface DashboardData {
  balance: string;
  pending_cashback: string;
  monthly_stats: {
    transaction_count: string;
    total_spent: string;
    cashback_earned: string;
  };
  recent_transactions: Transaction[];
}

export default function ClientDashboard() {
  const { t } = useTranslation();
  
  // Consulta para obter dados do dashboard do cliente
  const { data: dashboardData, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['/api/client/dashboard'],
    enabled: true,
    queryFn: async () => {
      const response = await fetch('/api/client/dashboard', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0
  });



  // Estado de carregamento
  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" type="client">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  // Tratamento de erros
  if (error) {
    console.error("Dashboard error:", error);
    return (
      <DashboardLayout title="Dashboard" type="client">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-destructive">Erro ao carregar dados</h3>
              <p className="text-muted-foreground">
                Não foi possível carregar os dados do dashboard. Verifique sua conexão.
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Converter string para número quando necessário
  const parseAmount = (value: string): number => {
    return parseFloat(value) || 0;
  };

  // Validação e preparação dos dados
  const safeData = {
    balance: dashboardData?.balance || "0.00",
    pending_cashback: dashboardData?.pending_cashback || "0.00",
    monthly_stats: {
      transaction_count: dashboardData?.monthly_stats?.transaction_count || "0",
      total_spent: dashboardData?.monthly_stats?.total_spent || "0.00",
      cashback_earned: dashboardData?.monthly_stats?.cashback_earned || "0.00"
    },
    recent_transactions: Array.isArray(dashboardData?.recent_transactions) 
      ? dashboardData.recent_transactions 
      : []
  };

  // Função para formatar valores monetários de forma segura
  const formatSafeAmount = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) ? "$0.00" : formatCurrency(numValue);
  };

  return (
    <DashboardLayout title="Dashboard" type="client">
      <div className="space-y-6">
        {/* Balance Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Seu saldo de cashback</p>
                <h2 className="text-3xl font-bold text-primary">
                  {formatSafeAmount(safeData.balance)}
                </h2>
                {parseAmount(safeData.pending_cashback) > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    + {formatSafeAmount(safeData.pending_cashback)} pendente
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/client/transfers">
                  <Button size="sm" className="bg-secondary hover:bg-secondary/90 w-full sm:w-auto">
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Transferir
                  </Button>
                </Link>
                <Link href="/client/qr-code">
                  <Button size="sm" className="bg-secondary hover:bg-secondary/90 w-full sm:w-auto">
                    <QrCode className="mr-2 h-4 w-4" /> QR Code
                  </Button>
                </Link>
                <Link href="/client/transactions">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    <History className="mr-2 h-4 w-4" /> Histórico
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total de Transações"
            value={parseInt(safeData.monthly_stats.transaction_count)}
            icon={<ArrowRightLeft className="h-4 w-4" />}
            trend={{
              value: 12,
              positive: true,
              label: "vs mês passado"
            }}
          />
          <StatCard
            title="Total Gasto"
            value={formatSafeAmount(safeData.monthly_stats.total_spent)}
            icon={<Wallet className="h-4 w-4" />}
            trend={{
              value: 8,
              positive: true,
              label: "vs mês passado"
            }}
          />
          <StatCard
            title="Cashback Ganho"
            value={formatSafeAmount(safeData.monthly_stats.cashback_earned)}
            icon={<Gift className="h-4 w-4" />}
            trend={{
              value: 15,
              positive: true,
              label: "vs mês passado"
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/client/qr-code">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <QrCode className="h-6 w-6" />
                  <span className="text-sm">Gerar QR</span>
                </Button>
              </Link>
              <Link href="/client/transactions">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <History className="h-6 w-6" />
                  <span className="text-sm">Histórico</span>
                </Button>
              </Link>
              <Link href="/client/stores">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <Tag className="h-6 w-6" />
                  <span className="text-sm">Lojas</span>
                </Button>
              </Link>
              <Link href="/client/referrals">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <Gift className="h-6 w-6" />
                  <span className="text-sm">Indicações</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Month Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Mês</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center text-muted-foreground">
                  <div className="mr-2 text-green-600">
                    <Gift className="h-5 w-5" />
                  </div>
                  <span>Cashback Ganho</span>
                </div>
                <div className="font-medium">{formatSafeAmount(safeData.monthly_stats.cashback_earned)}</div>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center text-muted-foreground">
                  <div className="mr-2 text-blue-600">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <span>Total Gasto</span>
                </div>
                <div className="font-medium">{formatSafeAmount(safeData.monthly_stats.total_spent)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-muted-foreground">
                  <div className="mr-2 text-secondary">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <span>Total Transações</span>
                </div>
                <div className="font-medium">{safeData.monthly_stats.transaction_count || 0} transações</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transações Recentes</CardTitle>
            <Link href="/client/transactions">
              <Button variant="ghost" className="text-secondary">Ver todas</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!safeData.recent_transactions.length ? (
              <div className="text-center py-6 text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-muted-foreground text-left border-b">
                      <th className="pb-2 font-medium">Loja</th>
                      <th className="pb-2 font-medium">Data</th>
                      <th className="pb-2 font-medium text-right">Valor</th>
                      <th className="pb-2 font-medium text-right">Cashback</th>
                      <th className="pb-2 font-medium">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeData.recent_transactions.map((transaction: Transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-3">{transaction.store_name || 'N/A'}</td>
                        <td className="py-3">
                          {(() => {
                            try {
                              return format(new Date(transaction.created_at), "dd/MM/yyyy", { locale: ptBR });
                            } catch (error) {
                              return 'Data inválida';
                            }
                          })()}
                        </td>
                        <td className="py-3 text-right">{formatSafeAmount(transaction.amount)}</td>
                        <td className="py-3 text-right text-green-600">
                          {formatSafeAmount(transaction.cashback_amount)}
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {transaction.description || 'Transação'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações e Dicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações e Dicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start p-3 bg-secondary/10 rounded-lg">
              <Tag className="text-secondary mt-1 mr-3 h-5 w-5" />
              <div>
                <h4 className="font-medium">Como Funciona o Vale Cashback</h4>
                <p className="text-sm text-muted-foreground">
                  Em cada compra que você faz, recebe 2% de volta como cashback. Indique amigos e ganhe 1% do valor de compras deles.
                </p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-accent/10 rounded-lg">
              <Gift className="text-accent mt-1 mr-3 h-5 w-5" />
              <div>
                <h4 className="font-medium">Acompanhe seu Saldo</h4>
                <p className="text-sm text-muted-foreground">
                  Monitore seus ganhos de cashback em tempo real e veja o crescimento do seu saldo.
                </p>
              </div>
            </div>
            
            {/* Botão de instalação */}
            <div className="flex items-start p-3 bg-primary/10 rounded-lg">
              <Download className="text-primary mt-1 mr-3 h-5 w-5" />
              <div className="flex-1">
                <h4 className="font-medium">Instalar App</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Instale o app para ter acesso rápido ao seu cashback.
                </p>
                <InstallButton />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}