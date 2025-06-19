import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Store, 
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Settings,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  BarChart,
  PieChart,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Trash,
  Save
} from "lucide-react";
import { LineChartComponent, BarChartComponent, PieChartComponent } from "@/components/ui/charts";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Mock stores data - would be replaced with real data from API
const stores = [
  { 
    id: 1, 
    name: "Mercado Central", 
    cnpj: "12.345.678/0001-90", 
    owner: "Carlos Mendes", 
    category: "Supermercado", 
    status: "active", 
    transactions: 250, 
    volume: 22500.00,
    commissionRate: 2.0,
    address: "Av. Brasil, 1234",
    city: "São Paulo",
    state: "SP",
    phone: "(11) 3456-7890",
    email: "contato@mercadocentral.com",
    website: "www.mercadocentral.com.br",
    createdAt: "15/02/2023",
    logo: "",
    salesData: [
      { month: "Jan", value: 3200 },
      { month: "Fev", value: 3500 },
      { month: "Mar", value: 3800 },
      { month: "Abr", value: 4100 },
      { month: "Mai", value: 4500 },
      { month: "Jun", value: 4800 },
      { month: "Jul", value: 5100 }
    ],
    categoryData: [
      { name: "Alimentos", value: 60 },
      { name: "Bebidas", value: 20 },
      { name: "Limpeza", value: 10 },
      { name: "Higiene", value: 10 }
    ]
  },
  { 
    id: 2, 
    name: "Farmácia Popular", 
    cnpj: "23.456.789/0001-01", 
    owner: "Ana Oliveira", 
    category: "Farmácia", 
    status: "active", 
    transactions: 180, 
    volume: 15750.50,
    commissionRate: 2.0,
    email: "contato@farmaciapopular.com"
  },
  { 
    id: 3, 
    name: "Posto Shell", 
    cnpj: "34.567.890/0001-12", 
    owner: "Roberto Santos", 
    category: "Posto de Combustível", 
    status: "active", 
    transactions: 120, 
    volume: 18000.00,
    commissionRate: 2.0,
    email: "contato@postoshell.com"
  },
  { 
    id: 4, 
    name: "Livraria Cultura", 
    cnpj: "45.678.901/0001-23", 
    owner: "Juliana Lima", 
    category: "Livraria", 
    status: "active", 
    transactions: 90, 
    volume: 9500.75,
    commissionRate: 2.0,
    email: "contato@livraricultura.com"
  },
  { 
    id: 5, 
    name: "Shopping Center Norte", 
    cnpj: "56.789.012/0001-34", 
    owner: "Fernando Costa", 
    category: "Shopping Center", 
    status: "inactive", 
    transactions: 0, 
    volume: 0.00,
    commissionRate: 2.0,
    email: "contato@shoppingnorte.com"
  },
  { 
    id: 6, 
    name: "Restaurante Sabor Brasil", 
    cnpj: "67.890.123/0001-45", 
    owner: "Paulo Mendes", 
    category: "Alimentação", 
    status: "pending", 
    transactions: 0, 
    volume: 0.00,
    commissionRate: 2.0,
    email: "contato@saborbrasil.com"
  },
  { 
    id: 7, 
    name: "Auto Peças Expresso", 
    cnpj: "78.901.234/0001-56", 
    owner: "Sandra Lima", 
    category: "Automotivo", 
    status: "pending", 
    transactions: 0, 
    volume: 0.00,
    commissionRate: 2.0,
    email: "contato@autopecas.com"
  }
];

