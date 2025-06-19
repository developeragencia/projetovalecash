import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart as BarChartIcon,
  DollarSign,
  Wallet,
  CreditCard,
  Percent,
  Users,
  Loader2,
  FileDown,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  PieChart, 
  Pie, 
  Cell,
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WithdrawalModal } from "@/components/merchant/withdrawal-modal";
import { useTranslation } from "@/hooks/use-translation";
import { formatCurrency } from "@/lib/utils";

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function MerchantSalaries() {
  const [activeTab, setActiveTab] = useState("earnings");
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const { t } = useTranslation();
  
  // Query para buscar os dados financeiros e salários do lojista
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/merchant/salaries'],
    placeholderData: {
      // Dados de ganhos (comissões e vendas)
      earnings: {
        totalSales: 12850.75,
        totalCommissions: 257.02,
        platformFee: 642.54,
        netEarnings: 11951.19,
        pendingPayouts: 1200.00,
        payoutHistory: [
          { 
            id: 1, 
            date: "2025-05-01", 
            amount: 1850.75, 
            status: "completed", 
            fees: 92.54,
            netAmount: 1758.21,
            method: "Bank Transfer"
          },
          { 
            id: 2, 
            date: "2025-04-01", 
            amount: 2200.50, 
            status: "completed", 
            fees: 110.03,
            netAmount: 2090.47,
            method: "Bank Transfer"
          },
          { 
            id: 3, 
            date: "2025-03-01", 
            amount: 1750.25, 
            status: "completed", 
            fees: 87.51,
            netAmount: 1662.74,
            method: "Bank Transfer"
          }
        ]
      },
      // Dados de taxas aplicadas - CORRIGIDO
      fees: {
        platformFee: 0.05, // 5% taxa da plataforma
        merchantCommission: 0.00, // 0% - REMOVIDO do novo modelo
        clientCashback: 0.02, // 2% cashback para o cliente
        referralBonus: 0.01, // 1% bônus de indicação
        withdrawalFee: 0.05, // 5% taxa de saque
        // Exemplos de cálculos de taxas para uma venda
        sampleCalculation: {
          saleAmount: 1000.00,
          platformFee: 50.00, // 5% de 1000
          merchantCommission: 0.00, // REMOVIDO - 0% de 1000
          clientCashback: 20.00, // 2% de 1000
          referralBonus: 10.00, // 1% de 1000
          netAmount: 900.00, // Valor líquido após taxa da plataforma
          withdrawalFeeExample: 18.00 // 2% de 900 (se sacar)
        },
        // Histórico de taxas aplicadas
        recentFees: [
          { 
            date: "2025-05-15", 
            transactionType: "Sale", 
            amount: 350.75, 
            platformFee: 17.54, 
            description: "Taxa de plataforma (5%)" 
          },
          { 
            date: "2025-05-14", 
            transactionType: "Sale", 
            amount: 420.25, 
            platformFee: 21.01, 
            description: "Taxa de plataforma (5%)" 
          },
          { 
            date: "2025-05-12", 
            transactionType: "Withdrawal", 
            amount: 1200.00, 
            platformFee: 24.00, 
            description: "Taxa do lojista (2%)" 
          }
        ]
      },
      // Relatório detalhado de vendas e taxas
      transactions: {
        recentTransactions: [
          { 
            id: 1, 
            date: "2025-05-15", 
            customer: "Maria Silva", 
            amount: 350.75, 
            platformFee: 17.54, 
            cashback: 7.02, 
            commission: 7.02, 
            referralBonus: 3.51, 
            netAmount: 333.21,
            method: "Credit Card"
          },
          { 
            id: 2, 
            date: "2025-05-14", 
            customer: "João Santos", 
            amount: 420.25, 
            platformFee: 21.01, 
            cashback: 8.41, 
            commission: 8.41, 
            referralBonus: 4.20, 
            netAmount: 399.24,
            method: "PIX"
          },
          { 
            id: 3, 
            date: "2025-05-12", 
            customer: "Ana Oliveira", 
            amount: 275.00, 
            platformFee: 13.75, 
            cashback: 5.50, 
            commission: 5.50, 
            referralBonus: 2.75, 
            netAmount: 261.25,
            method: "Debit Card"
          }
        ],
        feeDistribution: [
          { name: "Valor Líquido", value: 11951.19 },
          { name: "Taxa da Plataforma", value: 642.54 },
          { name: "Cashback ao Cliente", value: 257.02 },
          { name: "Bônus de Indicação", value: 128.51 }
        ]
      }
    }
  });
  
  // Usamos a função de formatação importada do utils.ts
  // Definimos uma função auxiliar para garantir que os valores sejam tratados corretamente
  const ensureNumber = (value: number | string | null | undefined): number => {
    if (value === null || value === undefined) {
      return 0;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return isNaN(value) ? 0 : value;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  
  // Estado de carregamento
  if (isLoading) {
    return (
      <DashboardLayout title="Comissões e Taxas" type="merchant">
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <DashboardLayout title="Comissões e Taxas" type="merchant">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar os dados</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados financeiros. Por favor, tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Comissões e Taxas" type="merchant">
      {/* Modal de solicitação de saque */}
      <WithdrawalModal 
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        availableBalance={data?.earnings.netEarnings || 0}
        withdrawalFee={data?.fees.withdrawalFee || 0.05}
      />
      
      <Tabs defaultValue="earnings" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="earnings">
              <Wallet className="h-4 w-4 mr-2" />
              Ganhos e Saques
            </TabsTrigger>
            <TabsTrigger value="fees">
              <Percent className="h-4 w-4 mr-2" />
              Taxas
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <BarChartIcon className="h-4 w-4 mr-2" />
              Transações Detalhadas
            </TabsTrigger>
          </TabsList>
          
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
        
        {/* Tab de Ganhos e Saques */}
        <TabsContent value="earnings">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(ensureNumber(data?.earnings.totalSales))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  No período atual
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Comissões Ganhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(ensureNumber(data?.earnings.totalCommissions))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  2% sobre o total de vendas
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Taxa da Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(ensureNumber(data?.earnings.platformFee))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  5% sobre o total de vendas
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ganhos Líquidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(ensureNumber(data?.earnings.netEarnings))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Após taxas e comissões
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Saques Pendentes & Histórico</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setIsWithdrawalModalOpen(true)}>
                    Solicitar Saque
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-xl font-medium mb-1">Valor Disponível para Saque</div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(ensureNumber(data?.earnings.pendingPayouts))}
                  </div>
                </div>
                
                <h3 className="font-medium mb-4 text-lg">Histórico de Saques</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor Bruto</TableHead>
                      <TableHead>Taxa (5%)</TableHead>
                      <TableHead>Valor Líquido</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.earnings.payoutHistory.map((payout, index) => (
                      <TableRow key={index}>
                        <TableCell>{payout.date}</TableCell>
                        <TableCell>{formatCurrency(payout.amount)}</TableCell>
                        <TableCell className="text-orange-600">-{formatCurrency(payout.fees)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payout.netAmount)}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(payout.status)}`}>
                            {payout.status === "completed" ? "Completo" : 
                            payout.status === "pending" ? "Pendente" : "Falhou"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tab de Taxas */}
        <TabsContent value="fees">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Estrutura de Taxas</CardTitle>
                <CardDescription>
                  Detalhamento das taxas aplicadas no sistema Vale Cashback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <Percent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Taxa da Plataforma</div>
                        <div className="text-sm text-muted-foreground">
                          Aplicada sobre o valor total da venda
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold">
                      {(data?.fees.platformFee || 0) * 100}%
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Comissão de Lojista removida do novo modelo */}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Cashback ao Cliente</div>
                        <div className="text-sm text-muted-foreground">
                          Retorno em dinheiro para o cliente
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold">
                      {(data?.fees.clientCashback || 0) * 100}%
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Bônus de Indicação</div>
                        <div className="text-sm text-muted-foreground">
                          Pago para quem indicou o cliente
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold">
                      {(data?.fees.referralBonus || 0) * 100}%
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Taxa do Lojista removida - não aplicamos mais taxas sobre saques */}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Exemplo de Cálculo</CardTitle>
                <CardDescription>
                  Como as taxas são aplicadas em uma venda de {formatCurrency(data?.fees.sampleCalculation.saleAmount || 0)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Valor da Venda</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span>Valor Bruto:</span>
                        <span className="font-bold">
                          {formatCurrency(data?.fees.sampleCalculation.saleAmount || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Distribuição de Valores</h3>
                    <div className="space-y-2">
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Percent className="h-4 w-4 mr-2 text-orange-600" />
                            <span>Taxa da Plataforma (5%):</span>
                          </div>
                          <span className="font-medium text-orange-600">
                            -{formatCurrency(data?.fees.sampleCalculation.platformFee || 0)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Comissão do Lojista removida do novo modelo */}
                      
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            <span>Cashback ao Cliente (2%):</span>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(data?.fees.sampleCalculation.clientCashback || 0)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>Bônus de Indicação (1%):</span>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(data?.fees.sampleCalculation.referralBonus || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Resultado Final</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span>Valor Líquido após Taxa:</span>
                        <span className="font-bold">
                          {formatCurrency(data?.fees.sampleCalculation.netAmount || 0)}
                        </span>
                      </div>
                      {/* Taxa do Lojista removida - novo modelo não cobra taxa sobre saques */}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Taxas Aplicadas</CardTitle>
              <CardDescription>
                Taxas recentes aplicadas às suas transações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor da Transação</TableHead>
                    <TableHead>Taxa Aplicada</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.fees.recentFees.map((fee, index) => (
                    <TableRow key={index}>
                      <TableCell>{fee.date}</TableCell>
                      <TableCell>
                        <Badge variant={fee.transactionType === "Sale" ? "outline" : "secondary"}>
                          {fee.transactionType === "Sale" ? "Venda" : "Saque"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(fee.amount)}</TableCell>
                      <TableCell className="text-orange-600">
                        -{formatCurrency(fee.platformFee)}
                      </TableCell>
                      <TableCell>{fee.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Transações Detalhadas */}
        <TabsContent value="transactions">
          <div className="grid md:grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Valores</CardTitle>
                <CardDescription>
                  Como o valor das vendas é distribuído entre as partes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.transactions.feeDistribution || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {data?.transactions.feeDistribution?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip formatter={(value) => [`$${parseFloat(value.toString()).toFixed(2)}`, 'Valor']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    <h3 className="text-lg font-medium mb-4">Resumo da Distribuição</h3>
                    <div className="space-y-3">
                      {data?.transactions.feeDistribution?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-2" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span>{item.name}</span>
                          </div>
                          <div className="font-medium">
                            {formatCurrency(item.value)}
                          </div>
                        </div>
                      )) || (
                        <div className="text-muted-foreground">
                          Não há dados disponíveis para mostrar
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Análise de Vendas por Período</CardTitle>
                <CardDescription>
                  Visualize o histórico de vendas e comissões ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 300 }}>
                  {data?.transactions?.recentTransactions && data?.transactions?.recentTransactions.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data?.transactions?.recentTransactions || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${parseFloat(value.toString()).toFixed(2)}`, 'Valor']} />
                        <Legend />
                        <Bar dataKey="amount" name="Valor da Venda" fill="#0088FE" />
                        <Bar dataKey="commission" name="Comissão (2%)" fill="#00C49F" />
                        <Bar dataKey="platformFee" name="Taxa da Plataforma (5%)" fill="#FF8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground text-center">
                        Não há dados suficientes para mostrar o gráfico.
                        <br />
                        Realize transações para visualizar o histórico.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Transações Recentes com Detalhamento de Taxas</CardTitle>
                <CardDescription>
                  Visualize como as taxas são aplicadas em cada transação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data?.transactions?.recentTransactions && data?.transactions?.recentTransactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Taxa (5%)</TableHead>
                        <TableHead>Cashback (2%)</TableHead>
                        <TableHead>Comissão (2%)</TableHead>
                        <TableHead>Indicação (1%)</TableHead>
                        <TableHead>Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.transactions?.recentTransactions.map((tx, index) => (
                        <TableRow key={index}>
                          <TableCell>{tx.date}</TableCell>
                          <TableCell>{tx.customer}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tx.method}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                          <TableCell className="text-orange-600">-{formatCurrency(tx.platformFee)}</TableCell>
                          <TableCell>{formatCurrency(tx.cashback)}</TableCell>
                          <TableCell className="text-green-600">+{formatCurrency(tx.commission)}</TableCell>
                          <TableCell>{formatCurrency(tx.referralBonus)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(tx.netAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground text-center mb-4">
                      Não há transações para mostrar.
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                      Quando você realizar transações, elas aparecerão aqui com o detalhamento das taxas.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}