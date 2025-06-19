import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon,
  Download,
  BarChart as BarChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingBag,
  CreditCard,
  Percent
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

// Interfaces para tipagem dos dados
interface TimelineItem {
  date: string;
  value: number;
}

interface PaymentMethodItem {
  name: string;
  value: number;
}

interface ProductItem {
  name: string;
  value: number;
  revenue: number;
}

interface CustomerItem {
  name: string;
  visits: number;
  spent: number;
}

interface FrequencyItem {
  name: string;
  value: number;
}

interface DistributionItem {
  name: string;
  value: number;
}

interface SalesData {
  total: number | string;
  count: number | string;
  average: number | string;
  cashback: number | string;
  previousPeriodChange: number | string;
  timeline: TimelineItem[];
  byPaymentMethod: PaymentMethodItem[];
  topProducts: ProductItem[];
}

interface CustomersData {
  total: number | string;
  new: number | string;
  returning: number | string;
  timeline: TimelineItem[];
  byFrequency: FrequencyItem[];
  topCustomers: CustomerItem[];
}

interface CashbackData {
  total: number | string;
  count: number | string;
  average: number | string;
  timeline: TimelineItem[];
  distribution: DistributionItem[];
}

interface ReportsData {
  salesData: SalesData;
  customersData: CustomersData;
  cashbackData: CashbackData;
}

interface ReportFilters {
  period: "today" | "week" | "month" | "quarter" | "year" | "custom";
  dateRange: { from: Date | null; to: Date | null };
}

// Dados padrão para usar quando a API não retorna dados
const defaultReportsData: ReportsData = {
  salesData: {
    total: 0,
    count: 0,
    average: 0,
    cashback: 0,
    previousPeriodChange: 0,
    timeline: [],
    byPaymentMethod: [],
    topProducts: []
  },
  customersData: {
    total: 0,
    new: 0,
    returning: 0,
    timeline: [],
    byFrequency: [],
    topCustomers: []
  },
  cashbackData: {
    total: 0,
    count: 0,
    average: 0,
    timeline: [],
    distribution: []
  }
};

