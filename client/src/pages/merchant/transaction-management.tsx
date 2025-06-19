import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  Eye,
  Edit3,
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
  MoreHorizontal,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Interfaces
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
  source?: string;
}

// Configurações de cores para status
const statusConfig = {
  completed: { 
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Concluída",
    icon: CheckCircle2
  },
  pending: { 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Pendente",
    icon: RefreshCw
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

// Configurações de métodos de pagamento
const paymentMethods = {
  cash: "💵 Dinheiro",
  credit_card: "💳 Cartão de Crédito",
  debit_card: "💳 Cartão de Débito",
  pix: "📱 PIX",
  cashback: "🎁 Saldo de Cashback"
};

export default function TransactionManagement() {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [currency, setCurrency] = useState<'USD' | 'BRL'>('USD');

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
  const { data: transactionsData = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/merchant/sales'],
    retry: 1,
    staleTime: 30000,
    queryFn: async () => {
      const response = await fetch('/api/merchant/sales', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar transações');
      }
      
      return await response.json();
    }
  });

  // Mapear dados para formato esperado
  const transactions: Transaction[] = Array.isArray(transactionsData) ? transactionsData.map((t: any) => ({
    id: t.id,
    customer: t.customer || 'Cliente',
    date: t.date || new Date().toISOString(),
    amount: parseFloat(t.amount) || 0,
    cashback: parseFloat(t.cashback) || 0,
    payment_method: t.payment_method || 'cash',
    status: t.status || 'completed',
    description: t.description || '',
    notes: t.notes || '',
    source: t.source || 'manual'
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
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    totalCashback: transactions.reduce((sum, t) => sum + t.cashback, 0)
  };

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number, status: string, reason?: string }) => {
      const response = await apiRequest("PUT", `/api/merchant/sales/${id}/status`, { status, reason });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar status");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status da transação foi atualizado com sucesso.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Falha ao atualizar o status da transação.",
        variant: "destructive",
      });
    }
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number, notes: string }) => {
      const response = await apiRequest("PUT", `/api/merchant/sales/${id}`, { notes });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar transação");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transação atualizada",
        description: "As informações da transação foram atualizadas.",
      });
      setShowEditDialog(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Falha ao atualizar a transação.",
        variant: "destructive",
      });
    }
  });

  // Handlers
  const handleStatusChange = (transaction: Transaction, newStatus: string) => {
    if (newStatus === 'refunded') {
      setSelectedTransaction(transaction);
      setShowRefundDialog(true);
    } else {
      updateStatusMutation.mutate({ id: transaction.id, status: newStatus });
    }
  };

  const handleRefund = () => {
    if (selectedTransaction && refundReason.trim()) {
      updateStatusMutation.mutate({ 
        id: selectedTransaction.id, 
        status: 'refunded', 
        reason: refundReason 
      });
      setShowRefundDialog(false);
      setRefundReason("");
    }
  };

  const handleEdit = () => {
    if (selectedTransaction) {
      updateTransactionMutation.mutate({ 
        id: selectedTransaction.id, 
        notes: editNotes 
      });
    }
  };

  const openEditDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditNotes(transaction.notes || "");
    setShowEditDialog(true);
  };

  const openDetailsDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  return (
    <DashboardLayout title="Gerenciamento de Transações" type="merchant">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Gerenciamento de Transações</h1>
            <p className="text-gray-600">Monitore e gerencie todas as suas transações em tempo real</p>
          </div>
          <div className="flex items-center space-x-4">
            <Label className="font-medium text-gray-700">Moeda:</Label>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total de Transações</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-blue-200" />
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
                <CheckCircle2 className="h-12 w-12 text-green-200" />
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
                <RefreshCw className="h-12 w-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Valor Total</p>
                  <p className="text-xl font-bold">{formatCurrency(convertCurrency(stats.totalAmount))}</p>
                </div>
                <DollarSign className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Cashback Total</p>
                  <p className="text-xl font-bold">{formatCurrency(convertCurrency(stats.totalCashback))}</p>
                </div>
                <DollarSign className="h-12 w-12 text-orange-200" />
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
              <span>Lista de Transações ({filteredTransactions.length})</span>
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
                <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-600 mb-2">Nenhuma transação encontrada</p>
                <p className="text-gray-500">Ajuste os filtros ou registre uma nova venda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  const statusInfo = statusConfig[transaction.status as keyof typeof statusConfig];
                  const StatusIcon = statusInfo?.icon || AlertTriangle;
                  
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
                            <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                          </div>

                          {/* Valores */}
                          <div>
                            <p className="font-bold text-lg text-gray-800">
                              {formatCurrency(convertCurrency(transaction.amount))}
                            </p>
                            <p className="text-sm text-green-600">
                              +{formatCurrency(convertCurrency(transaction.cashback))} cashback
                            </p>
                          </div>

                          {/* Método de Pagamento */}
                          <div className="flex items-center text-gray-600">
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>{paymentMethods[transaction.payment_method as keyof typeof paymentMethods] || transaction.payment_method}</span>
                          </div>

                          {/* Status */}
                          <div>
                            <Badge className={`${statusInfo?.color || 'bg-gray-100 text-gray-800'} flex items-center space-x-1`}>
                              <StatusIcon className="h-3 w-3" />
                              <span>{statusInfo?.label || transaction.status}</span>
                            </Badge>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailsDialog(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {transaction.status !== 'cancelled' && transaction.status !== 'refunded' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(transaction)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            )}

                            {transaction.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(transaction, 'completed')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}

                            {transaction.status === 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(transaction, 'refunded')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}

                            {(transaction.status === 'pending' || transaction.status === 'completed') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(transaction, 'cancelled')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Detalhes */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Transação #{selectedTransaction?.id}</DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Cliente</Label>
                    <p className="text-lg font-semibold">{selectedTransaction.customer}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Data</Label>
                    <p className="text-lg">{new Date(selectedTransaction.date).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Valor</Label>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(convertCurrency(selectedTransaction.amount))}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Cashback</Label>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(convertCurrency(selectedTransaction.cashback))}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Método de Pagamento</Label>
                    <p className="text-lg">{paymentMethods[selectedTransaction.payment_method as keyof typeof paymentMethods] || selectedTransaction.payment_method}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge className={statusConfig[selectedTransaction.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                      {statusConfig[selectedTransaction.status as keyof typeof statusConfig]?.label || selectedTransaction.status}
                    </Badge>
                  </div>
                </div>
                
                {selectedTransaction.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Descrição</Label>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedTransaction.description}</p>
                  </div>
                )}
                
                {selectedTransaction.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Observações</Label>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Transação #{selectedTransaction?.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editNotes">Observações</Label>
                <Textarea
                  id="editNotes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta transação..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleEdit}
                  disabled={updateTransactionMutation.isPending}
                >
                  {updateTransactionMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Reembolso */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reembolsar Transação #{selectedTransaction?.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Esta ação irá reembolsar {selectedTransaction && formatCurrency(convertCurrency(selectedTransaction.amount))} para o cliente.
                </AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="refundReason">Motivo do Reembolso *</Label>
                <Textarea
                  id="refundReason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Descreva o motivo do reembolso..."
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleRefund}
                  disabled={!refundReason.trim() || updateStatusMutation.isPending}
                  variant="destructive"
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Confirmar Reembolso
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}