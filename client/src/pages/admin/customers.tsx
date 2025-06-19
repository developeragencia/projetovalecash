import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  BarChart, 
  BarChart2, 
  BarChart3,
  Calendar, 
  DollarSign, 
  Edit, 
  Eye, 
  Globe, 
  Mail, 
  MapPin, 
  Phone, 
  Receipt, 
  RefreshCw, 
  User, 
  UserCheck, 
  UserX, 
  Wallet, 
  XCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminCustomers() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Query para buscar todos os clientes - CORRIGIDO
  const { data = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      try {
        console.log('🔄 Buscando clientes...');
        
        const response = await fetch('/api/admin/users?pageSize=200', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.error('❌ Erro na resposta:', response.status);
          throw new Error('Erro ao buscar clientes');
        }
        
        const result = await response.json();
        console.log('✅ Total de usuários recebidos:', result.length);
        
        // Filtrar apenas clientes
        const clients = Array.isArray(result) ? result.filter(user => user.type === 'client') : [];
        console.log('👥 Total de clientes filtrados:', clients.length);
        
        return clients;
      } catch (error) {
        console.error('💥 Erro na busca de clientes:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 0
  });
  
  // Query para buscar relatório de comissões (mostra quanto deve a cada cliente)
  const { data: commissionReport, isLoading: isLoadingCommissions } = useQuery({
    queryKey: ['/api/admin/commission-report'],
    retry: 1,
  });

  // Função para formatar dados para a tabela - CORRIGIDA
  const formatTableData = (users: any[], commissionData: any) => {
    if (!users || !Array.isArray(users)) {
      console.log('❌ Dados de usuários inválidos:', users);
      return [];
    }
    
    console.log('🔄 Formatando dados da tabela para', users.length, 'usuários');
    
    // Obter dados de comissão por cliente se disponível
    const clientCommissionData = commissionData?.clients || [];
    
    // Os dados já vêm filtrados como clientes da query acima
    const formattedData = users.map(user => {
      // Buscar detalhes de comissão para este cliente
      const commission = clientCommissionData.find((c: any) => c.id === user.id) || {};
      
      return {
        id: user.id,
        name: user.name || 'Nome não informado',
        email: user.email || 'Email não informado',
        status: user.status || 'active',
        lastLogin: user.last_login && !isNaN(new Date(user.last_login).getTime()) ? format(new Date(user.last_login), 'dd/MM/yyyy HH:mm') : 'Nunca',
        created: user.created_at && !isNaN(new Date(user.created_at).getTime()) ? format(new Date(user.created_at), 'dd/MM/yyyy') : '-',
        photo: user.photo,
        phone: user.phone || '-',
        country: user.country || '-',
        referralCode: user.invitation_code || user.referral_code || '-',
        // Adicionar dados de comissão do relatório
        transaction_count: commission.transactionCount || 0,
        total_cashback: commission.totalCashback || 0,
        total_spent: commission.totalSpent || 0,
        avg_transaction: commission.avgTransaction || 0,
        percent_cashback: commission.percentCashback || 0,
        ...user // preserve all other fields
      };
    });
    
    console.log('✅ Dados formatados:', formattedData.length, 'clientes');
    return formattedData;
  };

  const handleUserView = async (userId: number, forceRefresh = false) => {
    try {
      // Buscar detalhes completos do usuário, incluindo saldo de cashback e vendas
      // Parâmetro para forçar atualização dos dados sem cache
      const timestamp = new Date().getTime();
      const forceParam = forceRefresh ? 'true' : 'false';
      const response = await fetch(`/api/admin/users/${userId}?force=${forceParam}&t=${timestamp}`);
      
      if (response.ok) {
        const userData = await response.json();
        console.log("DADOS RECEBIDOS DO SERVIDOR:", userData);
        
        // Garantir que valores monetários existam antes de mostrar
        // Forçar conversão para números, mesmo se vier como string
        userData.total_cashback = userData.total_cashback !== undefined ? 
          Number(userData.total_cashback) : 0;
          
        userData.transaction_total = userData.transaction_total !== undefined ? 
          Number(userData.transaction_total) : 0;
          
        userData.sales_total = userData.sales_total !== undefined ? 
          Number(userData.sales_total) : 0;
        
        // Log adicional para depuração
        console.log("VALORES FORMATADOS:");
        console.log("- Cashback:", userData.total_cashback);
        console.log("- Transações:", userData.transaction_total);
        console.log("- Vendas:", userData.sales_total);
        
        return userData;
      } else {
        console.error("Erro ao carregar detalhes do usuário");
        return null;
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes do usuário:", error);
      return null;
    }
  };

  const handleViewUser = async (user: any) => {
    try {
      // Mostrar modal imediatamente com dados básicos
      setSelectedUser(user);
      setIsDialogOpen(true);
      
      // Buscar dados completos em segundo plano
      console.log("Buscando dados atualizados do usuário:", user.id);
      const userData = await handleUserView(user.id, true); // forçar atualização
      
      if (userData) {
        console.log("Dados completos recebidos, atualizando interface");
        setSelectedUser(userData);
      }
    } catch (error) {
      console.error("Erro ao processar detalhes do usuário:", error);
    }
  };

  const handleBlockUser = (user: any) => {
    // Lógica para bloquear usuário
    console.log("Bloquear usuário:", user.id);
  };

  // Lista de clientes formatada para a tabela (removida - será declarada mais abaixo)

  // Definição das colunas da tabela
  const columns = [
    {
      header: "Cliente",
      accessorKey: "name",
      cell: ({ row }: any) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.photo} alt={user.name} />
              <AvatarFallback className="bg-primary text-white">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge
            variant="outline"
            className={
              status === "active"
                ? "bg-green-100 text-green-800 border-green-200"
                : status === "inactive"
                ? "bg-gray-100 text-gray-800 border-gray-200"
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
            }
          >
            {status === "active"
              ? "Ativo"
              : status === "inactive"
              ? "Inativo"
              : "Pendente"}
          </Badge>
        );
      },
    },
    {
      header: "Cadastro",
      accessorKey: "created",
    },
    {
      header: "Último Login",
      accessorKey: "lastLogin",
    },
    {
      header: "Código de Indicação",
      accessorKey: "referralCode",
    },
    {
      header: "Total Cashback",
      accessorKey: "total_cashback",
      cell: ({ row }: any) => {
        const value = parseFloat(row.original.total_cashback || 0);
        return <span>${value.toFixed(2)}</span>;
      },
    },
    {
      header: "Total Gasto",
      accessorKey: "total_spent",
      cell: ({ row }: any) => {
        const value = parseFloat(row.original.total_spent || 0);
        return <span>${value.toFixed(2)}</span>;
      },
    }
  ];

  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Usar dados reais da API para a tabela
  const customersData = formatTableData(data, commissionReport);

  // Actions configuration
  const actions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewUser,
    },
    {
      label: "Bloquear/Desbloquear",
      icon: <UserX className="h-4 w-4" />,
      onClick: handleBlockUser,
    }
  ];

  // Filter options
  const statusOptions = [
    { label: "Todos", value: "all" },
    { label: "Ativos", value: "active" },
    { label: "Inativos", value: "inactive" },
    { label: "Pendentes", value: "pending" },
  ];

  const filters = [
    {
      name: "Status",
      options: statusOptions,
      onChange: (value: string) => console.log("Status filter:", value),
    },
  ];

  return (
    <DashboardLayout title="Gerenciamento de Clientes" type="admin">
      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados</CardTitle>
          <CardDescription>
            Gerencie todos os clientes da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={customersData}
            columns={columns}
            actions={actions}
            filters={filters}
            searchable={true}
            onSearch={(value) => setSearchTerm(value)}
            pagination={{
              pageIndex: 0,
              pageSize: 10,
              pageCount: Math.ceil(customersData.length / 10),
              onPageChange: (page) => console.log("Page:", page),
            }}
            exportable={true}
            onExport={() => console.log("Exporting customers")}
          />
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o cliente
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">
                  <User className="mr-2 h-4 w-4" />
                  <span>Informações</span>
                </TabsTrigger>
                <TabsTrigger value="transactions">
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Transações</span>
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  <span>Análise</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="mt-4">
                <div className="flex flex-col gap-4">
                  {/* Nova interface com cartões para destacar informações */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Card de perfil do usuário */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                      {selectedUser.photo ? (
                        <Avatar className="w-24 h-24 mb-4 shadow-md">
                          <AvatarImage src={selectedUser.photo} />
                          <AvatarFallback className="bg-primary text-white">{getInitials(selectedUser.name)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-4 shadow-md">
                          <span className="text-4xl font-bold text-white">
                            {getInitials(selectedUser.name)}
                          </span>
                        </div>
                      )}
                      
                      <h3 className="text-xl font-semibold text-center mt-2">{selectedUser.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 text-center">{selectedUser.email}</p>
                      
                      <div className="mb-3">
                        <Badge 
                          variant="outline"
                          className={
                            selectedUser.status === "active" 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : selectedUser.status === "inactive"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {selectedUser.status === "active"
                            ? "Ativo"
                            : selectedUser.status === "inactive"
                            ? "Inativo"
                            : "Pendente"}
                        </Badge>
                      </div>
                      
                      <div className="w-full space-y-2 mt-2">
                        {selectedUser.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-primary" />
                            <span>{selectedUser.phone}</span>
                          </div>
                        )}
                        
                        {selectedUser.country && (
                          <div className="flex items-center text-sm">
                            <Globe className="h-4 w-4 mr-2 text-primary" />
                            <span>
                              {selectedUser.country}
                              {selectedUser.country_code && ` (${selectedUser.country_code})`}
                            </span>
                          </div>
                        )}
                        
                        {selectedUser.created_at && (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-primary" />
                            <span>
                              Desde {selectedUser.created_at && !isNaN(new Date(selectedUser.created_at).getTime()) 
                                ? format(new Date(selectedUser.created_at), 'dd/MM/yyyy')
                                : 'Data não disponível'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Cards de informações financeiras - específico por tipo de usuário */}
                    <div className={`md:col-span-2 xl:col-span-2 rounded-xl shadow-sm p-4 ${
                      selectedUser.type === 'merchant' ? 'bg-gradient-to-br from-orange-50 to-white border-orange-100' : 'bg-gradient-to-br from-green-50 to-white border-green-100'
                    } border`}>
                      <h3 className={`text-lg font-semibold mb-4 ${
                        selectedUser.type === 'merchant' ? 'text-orange-700' : 'text-green-700'
                      }`}>
                        {selectedUser.type === 'merchant' ? 'Resumo Financeiro do Lojista' : 'Resumo Financeiro do Cliente'}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Card 1: Sempre mostra transações */}
                        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                          <div className="flex items-center mb-2">
                            <Receipt className="h-5 w-5 mr-2 text-primary" />
                            <h4 className="text-sm font-medium">Transações</h4>
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            {selectedUser.transaction_count || 0}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Valor total: ${typeof selectedUser.transaction_total === 'number' ? 
                              selectedUser.transaction_total.toFixed(2) : 
                              parseFloat(String(selectedUser.transaction_total || "0")).toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Card 2: Específico para o tipo de usuário */}
                        {selectedUser.type === 'merchant' ? (
                          <div className="p-4 bg-white rounded-lg shadow-sm border border-orange-100">
                            <div className="flex items-center mb-2">
                              <DollarSign className="h-5 w-5 mr-2 text-orange-500" />
                              <h4 className="text-sm font-medium text-orange-700">Vendas Totais</h4>
                            </div>
                            <div className="text-2xl font-bold text-orange-600">
                              ${typeof selectedUser.sales_total === 'number' ? 
                                selectedUser.sales_total.toFixed(2) : 
                                parseFloat(String(selectedUser.sales_total || "0")).toFixed(2)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Total de vendas processadas
                            </span>
                          </div>
                        ) : (
                          <div className="p-4 bg-white rounded-lg shadow-sm border border-green-100">
                            <div className="flex items-center mb-2">
                              <Wallet className="h-5 w-5 mr-2 text-green-500" />
                              <h4 className="text-sm font-medium text-green-700">Cashback Acumulado</h4>
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                              ${typeof selectedUser.total_cashback === 'number' ? 
                                selectedUser.total_cashback.toFixed(2) : 
                                parseFloat(String(selectedUser.total_cashback || "0")).toFixed(2)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Disponível para uso
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Gráfico de métricas - Placeholder para um eventual componente de gráfico */}
                      <div className="w-full h-24 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center mb-4">
                        <BarChart3 className="h-10 w-10 text-muted-foreground opacity-30" />
                      </div>
                      
                      {/* Estatísticas detalhadas */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
                          <div className="text-xs text-muted-foreground mb-1">Média por Transação</div>
                          <div className="font-semibold">${parseFloat(selectedUser.avg_transaction || 0).toFixed(2)}</div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
                          <div className="text-xs text-muted-foreground mb-1">
                            {selectedUser.type === 'merchant' ? 'Comissão' : 'Cashback Médio'}
                          </div>
                          <div className="font-semibold">{parseFloat(selectedUser.percent_cashback || 0).toFixed(2)}%</div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
                          <div className="text-xs text-muted-foreground mb-1">Último Acesso</div>
                          <div className="font-semibold">
                            {selectedUser.last_login 
                              ? (selectedUser.last_login && !isNaN(new Date(selectedUser.last_login).getTime()) 
                                 ? format(new Date(selectedUser.last_login), 'dd/MM/yyyy')
                                 : 'Data inválida') 
                              : "Nunca"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detalhes da conta em novo design */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                      <h4 className="font-medium mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2 text-primary" />
                        Detalhes da Conta
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">ID de Usuário:</span>
                          <span className="font-medium">{selectedUser.id}</span>
                        </div>
                        
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedUser.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : selectedUser.status === "inactive"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {selectedUser.status === "active"
                              ? "Ativo"
                              : selectedUser.status === "inactive"
                              ? "Inativo"
                              : "Pendente"}
                          </span>
                        </div>
                        
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Código de Indicação:</span>
                          <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{selectedUser.invitation_code || "Não definido"}</span>
                        </div>
                        
                        <div className="flex justify-between pb-2">
                          <span className="text-muted-foreground">Criado em:</span>
                          <span className="font-medium">
                            {selectedUser.created_at && !isNaN(new Date(selectedUser.created_at).getTime()) 
                              ? format(new Date(selectedUser.created_at), 'dd/MM/yyyy')
                              : 'Data não disponível'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                      <h4 className="font-medium mb-4 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-primary" />
                        Ações Rápidas
                      </h4>
                      
                      <div className="space-y-2 sm:space-y-3">
                        <Button 
                          variant={selectedUser.status === "active" ? "destructive" : "default"}
                          className="w-full justify-center text-sm"
                          onClick={() => {
                            console.log("Toggle user status:", selectedUser.id);
                          }}
                        >
                          {selectedUser.status === "active" ? (
                            <>
                              <UserX className="mr-1 h-4 w-4" /> Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-1 h-4 w-4" /> Ativar
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-center text-sm"
                          onClick={() => {
                            window.location.href = `/admin/users/${selectedUser.id}/transactions`;
                          }}
                        >
                          <Receipt className="mr-1 h-4 w-4" /> Transações
                        </Button>
                        
                        <Button 
                          variant="secondary"
                          className="w-full justify-center text-sm"
                          onClick={() => {
                            console.log("Atualizar dados do usuário", selectedUser.id);
                            // Forçar atualização dos dados de saldo
                            handleUserView(selectedUser.id, true)
                              .then(userData => {
                                if (userData) {
                                  setSelectedUser(userData);
                                }
                              });
                          }}
                        >
                          <RefreshCw className="mr-1 h-4 w-4" /> Atualizar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="transactions" className="mt-4">
                <div className="p-4 text-center text-muted-foreground">
                  Histórico de transações do cliente será exibido aqui.
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-4">
                <div className="p-4 text-center text-muted-foreground">
                  Análise e estatísticas de uso do cliente serão exibidas aqui.
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}