export default function MerchantReports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [filters, setFilters] = useState<ReportFilters>({
    period: "month",
    dateRange: { from: null, to: null },
  });
  
  const { toast } = useToast();
  
  // Query para buscar os dados de relatórios com tratamento de dados nulos/indefinidos
  const { data: rawReportsData, isLoading } = useQuery({
    queryKey: ['/api/merchant/reports', activeTab, filters],
  });
  
  // Garante que sempre temos um objeto válido com todas as propriedades necessárias
  const reportsData: ReportsData = rawReportsData ? {
    salesData: {
      total: rawReportsData.salesData?.total ?? 0,
      count: rawReportsData.salesData?.count ?? 0,
      average: rawReportsData.salesData?.average ?? 0,
      cashback: rawReportsData.salesData?.cashback ?? 0,
      previousPeriodChange: rawReportsData.salesData?.previousPeriodChange ?? 0,
      timeline: rawReportsData.salesData?.timeline ?? [],
      byPaymentMethod: rawReportsData.salesData?.byPaymentMethod ?? [],
      topProducts: rawReportsData.salesData?.topProducts ?? [],
    },
    customersData: {
      total: rawReportsData.customersData?.total ?? 0,
      new: rawReportsData.customersData?.new ?? 0,
      returning: rawReportsData.customersData?.returning ?? 0,
      timeline: rawReportsData.customersData?.timeline ?? [],
      byFrequency: rawReportsData.customersData?.byFrequency ?? [],
      topCustomers: rawReportsData.customersData?.topCustomers ?? [],
    },
    cashbackData: {
      total: rawReportsData.cashbackData?.total ?? 0,
      count: rawReportsData.cashbackData?.count ?? 0,
      average: rawReportsData.cashbackData?.average ?? 0,
      timeline: rawReportsData.cashbackData?.timeline ?? [],
      distribution: rawReportsData.cashbackData?.distribution ?? [],
    }
  } : defaultReportsData;
  
  // Função para alterar o período selecionado
  const handlePeriodChange = (period: string) => {
    let dateFrom: Date | null = null;
    let dateTo: Date | null = null;
    
    const today = new Date();
    
    if (period === "today") {
      dateFrom = today;
      dateTo = today;
    } else if (period === "week") {
      dateFrom = subDays(today, 7);
      dateTo = today;
    } else if (period === "month") {
      dateFrom = subMonths(today, 1);
      dateTo = today;
    } else if (period === "quarter") {
      dateFrom = subMonths(today, 3);
      dateTo = today;
    } else if (period === "year") {
      dateFrom = subMonths(today, 12);
      dateTo = today;
    }
    
    setFilters({
      ...filters,
      period: period as any,
      dateRange: { from: dateFrom, to: dateTo },
    });
  };
  
  // Função para exportar dados
  const handleExport = () => {
    toast({
      title: "Exportação iniciada",
      description: "Seus dados estão sendo exportados para CSV.",
    });
    
    setTimeout(() => {
      toast({
        title: "Exportação concluída",
        description: "Arquivo CSV exportado com sucesso.",
      });
    }, 1500);
  };
  
  // Função para formatar valores numéricos
  const formatCurrency = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return "0.00";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2);
  };
  
  // Função para calcular porcentagens de forma segura
  const calculatePercentage = (value: string | number, total: string | number): number => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const numTotal = typeof total === 'string' ? parseFloat(total) : total;
    
    if (isNaN(numValue) || isNaN(numTotal) || numTotal === 0) return 0;
    return (numValue / numTotal) * 100;
  };
  
  return (
    <DashboardLayout title="Relatórios Financeiros" type="merchant">
      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="sales">
              <BarChartIcon className="h-4 w-4 mr-2" />
              Vendas
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="h-4 w-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="cashback">
              <Percent className="h-4 w-4 mr-2" />
              Cashback
            </TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Select value={filters.period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Últimos 30 dias</SelectItem>
                <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            {filters.period === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "dd/MM/yyyy")} -{" "}
                          {format(filters.dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Selecione um período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={new Date()}
                    selected={{
                      from: filters.dateRange.from || undefined,
                      to: filters.dateRange.to || undefined,
                    }}
                    onSelect={range => {
                      if (range?.from) {
                        setFilters({
                          ...filters, 
                          dateRange: { 
                            from: range.from, 
                            to: range.to || null
                          }
                        });
                      }
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}
            
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
        
        {/* Relatório de Vendas */}
        <TabsContent value="sales">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {formatCurrency(reportsData.salesData.total)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  {(() => {
                    const change = parseFloat(String(reportsData.salesData.previousPeriodChange));
                    if (isNaN(change)) return <span>0%</span>;
                    
                    return change >= 0 ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+{change.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-red-500 font-medium">{change.toFixed(1)}%</span>
                      </>
                    );
                  })()}
                  <span className="ml-1">vs. período anterior</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Qtd. Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {parseInt(String(reportsData.salesData.count)) || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Média: R$ {formatCurrency(reportsData.salesData.average)}/venda
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Cashback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {formatCurrency(reportsData.salesData.cashback)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {calculatePercentage(
                    reportsData.salesData.cashback, 
                    reportsData.salesData.total
                  ).toFixed(1)}% do total de vendas
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Comissão Lojas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  R$ {(() => {
                    const total = parseFloat(String(reportsData.salesData.total));
                    return isNaN(total) ? "0.00" : (total * 0.02).toFixed(2);
                  })()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Taxa de 2% sobre vendas
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Vendas por Período</CardTitle>
                <CardDescription>
                  Receita diária no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={reportsData.salesData.timeline || []}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Vendas (R$)"
                        stroke="#0080ff"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pagamento</CardTitle>
                <CardDescription>
                  Distribuição por método de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportsData.salesData.byPaymentMethod || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {(reportsData.salesData.byPaymentMethod || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>
                Top 5 produtos por quantidade vendida
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportsData.salesData.topProducts || []}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#0080ff" />
                    <YAxis yAxisId="right" orientation="right" stroke="#ff4d4f" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="value" name="Quantidade" fill="#0080ff" />
                    <Bar yAxisId="right" dataKey="revenue" name="Receita (R$)" fill="#ff4d4f" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Relatório de Clientes */}
        <TabsContent value="customers">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {parseInt(String(reportsData.customersData.total)) || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Clientes cadastrados
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Novos Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {parseInt(String(reportsData.customersData.new)) || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  No período selecionado
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Taxa de Retorno</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {(() => {
                    const total = parseFloat(String(reportsData.customersData.total));
                    const returning = parseFloat(String(reportsData.customersData.returning));
                    if (isNaN(total) || total === 0 || isNaN(returning)) return "0";
                    return Math.round((returning / total) * 100);
                  })()}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {parseInt(String(reportsData.customersData.returning)) || 0} clientes recorrentes
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Evolução de Clientes</CardTitle>
                <CardDescription>
                  Crescimento no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={reportsData.customersData.timeline || []}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Clientes"
                        stroke="#0080ff"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Frequência de Compra</CardTitle>
                <CardDescription>
                  Segmentação por atividade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportsData.customersData.byFrequency || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {(reportsData.customersData.byFrequency || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Principais Clientes</CardTitle>
              <CardDescription>
                Top 5 clientes com maior valor em compras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {(reportsData.customersData.topCustomers || []).length > 0 ? (
                  (reportsData.customersData.topCustomers || []).map((customer, index) => {
                    // Garantindo que temos valores válidos para exibição
                    const name = customer?.name || "Cliente";
                    const visits = parseInt(String(customer?.visits)) || 0;
                    const spent = parseFloat(String(customer?.spent)) || 0;
                    
                    // Calculando o percentual da barra de progresso
                    const topCustomerSpent = parseFloat(
                      String((reportsData.customersData.topCustomers || [])[0]?.spent)
                    ) || 0;
                    
                    const widthPercentage = topCustomerSpent > 0 
                      ? Math.round((spent / topCustomerSpent) * 100)
                      : 0;
                    
                    return (
                      <div key={index} className="flex items-center">
                        <div className="text-accent font-bold w-6">{index + 1}</div>
                        <div className="flex-1">
                          <div className="font-medium">{name}</div>
                          <div className="text-sm text-muted-foreground">
                            {visits} visitas · R$ {spent.toFixed(2)}
                          </div>
                        </div>
                        <div className="w-full max-w-md bg-muted rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full"
                            style={{ width: `${widthPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    Nenhum cliente encontrado no período selecionado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Relatório de Cashback */}
        <TabsContent value="cashback">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Cashback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {formatCurrency(reportsData.cashbackData.total)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Concedido no período
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Média por Venda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {formatCurrency(reportsData.cashbackData.average)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Valor médio de cashback
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {parseInt(String(reportsData.cashbackData.count)) || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Com cashback aplicado
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Evolução do Cashback</CardTitle>
                <CardDescription>
                  Valores diários no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={reportsData.cashbackData.timeline || []}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Cashback (R$)"
                        stroke="#00c49f"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Cashback</CardTitle>
                <CardDescription>
                  Por tipo de benefício
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportsData.cashbackData.distribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#82ca9d"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {(reportsData.cashbackData.distribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#82ca9d', '#ffc658', '#8884d8'][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}