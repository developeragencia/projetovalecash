import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  RefreshCw,
  FileText,
  Eye,
  Printer,
  User,
  Store,
  Calendar,
  CreditCard,
  DollarSign
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

// Interface para transação
interface Transaction {
  id: number;
  customer_id?: number;
  customer_name?: string;
  merchant_id?: number;
  merchant_name?: string;
  total_amount?: number;
  cashback_amount?: number;
  payment_method?: string;
  item_count?: number;
  status?: string;
  created_at?: string;
}

export default function AdminTransactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Query para buscar as transações
  const { data, isLoading, error, refetch } = useQuery<{
    transactions: Transaction[];
    totalAmount: number;
    totalCashback: number;
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      pageCount: number;
    };
  }>({
    queryKey: ['/api/admin/transactions', searchTerm, status, paymentMethod],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/transactions', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const text = await response.text();
          console.error('API Error Response:', text);
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Transactions API Response:', data);
        return data;
      } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
    }
  });

  // Renderizar status da transação
  const renderStatus = (status: string) => {
    const statusValue = status || 'unknown';
    
    switch (statusValue) {
      case "completed":
        return (
          <div className="flex items-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-green-600 font-medium">Concluída</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-yellow-500 mr-2" />
            <span className="text-yellow-600 font-medium">Pendente</span>
          </div>
        );
      case "cancelled":
        return (
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-red-600 font-medium">Cancelada</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-gray-600 font-medium">Desconhecido</span>
          </div>
        );
    }
  };

  // Filtrar transações
  const filteredTransactions = data?.transactions?.filter((transaction) => {
    const matchesSearch = !searchTerm || 
      transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.merchant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id?.toString().includes(searchTerm);
    
    const matchesStatus = status === "all" || transaction.status === status;
    const matchesPayment = paymentMethod === "all" || transaction.payment_method === paymentMethod;
    
    return matchesSearch && matchesStatus && matchesPayment;
  }) || [];

  if (isLoading) {
    return (
      <DashboardLayout title="Histórico de Transações" type="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando transações...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Histórico de Transações" type="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <div>
              <h2 className="text-lg font-medium mb-1">Erro ao carregar transações</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {error?.message || 'Não foi possível carregar as transações.'}
              </p>
              <Button onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Histórico de Transações" type="admin">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.transactions?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.totalAmount || 0)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cashback Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.totalCashback || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, loja ou ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="credit_card">Crédito</SelectItem>
            <SelectItem value="debit_card">Débito</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="cash">Dinheiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>
            Lista de todas as transações realizadas no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Cashback</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">#{transaction.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.customer_name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">ID: {transaction.customer_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.merchant_name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">ID: {transaction.merchant_id}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(transaction.total_amount || 0)}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(transaction.cashback_amount || 0)}
                      </TableCell>
                      <TableCell>
                        {renderStatus(transaction.status || '')}
                      </TableCell>
                      <TableCell>
                        {transaction.created_at ? format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowTransactionModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">Nenhuma transação encontrada</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Não encontramos transações que correspondam aos filtros aplicados. 
                Tente ajustar seus critérios de busca.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Transação */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação #{selectedTransaction?.id}</DialogTitle>
            <DialogDescription>
              Informações completas sobre a transação selecionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Informações Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{selectedTransaction.customer_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">ID: {selectedTransaction.customer_id}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Loja
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{selectedTransaction.merchant_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">ID: {selectedTransaction.merchant_id}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Valor Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedTransaction.total_amount || 0)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Cashback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedTransaction.cashback_amount || 0)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="text-sm">
                      {selectedTransaction.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                       selectedTransaction.payment_method === 'debit_card' ? 'Cartão de Débito' :
                       selectedTransaction.payment_method === 'pix' ? 'PIX' :
                       selectedTransaction.payment_method === 'cash' ? 'Dinheiro' :
                       selectedTransaction.payment_method || 'N/A'}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Status e Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderStatus(selectedTransaction.status || '')}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Data da Transação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">
                      {selectedTransaction.created_at ? 
                        format(new Date(selectedTransaction.created_at), 'dd/MM/yyyy HH:mm:ss') : 
                        'N/A'
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Informações Adicionais */}
              {selectedTransaction.item_count && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Itens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Quantidade de itens: <span className="font-medium">{selectedTransaction.item_count}</span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}