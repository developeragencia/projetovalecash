import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, BarChart2, Calendar, CheckCircle, Edit, Eye, Landmark, Loader2, Mail, MapPin, Phone, Store, Trash2, User, UserCheck, UserPlus, UserX, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Esquema de validação do formulário de adição de lojista
const merchantFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  phone: z.string().optional(),
  storeName: z.string().min(1, "Nome da loja é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  commission_rate: z.string().optional()
});

// Esquema de validação do formulário de edição de lojista
const editMerchantFormSchema = z.object({
  user_name: z.string().min(1, "Nome é obrigatório"),
  user_email: z.string().email("Email inválido"),
  user_phone: z.string().optional(),
  store_name: z.string().min(1, "Nome da loja é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  commission_rate: z.string().optional(),
  approved: z.boolean().optional()
});

// Tipos derivados dos esquemas
type MerchantFormValues = z.infer<typeof merchantFormSchema>;
type EditMerchantFormValues = z.infer<typeof editMerchantFormSchema>;

export default function AdminMerchants() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMerchantDialogOpen, setIsAddMerchantDialogOpen] = useState(false);
  const [isEditMerchantDialogOpen, setIsEditMerchantDialogOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);
  const { toast } = useToast();

  // Hook de formulário para adicionar novo lojista
  const form = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      storeName: "",
      category: "Geral",
      address: "",
      city: "",
      state: "",
      commission_rate: "2.0"
    },
  });

  // Hook de formulário para editar lojista
  const editForm = useForm<EditMerchantFormValues>({
    resolver: zodResolver(editMerchantFormSchema),
    defaultValues: {
      user_name: "",
      user_email: "",
      user_phone: "",
      store_name: "",
      category: "Geral",
      address: "",
      city: "",
      state: "",
      commission_rate: "2.0",
      approved: true
    },
  });
  
  // Mutation para criar novo lojista
  const createMerchantMutation = useMutation({
    mutationFn: async (data: MerchantFormValues) => {
      const response = await apiRequest("POST", "/api/admin/merchants", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar lojista");
      }
      return await response.json();
    },
    onSuccess: () => {
      setIsAddMerchantDialogOpen(false);
      
      toast({
        title: "Lojista adicionado",
        description: "O lojista foi criado com sucesso",
      });
      
      // Recarregar a lista de lojistas
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', 'merchant'] });
      
      // Limpar formulário
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar o lojista",
        variant: "destructive",
      });
    }
  });

  // Mutation para editar lojista
  const editMerchantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EditMerchantFormValues }) => {
      const response = await apiRequest("PUT", `/api/admin/merchants/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao editar lojista");
      }
      return await response.json();
    },
    onSuccess: () => {
      setIsEditMerchantDialogOpen(false);
      setSelectedMerchant(null);
      
      toast({
        title: "Lojista atualizado",
        description: "Os dados do lojista foram atualizados com sucesso",
      });
      
      // Recarregar a lista de lojistas
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', 'merchant'] });
      
      // Limpar formulário
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao editar o lojista",
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir lojista
  const deleteMerchantMutation = useMutation({
    mutationFn: async (merchantId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/merchants/${merchantId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao excluir lojista");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      setIsDialogOpen(false);
      setSelectedMerchant(null);
      
      // Verificar se foi desativado ou excluído
      const isDeactivated = data.message?.includes("desativado");
      
      toast({
        title: isDeactivated ? "Lojista desativado" : "Lojista excluído",
        description: data.message || "Operação realizada com sucesso",
        variant: isDeactivated ? "default" : "destructive",
      });
      
      // Invalidar múltiplas queries para garantir atualização
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/merchants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', 'merchant'] });
      
      // Forçar refetch dos dados
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao excluir o lojista",
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: MerchantFormValues) {
    createMerchantMutation.mutate(data);
  }

  function onEditSubmit(data: EditMerchantFormValues) {
    if (selectedMerchant) {
      editMerchantMutation.mutate({ id: selectedMerchant.id, data });
    }
  }
  
  // Query para buscar todos os lojistas - CORRIGIDO
  const { data: userData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/users', 'merchant'],
    queryFn: async () => {
      try {
        console.log('🔄 Buscando lojistas...');
        
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
          throw new Error('Erro ao buscar lojistas');
        }
        
        const result = await response.json();
        console.log('✅ Total de usuários recebidos:', result.length);
        
        // Filtrar apenas merchants
        const merchants = Array.isArray(result) ? result.filter(user => user.type === 'merchant') : [];
        console.log('🏪 Total de lojistas filtrados:', merchants.length);
        
        return merchants;
      } catch (error) {
        console.error('💥 Erro na busca de lojistas:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 0
  });

  // Função para formatar dados para a tabela - CORRIGIDA
  const formatTableData = (users: any[]) => {
    if (!users || !Array.isArray(users)) {
      console.log('❌ Dados de lojistas inválidos:', users);
      return [];
    }

    console.log('🔄 Formatando dados da tabela para', users.length, 'lojistas');

    // Os dados já vêm filtrados como merchants da query acima
    const formattedData = users.map(user => ({
      id: user.id,
      name: user.name || 'Nome não informado',
      email: user.email || 'Email não informado',
      status: user.status || 'active',
      lastLogin: user.last_login ? format(new Date(user.last_login), 'dd/MM/yyyy HH:mm') : 'Nunca',
      created: user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : '-',
      photo: user.photo,
      phone: user.phone || '-',
      country: user.country || '-',
      store_name: user.store_name || "Loja não configurada",
      // Adicionar campos calculados para a visualização
      sales_count: 0, // Será calculado em futuras implementações
      total_sales: 0, // Será calculado em futuras implementações
      ...user // preserve all other fields
    }));

    console.log('✅ Dados formatados:', formattedData.length, 'lojistas');
    return formattedData;
  };

  const handleViewMerchant = (merchant: any) => {
    setSelectedMerchant(merchant);
    setIsDialogOpen(true);
  };

  const handleEditMerchant = (merchant: any) => {
    setSelectedMerchant(merchant);
    
    // Preencher o formulário de edição com os dados do merchant
    editForm.reset({
      user_name: merchant.name || "",
      user_email: merchant.email || "",
      user_phone: merchant.phone || "",
      store_name: merchant.store_name || "",
      category: merchant.category || "Geral",
      address: merchant.address || "",
      city: merchant.city || "",
      state: merchant.state || "",
      commission_rate: merchant.commission_rate || "2.0",
      approved: merchant.status === 'active'
    });
    
    setIsEditMerchantDialogOpen(true);
  };

  const handleDeleteMerchant = (merchant: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o lojista "${merchant.name}"?\n\nEsta ação não pode ser desfeita.`)) {
      deleteMerchantMutation.mutate(merchant.id);
    }
  };

  const handleBlockMerchant = (merchant: any) => {
    // Lógica para bloquear lojista
    console.log("Bloquear lojista:", merchant.id);
  };

  // Lista de lojistas formatada para a tabela
  const merchantsData = formatTableData(userData || []);

  // Definição das colunas da tabela
  const columns = [
    {
      header: "Lojista",
      accessorKey: "name",
      cell: ({ row }: any) => {
        const merchant = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={merchant.photo} alt={merchant.name} />
              <AvatarFallback className="bg-accent text-white">
                {merchant.name ? merchant.name.charAt(0) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{merchant.name}</div>
              <div className="text-sm text-muted-foreground">{merchant.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Loja",
      accessorKey: "store_name",
      cell: ({ row }: any) => {
        const store_name = row.original.store_name;
        return (
          <div className="flex items-center">
            <Store className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{store_name || "Não configurada"}</span>
          </div>
        );
      }
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

  // Actions configuration
  const actions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewMerchant,
    },
    {
      label: "Editar",
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditMerchant,
    },
    {
      label: "Excluir",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteMerchant,
      className: "text-red-600 hover:text-red-800",
    },
    {
      label: "Bloquear/Desbloquear",
      icon: <UserX className="h-4 w-4" />,
      onClick: handleBlockMerchant,
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
    <DashboardLayout title="Gerenciamento de Lojistas" type="admin">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lojistas Cadastrados</CardTitle>
            <CardDescription>
              Gerencie todos os lojistas da plataforma
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddMerchantDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar Lojista
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={merchantsData}
            columns={columns}
            actions={actions}
            filters={filters}
            searchable={true}
            onSearch={(value) => setSearchTerm(value)}
            pagination={{
              pageIndex: 0,
              pageSize: 10,
              pageCount: Math.ceil(merchantsData.length / 10),
              onPageChange: (page) => console.log("Page:", page),
            }}
            exportable={true}
            onExport={() => console.log("Exporting merchants")}
          />
        </CardContent>
      </Card>

      {/* Merchant Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lojista</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o lojista e sua loja
            </DialogDescription>
          </DialogHeader>
          
          {selectedMerchant && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">
                  <User className="mr-2 h-4 w-4" />
                  <span>Informações</span>
                </TabsTrigger>
                <TabsTrigger value="store">
                  <Store className="mr-2 h-4 w-4" />
                  <span>Loja</span>
                </TabsTrigger>
                <TabsTrigger value="sales">
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Vendas</span>
                </TabsTrigger>
                <TabsTrigger value="withdrawals">
                  <Landmark className="mr-2 h-4 w-4" />
                  <span>Saques</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="mt-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage 
                        src={selectedMerchant.photo} 
                        alt={selectedMerchant.name} 
                      />
                      <AvatarFallback className="text-lg bg-accent text-white">
                        {getInitials(selectedMerchant.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold">{selectedMerchant.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedMerchant.email}</p>
                      
                      <Badge 
                        variant="outline"
                        className={
                          selectedMerchant.status === "active" 
                            ? "bg-green-100 text-green-800 border-green-200 mt-2" 
                            : selectedMerchant.status === "inactive"
                            ? "bg-gray-100 text-gray-800 border-gray-200 mt-2"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200 mt-2"
                        }
                      >
                        {selectedMerchant.status === "active"
                          ? "Ativo"
                          : selectedMerchant.status === "inactive"
                          ? "Inativo"
                          : "Pendente"}
                      </Badge>
                    </div>
                    
                    <div className="w-full space-y-2">
                      {selectedMerchant.country && (
                        <div className="flex items-center p-2 bg-muted rounded">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{selectedMerchant.country}</span>
                        </div>
                      )}
                      
                      {selectedMerchant.phone && (
                        <div className="flex items-center p-2 bg-muted rounded">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{selectedMerchant.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center p-2 bg-muted rounded">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{selectedMerchant.email}</span>
                      </div>
                      
                      {selectedMerchant.created_at && (
                        <div className="flex items-center p-2 bg-muted rounded">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">
                            Membro desde: {format(new Date(selectedMerchant.created_at), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:w-2/3">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/20 rounded-lg">
                          <h4 className="text-sm text-muted-foreground mb-1">Total de Vendas</h4>
                          <div className="text-2xl font-bold text-accent">
                            {selectedMerchant.sales_count || 0}
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted/20 rounded-lg">
                          <h4 className="text-sm text-muted-foreground mb-1">Valor Total de Vendas</h4>
                          <div className="text-2xl font-bold text-accent">
                            ${selectedMerchant.total_sales?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Detalhes da Conta</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">ID de Usuário:</span>
                            <span>{selectedMerchant.id}</span>
                          </div>
                          
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">Status:</span>
                            <span>
                              {selectedMerchant.status === "active"
                                ? "Ativo"
                                : selectedMerchant.status === "inactive"
                                ? "Inativo"
                                : "Pendente"}
                            </span>
                          </div>
                          
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">Nome da Loja:</span>
                            <span>{selectedMerchant.store_name || "Não configurado"}</span>
                          </div>
                          
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">Último Acesso:</span>
                            <span>
                              {selectedMerchant.last_login 
                                ? format(new Date(selectedMerchant.last_login), 'dd/MM/yyyy HH:mm') 
                                : "Nunca"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-end mt-4 gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          console.log("Editar lojista:", selectedMerchant.id);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </Button>
                      
                      <Button 
                        variant={selectedMerchant.status === "active" ? "destructive" : "default"}
                        onClick={() => {
                          console.log("Toggle user status:", selectedMerchant.id);
                          setIsDialogOpen(false);
                        }}
                      >
                        {selectedMerchant.status === "active" ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" /> Desativar Conta
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" /> Ativar Conta
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="store" className="mt-4">
                <div className="rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Informações da Loja</h3>
                    <Badge 
                      className={selectedMerchant.store_status === "active" 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : ""}
                    >
                      {selectedMerchant.store_status === "active" ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Ativa
                        </>
                      ) : (
                        "Inativa"
                      )}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3 flex justify-center">
                        <div className="w-40 h-40 rounded-lg bg-muted flex items-center justify-center">
                          {selectedMerchant.store_logo ? (
                            <img 
                              src={selectedMerchant.store_logo} 
                              alt="Logo da loja" 
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <Store className="h-16 w-16 text-muted-foreground/50" />
                          )}
                        </div>
                      </div>
                      
                      <div className="md:w-2/3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Nome da Loja</h4>
                            <p className="text-base">{selectedMerchant.store_name || "Não configurado"}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Categoria</h4>
                            <p className="text-base">{selectedMerchant.store_category || "Não configurado"}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Telefone</h4>
                            <p className="text-base">{selectedMerchant.store_phone || "Não configurado"}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                            <p className="text-base">{selectedMerchant.store_email || selectedMerchant.email}</p>
                          </div>
                          
                          <div className="col-span-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Endereço</h4>
                            <p className="text-base">{selectedMerchant.store_address || "Não configurado"}</p>
                          </div>
                          
                          <div className="col-span-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Descrição</h4>
                            <p className="text-base">{selectedMerchant.store_description || "Sem descrição"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Taxas e Comissões</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-muted/20 rounded-lg">
                          <div className="text-sm text-muted-foreground">Taxa de Plataforma</div>
                          <div className="text-xl font-semibold text-accent">2%</div>
                        </div>
                        
                        <div className="p-3 bg-muted/20 rounded-lg">
                          <div className="text-sm text-muted-foreground">Comissão de Lojista</div>
                          <div className="text-xl font-semibold text-accent">1%</div>
                        </div>
                        
                        <div className="p-3 bg-muted/20 rounded-lg">
                          <div className="text-sm text-muted-foreground">Cashback para Clientes</div>
                          <div className="text-xl font-semibold text-accent">2%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button 
                      variant="outline" 
                      className="mr-2"
                      onClick={() => console.log("Ver produtos:", selectedMerchant.id)}
                    >
                      Ver Produtos
                    </Button>
                    <Button onClick={() => console.log("Editar loja:", selectedMerchant.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Informações
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sales" className="mt-4">
                <div className="p-4 text-center text-muted-foreground">
                  Histórico de vendas do lojista será exibido aqui.
                </div>
              </TabsContent>
              
              <TabsContent value="withdrawals" className="mt-4">
                <div className="p-4 text-center text-muted-foreground">
                  Histórico de saques do lojista será exibido aqui.
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Adicionar Lojista */}
      <Dialog open={isAddMerchantDialogOpen} onOpenChange={setIsAddMerchantDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Lojista</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo lojista e sua loja
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Lojista</FormLabel>
                      <FormControl>
                        <Input placeholder="João da Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="joao@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Loja</FormLabel>
                      <FormControl>
                        <Input placeholder="Supermercado Exemplo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Geral">Geral</SelectItem>
                          <SelectItem value="Alimentação">Alimentação</SelectItem>
                          <SelectItem value="Vestuário">Vestuário</SelectItem>
                          <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
                          <SelectItem value="Automotivo">Automotivo</SelectItem>
                          <SelectItem value="Saúde">Saúde</SelectItem>
                          <SelectItem value="Beleza">Beleza</SelectItem>
                          <SelectItem value="Casa e Decoração">Casa e Decoração</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Av. Brasil, 1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa de Comissão (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min="0" max="10" {...field} />
                      </FormControl>
                      <FormDescription>
                        Taxa padrão é 2%
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="mt-6 gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddMerchantDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createMerchantMutation.isPending}
                >
                  {createMerchantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Lojista
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Editar Lojista */}
      <Dialog open={isEditMerchantDialogOpen} onOpenChange={setIsEditMerchantDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Lojista</DialogTitle>
            <DialogDescription>
              Atualize os dados do lojista e sua loja
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="user_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Lojista</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="user_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="user_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="store_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Loja</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da loja" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Alimentação">Alimentação</SelectItem>
                          <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
                          <SelectItem value="Roupas">Roupas</SelectItem>
                          <SelectItem value="Casa e Jardim">Casa e Jardim</SelectItem>
                          <SelectItem value="Saúde e Beleza">Saúde e Beleza</SelectItem>
                          <SelectItem value="Esportes">Esportes</SelectItem>
                          <SelectItem value="Serviços">Serviços</SelectItem>
                          <SelectItem value="Geral">Geral</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa de Comissão (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="2.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="approved"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Lojista Aprovado</FormLabel>
                      <FormDescription>
                        Ativar ou desativar o lojista na plataforma
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6 gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditMerchantDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={editMerchantMutation.isPending}
                >
                  {editMerchantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação pode desativar o lojista se houver transações associadas ou excluí-lo permanentemente caso contrário.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMerchant && (
            <div className="flex items-center space-x-4 py-2 border rounded-md p-3 bg-muted/30">
              <Avatar>
                <AvatarFallback className="bg-accent text-white">
                  {selectedMerchant.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-sm font-semibold">{selectedMerchant.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedMerchant.email}</p>
                <p className="text-xs text-muted-foreground">Loja: {selectedMerchant.storeName || "N/A"}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedMerchant(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedMerchant) {
                  deleteMerchantMutation.mutate(selectedMerchant.id);
                }
              }}
              disabled={deleteMerchantMutation.isPending}
            >
              {deleteMerchantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}