import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FileSpreadsheet, 
  Download, 
  Filter,
  TrendingUp,
  Users,
  Store,
  DollarSign,
  Calendar,
  BarChart3,
  RefreshCw,
  Eye,
  Trash2
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatSafeDate } from "@/lib/date-utils";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ReportFilters {
  startDate: string;
  endDate: string;
  merchantId?: string;
  status: string;
  reportType: 'transactions' | 'merchants' | 'customers';
}

interface ReportData {
  transactions?: any[];
  merchants?: any[];
  customers?: any[];
  summary?: {
    totalTransactions: number;
    totalAmount: number;
    totalCashback: number;
    platformRevenue: number;
  };
}

export default function AdminReports() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'all',
    reportType: 'transactions'
  });
  
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reportData, isLoading, refetch, error } = useQuery({
    queryKey: ['/api/admin/reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('type', filters.reportType);
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('status', filters.status);
      if (filters.merchantId) params.append('merchantId', filters.merchantId);

      const response = await apiRequest('GET', `/api/admin/reports?${params}`);
      return response.json();
    },
    retry: 1,
    staleTime: 2 * 60 * 1000
  });

  const { data: merchants } = useQuery({
    queryKey: ['/api/admin/merchants-simple'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/merchants?status=approved&simple=true');
        return response.json();
      } catch (error) {
        console.error('Erro ao buscar merchants:', error);
        return [];
      }
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      await apiRequest('DELETE', `/api/admin/transactions/${transactionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir transação",
        variant: "destructive",
      });
    }
  });

  const exportReport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();
      params.append('type', filters.reportType);
      params.append('format', format);
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('status', filters.status);
      if (filters.merchantId) params.append('merchantId', filters.merchantId);

      const response = await fetch(`/api/admin/reports/export?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao exportar relatório');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${filters.reportType}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  const getSummaryStats = () => {
    if (!reportData) return null;

    if (reportData.summary) {
      return reportData.summary;
    }

    // Fallback calculation from transactions
    const transactions = reportData.transactions || reportData || [];
    if (!Array.isArray(transactions)) return null;

    const total = transactions.reduce((sum: number, item: any) => sum + (parseFloat(item.amount || item.total_amount) || 0), 0);
    const totalCashback = transactions.reduce((sum: number, item: any) => sum + (parseFloat(item.cashback_amount) || 0), 0);
    const platformRevenue = total * 0.05;

    return {
      totalTransactions: transactions.length,
      totalAmount: total,
      totalCashback,
      platformRevenue
    };
  };

  const stats = getSummaryStats();

  const renderTransactionsTable = (transactions: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Loja</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Cashback</TableHead>
          <TableHead>Taxa Plataforma</TableHead>
          <TableHead>Lojista Recebe</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction: any) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-mono">#{transaction.id}</TableCell>
            <TableCell>
              {formatSafeDate(transaction.created_at, 'datetime')}
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{transaction.client_name || 'Cliente não identificado'}</div>
                <div className="text-sm text-muted-foreground">ID: {transaction.user_id || 'N/A'}</div>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{transaction.merchant_name || 'Loja não identificada'}</div>
                <div className="text-sm text-muted-foreground">ID: {transaction.merchant_id || 'N/A'}</div>
              </div>
            </TableCell>
            <TableCell className="font-semibold">
              {formatCurrency(transaction.amount || transaction.total_amount || 0)}
            </TableCell>
            <TableCell className="font-semibold text-green-600">
              {formatCurrency(transaction.cashback_amount || 0)}
            </TableCell>
            <TableCell className="font-semibold text-blue-600">
              {formatCurrency(parseFloat(transaction.platform_fee || (parseFloat(transaction.amount || transaction.total_amount || 0) * 0.05)))}
            </TableCell>
            <TableCell className="font-semibold text-orange-600">
              {formatCurrency(parseFloat(transaction.merchant_receives || (parseFloat(transaction.amount || transaction.total_amount || 0) * 0.95)))}
            </TableCell>
            <TableCell>
              <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                {transaction.status === 'completed' ? 'Concluída' : 
                 transaction.status === 'pending' ? 'Pendente' : 
                 transaction.status || 'Desconhecido'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Detalhes da Transação #{transaction.id}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Data e Hora</Label>
                          <p className="text-sm">{formatSafeDate(transaction.created_at, 'datetime')}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Status</Label>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="ml-2">
                            {transaction.status === 'completed' ? 'Concluída' : 
                             transaction.status === 'pending' ? 'Pendente' : 
                             transaction.status || 'Desconhecido'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Cliente</Label>
                          <p className="text-sm">{transaction.client_name || 'Cliente não identificado'}</p>
                          <p className="text-xs text-muted-foreground">ID: {transaction.user_id || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Loja</Label>
                          <p className="text-sm">{transaction.merchant_name || 'Loja não identificada'}</p>
                          <p className="text-xs text-muted-foreground">ID: {transaction.merchant_id || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Valor da Transação</Label>
                          <p className="text-lg font-bold">{formatCurrency(transaction.amount || transaction.total_amount || 0)}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Cashback ao Cliente</Label>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(transaction.cashback_amount || 0)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Taxa da Plataforma (5%)</Label>
                          <p className="text-lg font-bold text-blue-600">{formatCurrency((parseFloat(transaction.amount || transaction.total_amount || 0) * 0.05))}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Lojista Recebe</Label>
                          <p className="text-lg font-bold text-orange-600">{formatCurrency((parseFloat(transaction.amount || transaction.total_amount || 0) * 0.95))}</p>
                        </div>
                      </div>
                      {transaction.description && (
                        <div>
                          <Label className="font-semibold">Descrição</Label>
                          <p className="text-sm">{transaction.description}</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a transação #{transaction.id}?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Relatórios do Sistema" type="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando relatórios...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Relatórios do Sistema" type="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios do Sistema</h1>
            <p className="text-muted-foreground mt-1">
              Análise detalhada e exportação de dados do sistema
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => exportReport('csv')} className="w-full sm:w-auto">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => exportReport('json')} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Exportar JSON
            </Button>
          </div>
        </div>

        <Separator />

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="reportType">Tipo de Relatório</Label>
                <Select 
                  value={filters.reportType} 
                  onValueChange={(value: any) => setFilters(prev => ({ ...prev, reportType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactions">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Transações
                      </div>
                    </SelectItem>
                    <SelectItem value="merchants">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Comerciantes
                      </div>
                    </SelectItem>
                    <SelectItem value="customers">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Clientes
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="completed">Concluídas</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filters.reportType === 'transactions' && merchants && merchants.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <Label htmlFor="merchant">Comerciante (Opcional)</Label>
                  <Select 
                    value={filters.merchantId || 'all'} 
                    onValueChange={(value) => 
                      setFilters(prev => ({ ...prev, merchantId: value === 'all' ? undefined : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os comerciantes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os comerciantes</SelectItem>
                      {merchants.map((merchant: any) => (
                        <SelectItem key={merchant.id} value={merchant.id.toString()}>
                          {merchant.store_name || merchant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <Button onClick={() => refetch()} className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {stats && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transações no período
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Em transações processadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cashback Distribuído</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCashback)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor pago aos clientes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa da Plataforma</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalPlatformFees || stats.platformRevenue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    5% coletado dos lojistas
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Detalhamento Financeiro da Plataforma */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <DollarSign className="h-5 w-5" />
                  Detalhamento Financeiro da Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-sm font-medium text-gray-600 mb-1">Taxa Coletada (5%)</div>
                    <div className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalPlatformFees || stats.platformRevenue)}</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-sm font-medium text-gray-600 mb-1">Cashback Pago (2%)</div>
                    <div className="text-xl font-bold text-red-600">{formatCurrency(stats.totalCashback)}</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-sm font-medium text-gray-600 mb-1">Lucro Líquido (3%)</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(stats.netPlatformRevenue || (stats.totalPlatformFees || stats.platformRevenue) - stats.totalCashback)}</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-sm font-medium text-gray-600 mb-1">Lojistas Recebem (95%)</div>
                    <div className="text-xl font-bold text-orange-600">{formatCurrency(stats.totalMerchantReceives || (stats.totalAmount * 0.95))}</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg border">
                  <div className="text-sm text-gray-600 mb-2">Resumo do Modelo de Negócio:</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>💰 <strong>Lojista paga 5%</strong> sobre cada venda</div>
                    <div>🎁 <strong>Cliente recebe 2%</strong> em cashback</div>
                    <div>📈 <strong>Plataforma lucra 3%</strong> líquido</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Dados do Relatório */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dados do Relatório - {filters.reportType === 'transactions' ? 'Transações' : 
                                       filters.reportType === 'merchants' ? 'Comerciantes' : 'Clientes'}
              </CardTitle>
              <Badge variant="outline">
                {reportData?.transactions?.length || reportData?.merchants?.length || reportData?.customers?.length || 0} registros
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <div className="text-destructive mb-2">Erro ao carregar dados</div>
                <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            ) : reportData && (reportData.transactions?.length > 0 || reportData.merchants?.length > 0 || reportData.customers?.length > 0) ? (
              <div className="rounded-md border overflow-hidden">
                {filters.reportType === 'transactions' && reportData.transactions && 
                  renderTransactionsTable(reportData.transactions)}
                
                {filters.reportType === 'merchants' && reportData.merchants && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome da Loja</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transações</TableHead>
                        <TableHead>Volume Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.merchants.map((merchant: any) => (
                        <TableRow key={merchant.id}>
                          <TableCell>#{merchant.id}</TableCell>
                          <TableCell className="font-medium">{merchant.store_name || merchant.name}</TableCell>
                          <TableCell>
                            <Badge variant={merchant.approved ? 'default' : 'secondary'}>
                              {merchant.approved ? 'Aprovado' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell>{merchant.transaction_count || 0}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(merchant.total_volume || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {filters.reportType === 'customers' && reportData.customers && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Transações</TableHead>
                        <TableHead>Cashback Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.customers.map((customer: any) => (
                        <TableRow key={customer.id}>
                          <TableCell>#{customer.id}</TableCell>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.transaction_count || 0}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(customer.total_cashback || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum dado encontrado</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Não foram encontrados dados para os filtros selecionados. 
                  Tente ajustar o período ou os critérios de busca.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}