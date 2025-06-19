import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  DollarSign,
  Calendar,
  CreditCard,
  User,
  Filter,
  Download,
  Loader2,
  TrendingUp,
  Clock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Interface para transações
interface Transaction {
  id: number;
  customer: string;
  date: string;
  amount: number;
  cashback: number;
  payment_method: string;
  status: string;
  description?: string;
  notes?: string;
}

// Configurações de status
const statusConfig = {
  completed: { 
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Concluída",
    icon: CheckCircle2
  },
  pending: { 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Pendente",
    icon: Clock
  },
  cancelled: { 
    color: "bg-red-100 text-red-800 border-red-200",
    label: "Cancelada",
    icon: XCircle
  },
  refunded: { 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Reembolsada",
    icon: RefreshCw
  }
};

// Métodos de pagamento
const paymentMethods = {
  cash: "💵 Dinheiro",
  credit_card: "💳 Cartão de Crédito",
  debit_card: "💳 Cartão de Débito",
  pix: "📱 PIX",
  cashback: "🎁 Cashback"
};

export default function MerchantTransactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [currency, setCurrency] = useState<'USD' | 'BRL'>('USD');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { toast } = useToast();

  // Taxa de conversão
  const USD_TO_BRL_RATE = 5.20;

  // Formatação de moeda
  const formatCurrency = (value: number) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    } else {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
  };

  const convertCurrency = (value: number) => {
    if (currency === 'USD') {
      return value / USD_TO_BRL_RATE;
    }
    return value;
  };

  // Carregar transações
  const { data: apiData, isLoading, refetch } = useQuery({
    queryKey: ['/api/merchant/transactions'],
    retry: 1,
    staleTime: 30000,
    queryFn: async () => {
      const response = await fetch('/api/merchant/transactions', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar transações');
      }
      
      return await response.json();
    }
  });

  // Processar dados da API
  const transactions: Transaction[] = apiData?.transactions ? apiData.transactions.map((t: any) => ({
    id: t.id,
    customer: t.customer || 'Cliente',
    date: t.date || new Date().toISOString(),
    amount: parseFloat(t.amount) || 0,
    cashback: parseFloat(t.cashback) || 0,
    payment_method: t.payment_method || 'cash',
    status: t.status || 'completed',
    description: t.description || '',
    notes: t.notes || ''
  })) : [];

  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toString().includes(searchTerm) ||
      transaction.amount.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || transaction.payment_method === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Estatísticas
  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    cancelled: transactions.filter(t => t.status === 'cancelled').length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    totalCashback: transactions.reduce((sum, t) => sum + t.cashback, 0)
  };

  // Função para abrir detalhes da transação
  const openTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsDialog(true);
  };

  return (
    <DashboardLayout title="Histórico de Transações" type="merchant">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Histórico de Transações</h1>
            <p className="text-gray-600">Acompanhe todas as suas vendas e transações realizadas</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={currency} onValueChange={(value: 'USD' | 'BRL') => setCurrency(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">🇺🇸 USD</SelectItem>
                <SelectItem value="BRL">🇧🇷 BRL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Concluídas</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pendentes</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Canceladas</p>
                  <p className="text-3xl font-bold">{stats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Faturamento</p>
                  <p className="text-lg font-bold">{formatCurrency(convertCurrency(stats.totalAmount))}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Cashback</p>
                  <p className="text-lg font-bold">{formatCurrency(convertCurrency(stats.totalCashback))}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente, ID ou valor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="refunded">Reembolsadas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Métodos</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Transações */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transações ({filteredTransactions.length})</span>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Carregando transações...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-600 mb-2">Nenhuma transação encontrada</p>
                <p className="text-gray-500">Ajuste os filtros ou realize uma nova venda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  const statusInfo = statusConfig[transaction.status as keyof typeof statusConfig];
                  const StatusIcon = statusInfo?.icon || CheckCircle2;
                  
                  return (
                    <div key={transaction.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                          {/* ID e Cliente */}
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant="outline" className="text-xs">#{transaction.id}</Badge>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <User className="mr-1 h-4 w-4" />
                              <span className="font-medium">{transaction.customer}</span>
                            </div>
                          </div>

                          {/* Data */}
                          <div className="flex items-center text-gray-600">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span className="text-sm">
                              {(() => {
                                try {
                                  const date = new Date(transaction.date);
                                  if (isNaN(date.getTime())) {
                                    return 'Data inválida';
                                  }
                                  return date.toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });
                                } catch (error) {
                                  return 'Data inválida';
                                }
                              })()}
                            </span>
                          </div>

                          {/* Valor */}
                          <div>
                            <p className="font-bold text-lg text-gray-800">
                              {formatCurrency(convertCurrency(transaction.amount))}
                            </p>
                          </div>

                          {/* Cashback */}
                          <div>
                            <p className="text-sm text-green-600 font-medium">
                              +{formatCurrency(convertCurrency(transaction.cashback))}
                            </p>
                            <p className="text-xs text-gray-500">cashback</p>
                          </div>

                          {/* Método de Pagamento */}
                          <div className="flex items-center text-gray-600">
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span className="text-sm">
                              {paymentMethods[transaction.payment_method as keyof typeof paymentMethods] || transaction.payment_method}
                            </span>
                          </div>

                          {/* Status */}
                          <div>
                            <Badge className={`${statusInfo?.color || 'bg-gray-100 text-gray-800'} flex items-center space-x-1`}>
                              <StatusIcon className="h-3 w-3" />
                              <span>{statusInfo?.label || transaction.status}</span>
                            </Badge>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTransactionDetails(transaction)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Descrição (se houver) */}
                      {transaction.description && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-600">{transaction.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Detalhes da Transação */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Transação #{selectedTransaction?.id}</DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Cliente</Label>
                      <p className="text-lg font-semibold text-gray-800">{selectedTransaction.customer}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data e Hora</Label>
                      <p className="text-gray-800">
                        {(() => {
                          try {
                            const date = new Date(selectedTransaction.date);
                            if (isNaN(date.getTime())) {
                              return 'Data não disponível';
                            }
                            return date.toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            });
                          } catch (error) {
                            return 'Data não disponível';
                          }
                        })()}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Método de Pagamento</Label>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <p className="text-gray-800">
                          {paymentMethods[selectedTransaction.payment_method as keyof typeof paymentMethods] || selectedTransaction.payment_method}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <div className="mt-1">
                        <Badge className={statusConfig[selectedTransaction.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                          {statusConfig[selectedTransaction.status as keyof typeof statusConfig]?.label || selectedTransaction.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Valor Total</Label>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(convertCurrency(selectedTransaction.amount))}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Cashback Gerado</Label>
                      <p className="text-xl font-semibold text-blue-600">
                        {formatCurrency(convertCurrency(selectedTransaction.cashback))}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Taxa da Plataforma (5%)</Label>
                      <p className="text-red-600 font-medium">
                        -{formatCurrency(convertCurrency(selectedTransaction.amount * 0.05))}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Valor Líquido (Recebido)</Label>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(convertCurrency(selectedTransaction.amount - (selectedTransaction.amount * 0.05) - selectedTransaction.cashback))}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedTransaction.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Descrição</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-800">{selectedTransaction.description}</p>
                    </div>
                  </div>
                )}

                {selectedTransaction.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Observações</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-800">{selectedTransaction.notes}</p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Resumo Financeiro</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Valor da Venda:</span>
                      <span className="font-medium">{formatCurrency(convertCurrency(selectedTransaction.amount))}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Taxa Plataforma:</span>
                      <span className="font-medium">-{formatCurrency(convertCurrency(selectedTransaction.amount * 0.05))}</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>Cashback Cliente:</span>
                      <span className="font-medium">-{formatCurrency(convertCurrency(selectedTransaction.cashback))}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Você Recebe:</span>
                      <span>{formatCurrency(convertCurrency(selectedTransaction.amount - (selectedTransaction.amount * 0.05) - selectedTransaction.cashback))}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}