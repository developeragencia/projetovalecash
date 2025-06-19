import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { BarChartComponent } from "@/components/ui/charts";
import { ShoppingCart, DollarSign, Users, Percent, Eye, AlertCircle, QrCode } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { formatSafeDate } from "@/lib/date-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Interfaces para tipagem
interface DashboardData {
  salesSummary: {
    today: {
      total: number;
      transactions: number;
      average: number;
      commission: number;
    }
  };
  weekSalesData: Array<{
    day: string;
    value: number;
  }>;
  recentSales: Array<{
    id: number;
    customer: string;
    date: string;
    amount: number;
    cashback: number;
    items: string;
  }>;
  topProducts: Array<{
    name: string;
    sales: number;
    total: number;
  }>;
}

export default function MerchantDashboard() {
  // Query to get merchant dashboard data
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/merchant/dashboard'],
    refetchOnWindowFocus: false, // Evitar requisições em excesso
    staleTime: 30000, // Dados são considerados atualizados por 30 segundos
    retry: 1, // Limitar o número de tentativas para evitar loop infinito
    queryFn: async () => {
      try {
        console.log("Carregando dados do dashboard do lojista...");
        const response = await fetch('/api/merchant/dashboard', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.error("Erro na API do dashboard:", await response.text());
          throw new Error("Erro ao carregar dados do dashboard");
        }
        
        // Processa dados da API
        const apiData = await response.json();
        console.log("Dados brutos recebidos:", apiData);
        
        // Função para garantir que os valores sejam números válidos
        const ensureNumeric = (value: any): number => {
          if (value === null || value === undefined) return 0;
          
          if (typeof value === 'string') {
            // Remover caracteres não numéricos exceto ponto decimal
            const cleanValue = value.replace(/[$,\s]/g, '');
            return parseFloat(cleanValue) || 0;
          }
          
          return typeof value === 'number' ? (isNaN(value) ? 0 : value) : 0;
        };

        // Função para formatação segura de datas
        const formatDateSafe = (dateValue: any): string => {
          return formatSafeDate(dateValue, 'short');
        };
        
        // Estrutura esperada com valores convertidos para números
        console.log("Dados formatados para o dashboard:", {
          salesSummary: apiData.salesSummary,
          recentSales: apiData.recentSales,
          weekSalesData: apiData.weekSalesData
        });

        return {
          salesSummary: {
            today: {
              total: ensureNumeric(apiData.salesSummary?.today?.total),
              transactions: ensureNumeric(apiData.salesSummary?.today?.transactions),
              average: ensureNumeric(apiData.salesSummary?.today?.average),
              commission: ensureNumeric(apiData.salesSummary?.today?.commission)
            }
          },
          weekSalesData: (apiData.weekSalesData || []).map((item: any) => ({
            day: item.day || '',
            value: ensureNumeric(item.value)
          })),
          recentSales: (apiData.recentSales || []).map((sale: any) => ({
            id: sale.id || 0,
            customer: sale.customer || 'Cliente',
            date: formatDateSafe(sale.date),
            amount: ensureNumeric(sale.amount),
            cashback: ensureNumeric(sale.cashback),
            items: sale.items || '0'
          })),
          topProducts: (apiData.topProducts || []).map((product: any) => ({
            name: product.name || 'Produto',
            sales: ensureNumeric(product.sales),
            total: ensureNumeric(product.total)
          }))
        };
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        // Retornar dados vazios em caso de erro
        return {
          salesSummary: {
            today: {
              total: 0,
              transactions: 0,
              average: 0,
              commission: 0
            }
          },
          weekSalesData: [],
          recentSales: [],
          topProducts: []
        };
      }
    }
  });
  
  // Dados vazios para uso enquanto API não retorna
  const dashboardData = data || {
    salesSummary: {
      today: {
        total: 0,
        transactions: 0,
        average: 0,
        commission: 0
      }
    },
    weekSalesData: [],
    recentSales: [],
    topProducts: []
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" type="merchant">
        <div className="flex items-center justify-center h-full">
          <p>Carregando dados do dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard" type="merchant">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados do dashboard. Por favor, tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" type="merchant">
      {/* Cards de estatísticas com design moderno */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Vendas Hoje</p>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{formatCurrency(dashboardData.salesSummary.today.total)}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  {dashboardData.salesSummary.today.transactions} transações
                </p>
              </div>
              <div className="rounded-full p-3 bg-green-100 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-green-500 to-green-300"></div>
        </div>
        
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Ticket Médio</p>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{formatCurrency(dashboardData.salesSummary.today.average)}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                  Por transação
                </p>
              </div>
              <div className="rounded-full p-3 bg-blue-100 text-blue-600">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-300"></div>
        </div>
        
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Comissão</p>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{formatCurrency(dashboardData.salesSummary.today.commission)}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1"></span>
                  Taxa sobre vendas
                </p>
              </div>
              <div className="rounded-full p-3 bg-purple-100 text-purple-600">
                <Percent className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-purple-300"></div>
        </div>
        
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Clientes</p>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{dashboardData.recentSales.length}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
                  Atendidos hoje
                </p>
              </div>
              <div className="rounded-full p-3 bg-amber-100 text-amber-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-amber-300"></div>
        </div>
      </div>

      {/* Gráficos e tabelas com design moderno */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Vendas da Semana</h3>
              <div className="bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-600">Últimos 7 dias</div>
            </div>
            <div className="px-2">
              <BarChartComponent 
                title=""
                data={dashboardData.weekSalesData} 
                bars={[{ dataKey: "value", name: "Valor", fill: "#3b82f6" }]}
                xAxisDataKey="day"
                height={300} 
              />
            </div>
          </div>
        </div>
        
        <div className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Últimas Vendas</h3>
              <div className="bg-green-100 rounded-full px-3 py-1 text-xs font-medium text-green-600">
                {dashboardData.recentSales.length} vendas
              </div>
            </div>
            <div className="divide-y">
              {dashboardData.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center py-3 transition-colors hover:bg-gray-50 rounded-lg px-2">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                    {sale.customer.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-gray-800">{sale.customer}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.date).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(sale.amount)}</p>
                    <p className="text-xs text-green-600">+{formatCurrency(sale.cashback)} cashback</p>
                  </div>
                </div>
              ))}
              {dashboardData.recentSales.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500">Nenhuma venda recente encontrada.</p>
                  <p className="text-xs text-gray-400 mt-1">As vendas aparecerão aqui automaticamente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Produtos e ações rápidas */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Produtos Mais Vendidos</h3>
              <Link href="/merchant/products">
                <Button variant="outline" size="sm" className="h-8 rounded-full hover:bg-gray-100 text-gray-700 border-gray-200">
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Ver Todos
                </Button>
              </Link>
            </div>
            <div className="divide-y">
              {dashboardData.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center py-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-3">
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-gray-800">{product.name}</p>
                    <div className="flex items-center">
                      <div className="h-1.5 w-16 bg-gray-100 rounded-full mr-2">
                        <div 
                          className="h-1.5 bg-green-500 rounded-full" 
                          style={{ width: `${Math.min(100, (product.sales / 10) * 100)}%` }} 
                        />
                      </div>
                      <p className="text-xs text-gray-500">{product.sales} vendas</p>
                    </div>
                  </div>
                  <div className="text-right font-medium text-gray-800">{formatCurrency(product.total)}</div>
                </div>
              ))}
              {dashboardData.topProducts.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500">Nenhum produto vendido ainda.</p>
                  <p className="text-xs text-gray-400 mt-1">Cadastre seus produtos e comece a vender</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Ações Rápidas</h3>
            <div className="grid gap-4">
              <Link href="/merchant/sales">
                <Button className="w-full h-14 rounded-xl bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white border-none">
                  <DollarSign className="mr-2 h-5 w-5" />
                  <span className="text-base">Nova Venda</span>
                </Button>
              </Link>
              
              <div className="grid grid-cols-2 gap-4">
                <Link href="/merchant/payment-qr">
                  <Button variant="outline" className="w-full h-12 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                    <QrCode className="mr-2 h-4 w-4" />
                    <span>Gerar QR Code</span>
                  </Button>
                </Link>
                
                <Link href="/merchant/products">
                  <Button variant="outline" className="w-full h-12 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    <span>Produtos</span>
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Link href="/merchant/transactions">
                  <Button variant="outline" className="w-full h-12 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Transações</span>
                  </Button>
                </Link>
                
                <Link href="/merchant/withdrawals">
                  <Button variant="outline" className="w-full h-12 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Sacar</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}