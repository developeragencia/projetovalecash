import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Clock, 
  ArrowDownCircle, 
  Filter,
  Download
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Helmet } from "react-helmet";

// Configurações globais do sistema
const SYSTEM_SETTINGS = {
  cashbackRate: 0.02, // 2% - Cashback para o cliente
  referralRate: 0.01, // 1% - Bônus para quem indicou
  merchantCommission: 0.02, // 2% - Comissão do lojista
  platformFee: 0.05, // 5% - Taxa da plataforma
  minWithdrawal: 20, // $ 20.00 - Valor mínimo para saque
  withdrawalFee: 0.05, // 5% - Taxa sobre saques
};

// Formatação de valores monetários
const formatCurrency = (value: string | number) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numValue);
};

// Badge de status
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-500 hover:bg-green-600">Aprovado</Badge>;
    case "rejected":
      return <Badge variant="destructive">Recusado</Badge>;
    case "cancelled":
      return <Badge variant="secondary">Cancelado</Badge>;
    case "pending":
    default:
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendente</Badge>;
  }
};

// Componente de diálogo de detalhes da solicitação
const WithdrawalDetailsDialog = ({ 
  withdrawal, 
  onApprove, 
  onReject,
  isPending
}: { 
  withdrawal: any, 
  onApprove: (id: number, notes: string) => void, 
  onReject: (id: number, notes: string) => void,
  isPending: boolean
}) => {
  const [adminNotes, setAdminNotes] = useState("");
  const [open, setOpen] = useState(false);
  
  const handleApprove = () => {
    onApprove(withdrawal.id, adminNotes);
    setOpen(false);
  };
  
  const handleReject = () => {
    onReject(withdrawal.id, adminNotes);
    setOpen(false);
  };
  
  // Formatar data de forma segura
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Data inválida";
      return format(date, "MM/dd/yyyy HH:mm", { locale: enUS });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-2" /> Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Solicitação de Saque</DialogTitle>
          <DialogDescription>
            Visualize e atualize o status desta solicitação.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">ID da Solicitação</h3>
                <p className="text-sm">#{withdrawal.id}</p>
              </div>
              <StatusBadge status={withdrawal.status} />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div>
                <h3 className="font-medium">Lojista</h3>
                <p className="text-sm">{withdrawal.store_name || withdrawal.merchant_name}</p>
                <p className="text-xs text-muted-foreground">{withdrawal.full_name}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Valores</h3>
                <div className="space-y-1">
                  <p className="text-xl font-semibold text-primary">{formatCurrency(withdrawal.amount)}</p>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa do Site ({withdrawal.fee_percentage || (SYSTEM_SETTINGS.withdrawalFee * 100)}%):</span>
                      <span className="font-medium text-destructive">-{formatCurrency(withdrawal.fee_amount || (parseFloat(withdrawal.amount) * SYSTEM_SETTINGS.withdrawalFee))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Líquido:</span>
                      <span className="font-medium text-green-600">{formatCurrency(withdrawal.net_amount || (parseFloat(withdrawal.amount) * (1 - SYSTEM_SETTINGS.withdrawalFee)))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Método de Pagamento</h3>
                <p className="text-sm capitalize">{withdrawal.payment_method}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Data da Solicitação</h3>
                <p className="text-sm">{formatDate(withdrawal.created_at)}</p>
              </div>
              
              {withdrawal.processed_at && (
                <div>
                  <h3 className="font-medium">Data de Processamento</h3>
                  <p className="text-sm">{formatDate(withdrawal.processed_at)}</p>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium">Dados Bancários</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Banco</p>
                  <p className="text-sm">{withdrawal.bank_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Agência</p>
                  <p className="text-sm">{withdrawal.agency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conta</p>
                  <p className="text-sm">{withdrawal.account}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium">Dados de Contato</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{withdrawal.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm">{withdrawal.phone}</p>
                </div>
              </div>
            </div>
            
            {withdrawal.notes && (
              <div className="border-t pt-4">
                <h3 className="font-medium">Observações</h3>
                <p className="text-sm whitespace-pre-wrap mt-1">{withdrawal.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {withdrawal.status === "pending" && (
          <>
            <div className="border-t pt-4">
              <Label htmlFor="admin_notes">Observações (opcional)</Label>
              <Textarea 
                id="admin_notes" 
                placeholder="Adicione observações sobre esta transação"
                className="mt-2"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button" 
                variant="destructive"
                onClick={handleReject}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Recusar
              </Button>
              <Button
                type="button"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Aprovar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Página principal de gerenciamento de saques do administrador
const AdminWithdrawals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  // Consultar solicitações de saque
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/withdrawal-requests", statusFilter],
    queryFn: async ({ queryKey }) => {
      const [_, status] = queryKey;
      const url = status 
        ? `/api/admin/withdrawal-requests?status=${status}`
        : "/api/admin/withdrawal-requests";
        
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Erro ao carregar solicitações de saque");
      }
      return res.json();
    }
  });
  
  // Mutation para processar solicitações (aprovar/rejeitar)
  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes 
    }: { 
      id: number; 
      status: "completed" | "rejected"; 
      notes: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/withdrawal-requests/${id}`, {
        status,
        admin_notes: notes
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao processar solicitação");
      }
      
      return await res.json();
    },
    onSuccess: (data, variables) => {
      const action = variables.status === "completed" ? "aprovada" : "recusada";
      
      toast({
        title: `Solicitação ${action}`,
        description: `A solicitação de saque foi ${action} com sucesso.`,
        variant: "default",
      });
      
      // Atualizar a lista de solicitações
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/withdrawal-requests"] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao processar solicitação",
        description: error.message || "Ocorreu um erro ao processar a solicitação. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Funções para aprovar/rejeitar solicitações
  const handleApproveWithdrawal = (id: number, notes: string) => {
    processWithdrawalMutation.mutate({
      id,
      status: "completed",
      notes
    });
  };
  
  const handleRejectWithdrawal = (id: number, notes: string) => {
    processWithdrawalMutation.mutate({
      id,
      status: "rejected",
      notes
    });
  };
  
  // Formatar data de forma segura
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Data inválida";
      return format(date, "MM/dd/yyyy HH:mm", { locale: enUS });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };
  
  // Renderizar conteúdo principal
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Não foi possível carregar as solicitações de saque. Por favor, tente novamente.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!data?.withdrawals || data.withdrawals.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <ArrowDownCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma solicitação de saque encontrada com os filtros atuais.</p>
        </div>
      );
    }
    
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Lojista</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Taxa ({SYSTEM_SETTINGS.withdrawalFee * 100}%)</TableHead>
              <TableHead>Valor Líquido</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.withdrawals.map((withdrawal: any) => (
              <TableRow key={withdrawal.id}>
                <TableCell className="font-medium">#{withdrawal.id}</TableCell>
                <TableCell>
                  {withdrawal.store_name || withdrawal.merchant_name}
                  <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {withdrawal.user_name}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDate(withdrawal.created_at)}
                  {withdrawal.status !== "pending" && withdrawal.processed_at && (
                    <div className="text-xs text-muted-foreground">
                      Processado: {formatDate(withdrawal.processed_at)}
                    </div>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                <TableCell className="text-destructive">
                  {withdrawal.fee_amount 
                    ? formatCurrency(withdrawal.fee_amount) 
                    : formatCurrency(parseFloat(withdrawal.amount) * SYSTEM_SETTINGS.withdrawalFee)
                  }
                </TableCell>
                <TableCell className="text-green-600 font-medium">
                  {withdrawal.net_amount 
                    ? formatCurrency(withdrawal.net_amount) 
                    : formatCurrency(parseFloat(withdrawal.amount) * (1 - SYSTEM_SETTINGS.withdrawalFee))
                  }
                </TableCell>
                <TableCell className="capitalize">{withdrawal.payment_method}</TableCell>
                <TableCell>
                  <StatusBadge status={withdrawal.status} />
                </TableCell>
                <TableCell className="text-right">
                  <WithdrawalDetailsDialog 
                    withdrawal={withdrawal} 
                    onApprove={handleApproveWithdrawal}
                    onReject={handleRejectWithdrawal}
                    isPending={processWithdrawalMutation.isPending}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Opções de filtro de status
  const statusOptions = [
    { value: undefined, label: "Todos" },
    { value: "pending", label: "Pendentes" },
    { value: "completed", label: "Aprovados" },
    { value: "rejected", label: "Recusados" },
    { value: "cancelled", label: "Cancelados" }
  ];
  
  // Agrupar solicitações por status
  const pendingCount = data?.withdrawals?.filter((w: any) => w.status === "pending")?.length || 0;
  const completedCount = data?.withdrawals?.filter((w: any) => w.status === "completed")?.length || 0;
  const rejectedCount = data?.withdrawals?.filter((w: any) => w.status === "rejected")?.length || 0;
  const cancelledCount = data?.withdrawals?.filter((w: any) => w.status === "cancelled")?.length || 0;
  
  return (
    <DashboardLayout type="admin" title="Solicitações de Saque">
      <Helmet>
        <title>Solicitações de Saque | Vale Cashback</title>
      </Helmet>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Solicitações de Saque</h1>
            <p className="text-muted-foreground">
              Gerencie as solicitações de saque dos lojistas.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value !== "undefined" ? value : undefined)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem 
                      key={option.value || "all"} 
                      value={option.value?.toString() || "undefined"}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pendentes
              </CardTitle>
              <CardDescription>Solicitações aguardando aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Aprovados
              </CardTitle>
              <CardDescription>Solicitações aprovadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Recusados
              </CardTitle>
              <CardDescription>Solicitações recusadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                Cancelados
              </CardTitle>
              <CardDescription>Solicitações canceladas pelo lojista</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cancelledCount}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabela de solicitações */}
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default AdminWithdrawals;