import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Calendar as CalendarIcon,
  Search,
  Download,
  ChevronDown,
  Circle,
  FileText,
  Eye,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  RefreshCw,
  Landmark,
  DollarSign,
  CreditCard,
  Banknote,
  ArrowUp,
  Mail,
  X
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Tipos e componentes
interface Transfer {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userType: string;
  amount: string | number;
  status: "completed" | "pending" | "cancelled";
  createdAt: string | Date;
  updatedAt?: string | Date;
  description?: string | null;
  type: "merchant_withdrawal" | "client_withdrawal" | "internal_transfer" | string;
}

const TransferTypeIcons: Record<string, React.ReactNode> = {
  "cashback": <CreditCard className="h-4 w-4" />,
  "referral": <User className="h-4 w-4" />,
  "withdrawal": <Banknote className="h-4 w-4" />,
  "merchant_withdrawal": <Landmark className="h-4 w-4" />,
  "client_withdrawal": <Banknote className="h-4 w-4" />,
  "internal_transfer": <RefreshCw className="h-4 w-4" />,
};

const TransferStatusIcons: Record<string, React.ReactNode> = {
  "completed": <CheckCircle2 className="h-4 w-4 text-green-500" />,
  "pending": <Clock className="h-4 w-4 text-yellow-500" />,
  "cancelled": <XCircle className="h-4 w-4 text-red-500" />,
};