export default function AdminStores() {
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commissionRate, setCommissionRate] = useState<string>("2.0");
  const [storesToDelete, setStoresToDelete] = useState<any[]>([]);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    store_name: "",
    category: "",
    cnpj: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    description: "",
    status: "active"
  });
  
  const { toast } = useToast();

  // Query to get stores data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/stores'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Usa os dados da API ou um array vazio enquanto carrega
  const storesData = Array.isArray(data) ? data : [];

  // Mutation for updating store
  const updateStoreMutation = useMutation({
    mutationFn: async (storeData: any) => {
      const response = await apiRequest("PUT", `/api/admin/merchants/${storeData.id}`, storeData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Loja atualizada com sucesso",
        description: `${data.store_name || 'Loja'} foi atualizada`
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar loja",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  });

  // Mutation for deleting store
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/merchants/${storeId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Loja excluída com sucesso",
        description: `${selectedStore?.store_name || 'Loja'} foi removida do sistema`
      });
      setIsDeleteDialogOpen(false);
      setSelectedStore(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir loja",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating store status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ storeId, status }: { storeId: number, status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/merchants/${storeId}/status`, { status });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: (data, variables) => {
      const statusText = variables.status === 'active' ? 'ativada' : 'desativada';
      toast({
        title: "Status atualizado",
        description: `Loja ${statusText} com sucesso`
      });
      setIsBlockDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  });

  const handleViewStore = (store: any) => {
    setSelectedStore(store);
    setIsDialogOpen(true);
  };

  const handleEditStore = (store: any) => {
    setSelectedStore(store);
    setEditForm({
      store_name: store.store_name || store.name || "",
      category: store.category || "",
      cnpj: store.cnpj || "",
      address: store.address || "",
      city: store.city || "",
      state: store.state || "",
      phone: store.phone || "",
      email: store.email || "",
      description: store.description || "",
      status: store.status || "active"
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedStore) return;
    
    updateStoreMutation.mutate({
      id: selectedStore.id,
      ...editForm
    });
  };

  // Lojas agora são aprovadas automaticamente, não é mais necessário os diálogos de aprovação e rejeição

  const handleBlockDialog = (store: any) => {
    setSelectedStore(store);
    setIsBlockDialogOpen(true);
  };

  const handleToggleStatus = () => {
    if (!selectedStore) return;
    
    const newStatus = selectedStore.status === 'active' ? 'inactive' : 'active';
    updateStatusMutation.mutate({
      storeId: selectedStore.id,
      status: newStatus
    });
  };

  const handleDeleteDialog = (store: any) => {
    setSelectedStore(store);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedStore) return;
    deleteStoreMutation.mutate(selectedStore.id);
  };

  const handleUpdateCommission = () => {
    if (!selectedStore) return;
    
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: "Taxa inválida",
        description: "Por favor, insira uma taxa válida entre 0 e 100",
        variant: "destructive"
      });
      return;
    }

    updateCommissionMutation.mutate({
      storeId: selectedStore.id,
      rate: rate
    });
  };

  const handleCommissionDialog = (store: any) => {
    setSelectedStore(store);
    setCommissionRate(store.commissionRate?.toString() || "2.0");
    setIsCommissionDialogOpen(true);
  };

  // Update commission rate
  const updateCommissionMutation = useMutation({
    mutationFn: async ({ storeId, rate }: { storeId: number, rate: number }) => {
      const response = await apiRequest("PATCH", `/api/admin/merchants/${storeId}/commission`, { commission_rate: rate });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Taxa de comissão atualizada",
        description: `Nova taxa: ${commissionRate}%`
      });
      setIsCommissionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar comissão",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  });

  const handleUpdateCommission = async () => {
    if (!selectedStore) return;
    
    setIsProcessing(true);
    
    try {
      // This would be an API call in a real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Comissão atualizada",
        description: `Taxa de comissão para ${selectedStore.name} alterada para ${commissionRate}%.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
      setIsCommissionDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a taxa de comissão.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Ativa";
      case "inactive": return "Inativa";
      case "pending": return "Pendente";
      default: return status;
    }
  };

  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Column configuration
  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Nome",
      accessorKey: "store_name",
      cell: ({ row }: any) => {
        const value = row.original.store_name || row.original.name || "";
        return <span>{value}</span>;
      },
    },
    {
      header: "Responsável",
      accessorKey: "ownerName",
      cell: ({ row }: any) => {
        const value = row.original.ownerName || "";
        return <span>{value}</span>;
      },
    },
    {
      header: "Categoria",
      accessorKey: "category",
      cell: ({ row }: any) => {
        const value = row.original.category || "Geral";
        return <span>{value}</span>;
      },
    },
    {
      header: "Status",
      accessorKey: "approved",
      cell: ({ row }: any) => {
        // Utiliza approved como indicador de status já que não há campo status
        const approved = row.original.approved;
        const status = approved === false ? "inactive" : "active";
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
            {getStatusLabel(status)}
          </Badge>
        );
      }
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: ({ row }: any) => {
        const value = row.original.email || "";
        return <span>{value}</span>;
      },
    },
    {
      header: "Telefone",
      accessorKey: "phone",
      cell: ({ row }: any) => {
        const value = row.original.phone || "";
        return <span>{value}</span>;
      },
    },
    {
      header: "Comissão (%)",
      accessorKey: "commissionRate",
      cell: ({ row }: any) => {
        const value = row.original.commissionRate || "2.0";
        return <span>{value}</span>;
      },
    },
  ];
  
  // Encontrar lojas com os emails especificados para exclusão
  const findStoresByEmails = async () => {
    const emailsToDelete = ["alexmoura-2025@hotmail.com", "lojista@valecashback.com"];
    
    if (data && Array.isArray(data)) {
      const foundStores = data.filter(store => 
        emailsToDelete.includes(store.email)
      );
      
      if (foundStores.length > 0) {
        // Armazenar os objetos completos de loja para facilitar a exclusão
        setStoresToDelete(foundStores);
      }
    }
  };
  
  useEffect(() => {
    if (data) {
      findStoresByEmails();
    }
  }, [data]);

  // Actions configuration
  const actions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewStore,
    },
    {
      label: "Editar",
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditStore,
    },
    {
      label: "Taxa de comissão",
      icon: <Settings className="h-4 w-4" />,
      onClick: handleCommissionDialog,
    },
    {
      label: "Ativar/Desativar",
      icon: <Ban className="h-4 w-4" />,
      onClick: handleBlockDialog,
    },
    {
      label: "Excluir",
      icon: <XCircle className="h-4 w-4" />,
      onClick: handleDeleteDialog,
    }
  ];

  // Filter options
  const categoryOptions = [
    { label: "Todas", value: "all" },
    { label: "Supermercado", value: "Supermercado" },
    { label: "Farmácia", value: "Farmácia" },
    { label: "Restaurante", value: "Alimentação" },
    { label: "Posto", value: "Posto de Combustível" },
    { label: "Livraria", value: "Livraria" },
    { label: "Shopping", value: "Shopping Center" },
    { label: "Automotivo", value: "Automotivo" },
  ];

  const statusOptions = [
    { label: "Todos", value: "all" },
    { label: "Ativa", value: "active" },
    { label: "Inativa", value: "inactive" },
    { label: "Pendente", value: "pending" },
  ];

  const filters = [
    {
      name: "Categoria",
      options: categoryOptions,
      onChange: (value: string) => console.log("Category filter:", value),
    },
    {
      name: "Status",
      options: statusOptions,
      onChange: (value: string) => console.log("Status filter:", value),
    },
  ];

  return (
    <DashboardLayout title="Gestão de Lojas" type="admin">
      <Card>
        <CardHeader>
          <CardTitle>Lojas Cadastradas</CardTitle>
          <CardDescription>
            Gerencie todas as lojas do Vale Cashback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={storesData}
            columns={columns}
            actions={actions}
            filters={filters}
            searchable={true}
            onSearch={(value) => console.log("Searching:", value)}
            pagination={{
              pageIndex: 0,
              pageSize: 10,
              pageCount: Math.ceil(storesData.length / 10),
              onPageChange: (page) => console.log("Page:", page),
            }}
            exportable={true}
            onExport={() => console.log("Exporting stores")}
          />
        </CardContent>
      </Card>

      {/* Store Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Loja</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre a loja
            </DialogDescription>
          </DialogHeader>
          
          {selectedStore && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">
                  <Store className="mr-2 h-4 w-4" />
                  <span>Informações</span>
                </TabsTrigger>
                <TabsTrigger value="sales">
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Vendas</span>
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <PieChart className="mr-2 h-4 w-4" />
                  <span>Análise</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="mt-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage 
                        src={selectedStore.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStore.name || selectedStore.store_name || "Loja")}&background=random&color=fff&size=128`}
                        alt={selectedStore.name || selectedStore.store_name || "Loja"} 
                      />
                      <AvatarFallback className="text-lg bg-accent text-white">
                        {getInitials(selectedStore.name || selectedStore.store_name || "Loja")}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold">{selectedStore.name || selectedStore.store_name || "Loja"}</h3>
                      <p className="text-sm text-muted-foreground">{selectedStore.category || "Geral"}</p>
                      
                      <Badge 
                        variant="outline"
                        className={
                          selectedStore.approved !== false 
                            ? "bg-green-100 text-green-800 border-green-200 mt-2" 
                            : "bg-gray-100 text-gray-800 border-gray-200 mt-2"
                        }
                      >
                        {selectedStore.approved !== false ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    
                    <div className="w-full space-y-2">
                      {selectedStore.address && (
                        <div className="flex items-center p-2 bg-muted rounded">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">
                            {selectedStore.address}, {selectedStore.city}/{selectedStore.state}
                          </span>
                        </div>
                      )}
                      
                      {selectedStore.phone && (
                        <div className="flex items-center p-2 bg-muted rounded">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{selectedStore.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center p-2 bg-muted rounded">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{selectedStore.email}</span>
                      </div>
                      
                      <div className="flex items-center p-2 bg-muted rounded">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Responsável: {selectedStore.owner}</span>
                      </div>
                      
                      {selectedStore.createdAt && (
                        <div className="flex items-center p-2 bg-muted rounded">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">Cadastro: {selectedStore.createdAt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:w-2/3">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/20 rounded-lg">
                          <h4 className="text-sm text-muted-foreground mb-1">Taxa de Comissão</h4>
                          <div className="text-2xl font-bold text-accent">
                            {selectedStore.commissionRate || "2.0"}%
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted/20 rounded-lg">
                          <h4 className="text-sm text-muted-foreground mb-1">ID da Loja</h4>
                          <div className="text-2xl font-bold text-accent">
                            {selectedStore.id}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Detalhes da Loja</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">CNPJ:</span>
                            <span>{selectedStore.cnpj}</span>
                          </div>
                          
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">Taxa de Comissão:</span>
                            <span>{selectedStore.commissionRate}%</span>
                          </div>
                          
                          {selectedStore.website && (
                            <div className="flex justify-between border-b py-2">
                              <span className="text-muted-foreground">Website:</span>
                              <span>{selectedStore.website}</span>
                            </div>
                          )}
                          
                          {/* Add more store details here */}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-end mt-4 gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleEditStore(selectedStore)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsDialogOpen(false);
                          handleCommissionDialog(selectedStore);
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" /> Taxa de Comissão
                      </Button>
                      
                      <Button 
                        variant={selectedStore.approved === false ? "default" : "destructive"}
                        onClick={() => {
                          setIsDialogOpen(false);
                          handleBlockDialog(selectedStore);
                        }}
                      >
                        {selectedStore.approved === false ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" /> Ativar
                          </>
                        ) : (
                          <>
                            <Ban className="mr-2 h-4 w-4" /> Desativar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sales" className="mt-4">
                <div className="space-y-6">
                  {selectedStore.salesData ? (
                    <LineChartComponent
                      title="Histórico de Vendas"
                      data={selectedStore.salesData}
                      lines={[
                        { dataKey: "value", name: "Vendas (R$)" }
                      ]}
                      xAxisDataKey="month"
                      height={300}
                    />
                  ) : (
                    <div className="p-6 text-center border rounded-lg">
                      <BarChart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="font-medium text-lg mb-2">Sem dados de vendas</h3>
                      <p className="text-muted-foreground">
                        Esta loja ainda não possui dados de vendas disponíveis.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h3 className="text-muted-foreground text-sm">Ticket Médio</h3>
                          <div className="text-2xl font-bold">
                            $ {(selectedStore.averageTicket || 0).toFixed(2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h3 className="text-muted-foreground text-sm">Comissão Total</h3>
                          <div className="text-2xl font-bold">
                            $ {((selectedStore.volume || 0) * ((selectedStore.commissionRate || 2) / 100)).toFixed(2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h3 className="text-muted-foreground text-sm">Transações/Dia</h3>
                          <div className="text-2xl font-bold">
                            {((selectedStore.transactions || 0) / 30).toFixed(1)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-4">
                <div className="space-y-6">
                  {selectedStore.categoryData ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <PieChartComponent
                        title="Distribuição por Categoria"
                        data={selectedStore.categoryData}
                        donut={true}
                        innerRadius={60}
                        height={300}
                      />
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Análise de Desempenho</CardTitle>
                          <CardDescription>
                            Comparativo com outras lojas da mesma categoria
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Volume de Vendas</span>
                              <div className="w-48 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-accent h-2 rounded-full" 
                                  style={{ width: '65%' }}
                                ></div>
                              </div>
                              <span className="text-sm">65%</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Número de Transações</span>
                              <div className="w-48 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-accent h-2 rounded-full" 
                                  style={{ width: '78%' }}
                                ></div>
                              </div>
                              <span className="text-sm">78%</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Ticket Médio</span>
                              <div className="w-48 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-accent h-2 rounded-full" 
                                  style={{ width: '45%' }}
                                ></div>
                              </div>
                              <span className="text-sm">45%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="p-6 text-center border rounded-lg">
                      <PieChart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="font-medium text-lg mb-2">Sem dados analíticos</h3>
                      <p className="text-muted-foreground">
                        Esta loja ainda não possui dados analíticos disponíveis.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogos de aprovação e rejeição removidos, pois as lojas são aprovadas automaticamente */}

      {/* Block/Unblock Store Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedStore?.approved === false ? "Ativar Loja" : "Desativar Loja"}
            </DialogTitle>
            <DialogDescription>
              {selectedStore?.approved === false
                ? `Você está prestes a ativar a loja ${selectedStore?.name || selectedStore?.store_name}. Isso permitirá que a loja opere no sistema.`
                : `Você está prestes a desativar a loja ${selectedStore?.name || selectedStore?.store_name}. Isso impedirá que a loja opere no sistema.`
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedStore?.approved !== false && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 my-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Atenção</h4>
                  <p className="text-sm text-yellow-700">
                    A desativação da loja impedirá o processamento de novas transações.
                    Transações existentes não serão afetadas.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBlockDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant={selectedStore?.approved === false ? "default" : "destructive"}
              onClick={handleBlockStore}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : selectedStore?.approved === false ? "Confirmar Ativação" : "Confirmar Desativação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commission Rate Dialog */}
      <Dialog open={isCommissionDialogOpen} onOpenChange={setIsCommissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Taxa de Comissão</DialogTitle>
            <DialogDescription>
              Ajuste a taxa de comissão para {selectedStore?.name}.
              A taxa padrão do sistema é de 2%.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="commission-rate">Taxa de Comissão (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                min="0"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <BarChart className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  {parseFloat(commissionRate) > 2 
                    ? "Esta taxa é maior que a taxa padrão do sistema (2%)." 
                    : parseFloat(commissionRate) < 2
                    ? "Esta taxa é menor que a taxa padrão do sistema (2%)."
                    : "Esta é a taxa padrão do sistema."}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCommissionDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateCommission}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : "Atualizar Taxa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Store Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" /> Excluir Loja
            </DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. Tem certeza que deseja excluir esta loja permanentemente?
              Todos os dados relacionados à loja serão perdidos.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStore && (
            <div className="flex items-center space-x-4 py-2 border rounded-md p-3 bg-muted/30">
              <Avatar>
                <AvatarImage src={selectedStore.logo} />
                <AvatarFallback className="bg-accent text-white">
                  {getInitials(selectedStore.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-sm font-semibold">{selectedStore.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedStore.category}</p>
                <p className="text-xs text-muted-foreground mt-1">ID: {selectedStore.id}</p>
                <p className="text-xs text-muted-foreground">Email: {selectedStore.email || "N/A"}</p>
              </div>
            </div>
          )}
          
          <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 text-sm">
            <p className="font-medium text-destructive flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" /> Atenção
            </p>
            <p className="mt-1 text-muted-foreground">
              A exclusão afetará todas as transações e dados históricos relacionados a esta loja.
              Considere desativar a loja em vez de excluí-la completamente.
            </p>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteStore}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4" />
                  Excluir Permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stores To Delete Info */}
      {storesToDelete.length > 0 && (
        <Card className="mt-4 border-yellow-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Lojas para exclusão
            </CardTitle>
            <CardDescription>
              Foram encontradas {storesToDelete.length} lojas com emails marcados para exclusão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {storesToDelete.map((store, index) => (
                <li key={index} className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                    <span>{store.id}: {store.name || store.store_name} ({store.email})</span>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={async () => {
                      // Definir esta loja como a selecionada
                      setSelectedStore(store);
                      
                      // Executar diretamente a exclusão
                      setIsProcessing(true);
                      
                      try {
                        const storeId = store.id;
                        if (!storeId) {
                          throw new Error("ID da loja não encontrado");
                        }
                        
                        // API call to delete the store
                        const response = await apiRequest("DELETE", `/api/admin/stores/${storeId}`);
                        
                        // Verificar se a resposta é válida
                        if (response.ok) {
                          toast({
                            title: "Loja excluída",
                            description: `${store.name || store.store_name} foi excluída com sucesso.`,
                          });
                          
                          // Remover a loja da lista
                          setStoresToDelete(prev => prev.filter(s => s.id !== store.id));
                          
                          // Atualizar dados
                          queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
                          queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
                        } else {
                          throw new Error("Erro ao excluir loja");
                        }
                      } catch (error) {
                        console.error("Erro ao excluir loja:", error);
                        toast({
                          title: "Erro",
                          description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir a loja.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="ml-2">Excluir</span>
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex mt-4 justify-between">
              <Button 
                variant="outline" 
                className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                onClick={() => {
                  toast({
                    title: "Lojas marcadas para exclusão",
                    description: "Use os botões 'Excluir' ao lado de cada loja para removê-las.",
                  });
                }}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Instruções
              </Button>
              
              <Button 
                variant="destructive"
                onClick={async () => {
                  setIsProcessing(true);
                  
                  try {
                    // Processar exclusão em sequência para evitar problemas
                    for (const store of storesToDelete) {
                      try {
                        await apiRequest("DELETE", `/api/admin/stores/${store.id}`);
                      } catch (err) {
                        console.error(`Erro ao excluir loja ${store.id}:`, err);
                      }
                    }
                    
                    toast({
                      title: "Lojas excluídas",
                      description: "Todas as lojas marcadas foram excluídas.",
                    });
                    
                    // Limpar a lista
                    setStoresToDelete([]);
                    
                    // Atualizar dados
                    queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
                  } catch (error) {
                    console.error("Erro ao excluir lojas:", error);
                    toast({
                      title: "Erro",
                      description: "Ocorreu um erro ao excluir algumas lojas.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Excluir Todas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