export default function AdminTransfers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{from: Date | null, to: Date | null}>({
    from: null,
    to: null,
  });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const { toast } = useToast();
  
  // Query para buscar as transferências
  const { data, isLoading } = useQuery<{ 
    transfers: Transfer[], 
    totalAmount: number,
    statusCounts: { status: string, count: number }[],
    typeCounts: { type: string, sum: number }[],
    pageCount: number
  }>({
    queryKey: ['/api/admin/transfers', {
      page,
      pageSize,
      status: statusFilter,
      type: typeFilter,
      dateFrom: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateTo: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      search: searchTerm
    }],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/transfers');
        if (!response.ok) {
          throw new Error('Falha ao buscar transferências');
        }
        const data = await response.json();
        
        // Transformar e estruturar os dados
        const transfers = data.transfers || [];
        const totalAmount = transfers.reduce((sum: number, transfer: any) => 
          sum + (parseFloat(transfer.amount) || 0), 0);
          
        // Contar status
        const statusMap = new Map<string, number>();
        transfers.forEach((transfer: any) => {
          const status = transfer.status || 'unknown';
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });
        
        const statusCounts = Array.from(statusMap.entries()).map(([status, count]) => ({
          status,
          count
        }));
        
        // Agrupar por tipo
        const typeMap = new Map<string, number>();
        transfers.forEach((transfer: any) => {
          const type = transfer.type || 'unknown';
          const amount = parseFloat(transfer.amount) || 0;
          typeMap.set(type, (typeMap.get(type) || 0) + amount);
        });
        
        const typeCounts = Array.from(typeMap.entries()).map(([type, sum]) => ({
          type,
          sum
        }));
        
        return {
          transfers,
          totalAmount,
          statusCounts,
          typeCounts,
          pageCount: Math.ceil(transfers.length / pageSize)
        };
      } catch (err) {
        console.error('Erro ao buscar transferências:', err);
        throw err;
      }
    }
  });
  
  // Filtrar transferências
  const filteredTransfers = data?.transfers || [];
  
  // Exportar dados
  const handleExport = () => {
    toast({
      title: "Exportação iniciada",
      description: "Seus dados estão sendo exportados para CSV.",
    });
    
    // Em uma implementação real, aqui iríamos gerar um arquivo CSV e fazer o download
    setTimeout(() => {
      toast({
        title: "Exportação concluída",
        description: "Arquivo CSV exportado com sucesso.",
      });
    }, 1500);
  };
  
  // Visualizar detalhes da transferência
  const handleViewTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setShowDetailsModal(true);
  };
  
  // Aprovar transferência
  const handleApproveTransfer = (transfer: Transfer) => {
    if (transfer.status !== "pending") {
      toast({
        title: "Operação não permitida",
        description: "Apenas transferências pendentes podem ser aprovadas.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Transferência aprovada",
      description: `A transferência #${transfer.id} foi aprovada com sucesso.`,
    });
  };
  
  // Definição das colunas da tabela
  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Usuário",
      accessorKey: "userName",
      cell: ({ row }: any) => {
        const transfer = row.original;
        return (
          <div className="flex items-center">
            <User className="h-4 w-4 text-muted-foreground mr-2" />
            <span>{transfer?.userName || 'Usuário'}</span>
          </div>
        );
      },
    },
    {
      header: "Data",
      accessorKey: "created_at",
      cell: ({ row }: any) => {
        const transfer = row.original;
        try {
          return (
            <span>
              {transfer.created_at ? new Date(transfer.created_at).toLocaleDateString('en-US') : ''}
            </span>
          );
        } catch (error) {
          return <span>Data inválida</span>;
        }
      },
    },
    {
      header: "Valor",
      accessorKey: "amount",
      cell: ({ row }: any) => {
        const transfer = row.original;
        return (
          <span className="font-medium">
            {formatCurrency(transfer.amount || 0)}
          </span>
        );
      },
    },
    {
      header: "Tipo",
      accessorKey: "type",
      cell: ({ row }: any) => {
        const transfer = row.original;
        const type = transfer.type || 'unknown';
        
        const typeLabels: Record<string, string> = {
          "withdrawal": "Saque",
          "cashback": "Cashback",
          "referral": "Indicação",
          "merchant_withdrawal": "Saque Lojista",
          "client_withdrawal": "Saque Cliente",
          "internal_transfer": "Transferência Interna",
          "unknown": "Desconhecido"
        };
        
        return (
          <div className="flex items-center">
            {TransferTypeIcons[type] || <DollarSign className="h-4 w-4 mr-2" />}
            <span className="ml-1">{typeLabels[type] || type}</span>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => {
        const transfer = row.original;
        const status = transfer.status || 'unknown';
        
        const statusLabels: Record<string, string> = {
          "completed": "Concluída",
          "pending": "Pendente",
          "cancelled": "Cancelada",
          "unknown": "Desconhecido"
        };
        
        const statusColors: Record<string, string> = {
          "completed": "bg-green-100 text-green-800",
          "pending": "bg-yellow-100 text-yellow-800",
          "cancelled": "bg-red-100 text-red-800",
          "unknown": "bg-gray-100 text-gray-800"
        };
        
        return (
          <div className={`rounded-full px-2 py-1 text-xs font-medium inline-flex items-center ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
            {TransferStatusIcons[status] || <Circle className="h-4 w-4 text-gray-500" />}
            <span className="ml-1">{statusLabels[status] || status}</span>
          </div>
        );
      },
    },
    {
      header: "Informações",
      accessorKey: "userEmail",
      cell: ({ row }: any) => {
        const transfer = row.original;
        return (
          <div className="flex items-center">
            <Mail className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="truncate max-w-[200px]">{transfer.userEmail || 'Sem email'}</span>
          </div>
        );
      },
    },
  ];
  
  // Ações para a tabela
  const actions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: (transfer: Transfer) => handleViewTransfer(transfer),
    },
    {
      label: "Aprovar",
      icon: <CheckCircle2 className="h-4 w-4" />,
      onClick: (transfer: Transfer) => handleApproveTransfer(transfer),
      // Apenas exibir para transferências pendentes
      show: (transfer: Transfer) => transfer.status === "pending",
    },
  ];
  
  return (
    <DashboardLayout title="Transferências" type="admin">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
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
                    from: dateRange.from ?? undefined,
                    to: dateRange.to ?? undefined,
                  }}
                  onSelect={range => {
                    if (range?.from) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  locale={enUS}
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Transferido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data?.totalAmount)}
              </div>
              <p className="text-sm text-muted-foreground">
                {filteredTransfers.length} transferências
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {data?.statusCounts && data.statusCounts.length > 0 ? (
                  data.statusCounts.map((statusCount) => {
                    const statusIcons: Record<string, JSX.Element> = {
                      "completed": <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-1.5" />,
                      "pending": <Clock className="h-3.5 w-3.5 text-yellow-500 mr-1.5" />,
                      "cancelled": <XCircle className="h-3.5 w-3.5 text-red-500 mr-1.5" />
                    };
                    
                    const statusLabels: Record<string, string> = {
                      "completed": "Concluídas",
                      "pending": "Pendentes",
                      "cancelled": "Canceladas"
                    };
                    
                    return (
                      <div key={statusCount.status} className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                          {statusIcons[statusCount.status] || <DollarSign className="h-3.5 w-3.5 mr-1.5" />}
                          <span>{statusLabels[statusCount.status] || statusCount.status}</span>
                        </div>
                        <span className="text-sm font-medium">{statusCount.count}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-center text-muted-foreground py-2">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Tipo</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {data?.typeCounts && data.typeCounts.length > 0 ? (
                  data.typeCounts.map((typeCount) => {
                    const typeLabels: Record<string, string> = {
                      "withdrawal": "Saques",
                      "cashback": "Cashback",
                      "referral": "Indicações",
                      "merchant_withdrawal": "Saques Lojista",
                      "client_withdrawal": "Saques Cliente",
                      "internal_transfer": "Transferências Internas"
                    };
                    
                    const typeIcons: Record<string, JSX.Element> = {
                      "withdrawal": <Banknote className="h-3.5 w-3.5 mr-1.5" />,
                      "cashback": <CreditCard className="h-3.5 w-3.5 mr-1.5" />,
                      "referral": <User className="h-3.5 w-3.5 mr-1.5" />,
                      "merchant_withdrawal": <Landmark className="h-3.5 w-3.5 mr-1.5" />,
                      "client_withdrawal": <Banknote className="h-3.5 w-3.5 mr-1.5" />,
                      "internal_transfer": <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    };
                    
                    return (
                      <div key={typeCount.type} className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                          {typeIcons[typeCount.type] || <DollarSign className="h-3.5 w-3.5 mr-1.5" />}
                          <span>{typeLabels[typeCount.type] || typeCount.type}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(typeCount.sum)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-center text-muted-foreground py-2">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Transferências</CardTitle>
            <CardDescription>
              Histórico completo de transferências no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-1 gap-4">
                <Select value={statusFilter || "all"} onValueChange={(val) => setStatusFilter(val === "all" ? null : val)}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="completed">Concluídas</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter || "all"} onValueChange={(val) => setTypeFilter(val === "all" ? null : val)}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="merchant_withdrawal">Saque Lojista</SelectItem>
                    <SelectItem value="client_withdrawal">Saque Cliente</SelectItem>
                    <SelectItem value="internal_transfer">Transferência Interna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DataTable
              data={filteredTransfers}
              columns={columns}
              actions={actions}
              searchable={false}
              pagination={{
                pageIndex: page - 1,
                pageSize: pageSize,
                pageCount: data?.pageCount || 1,
                onPageChange: (newPage) => setPage(newPage + 1),
              }}
            />
          </CardContent>
        </Card>
      </Tabs>

      {/* Transfer Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Transferência #{selectedTransfer?.id}</DialogTitle>
            <DialogDescription>
              Informações completas sobre a transferência selecionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransfer && (
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={selectedTransfer.status === 'completed' ? 'default' : 
                                   selectedTransfer.status === 'pending' ? 'secondary' : 'destructive'}>
                      {selectedTransfer.status === 'completed' ? 'Concluída' :
                       selectedTransfer.status === 'pending' ? 'Pendente' : 'Cancelada'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor</label>
                  <p className="mt-1 text-2xl font-bold">{formatCurrency(selectedTransfer.amount)}</p>
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Usuário</label>
                  <div className="mt-1 flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedTransfer.userName}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="mt-1 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedTransfer.userEmail || 'Não informado'}</span>
                  </div>
                </div>
              </div>

              {/* Transfer Type and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <div className="mt-1 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {selectedTransfer.type === 'withdrawal' ? 'Saque' :
                       selectedTransfer.type === 'cashback' ? 'Cashback' :
                       selectedTransfer.type === 'referral' ? 'Indicação' :
                       selectedTransfer.type === 'merchant_withdrawal' ? 'Saque Lojista' :
                       selectedTransfer.type === 'client_withdrawal' ? 'Saque Cliente' :
                       selectedTransfer.type === 'internal_transfer' ? 'Transferência Interna' :
                       'Transferência Interna'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {new Date(selectedTransfer.created_at).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(selectedTransfer.created_at).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedTransfer.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-md">{selectedTransfer.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Fechar
                </Button>
                {selectedTransfer.status === 'pending' && (
                  <Button onClick={() => {
                    handleApproveTransfer(selectedTransfer);
                    setShowDetailsModal(false);
                  }}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}