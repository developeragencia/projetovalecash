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
import { formatSafeDate } from "@/lib/date-utils";

export default function AdminStores() {
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
  const [commissionRate, setCommissionRate] = useState<string>("2.0");
  
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
    onSuccess: () => {
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

  const handleCommissionDialog = (store: any) => {
    setSelectedStore(store);
    setCommissionRate(store.commissionRate?.toString() || "2.0");
    setIsCommissionDialogOpen(true);
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

  // Define columns for the data table
  const columns = [
    {
      accessorKey: "store_name",
      header: "Nome da Loja",
      cell: ({ row }: any) => row.original.store_name || row.original.name || "N/A",
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }: any) => row.original.category || "N/A",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }: any) => row.original.email || "N/A",
    },
    {
      accessorKey: "phone",
      header: "Telefone",
      cell: ({ row }: any) => row.original.phone || "N/A",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
          {row.original.status === 'active' ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardLayout title="Lojas" type="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Lojas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as lojas cadastradas no sistema.
          </p>
        </div>

        <DataTable
          data={storesData}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
        />

        {/* Store Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Loja</DialogTitle>
              <DialogDescription>
                Informações completas sobre a loja selecionada
              </DialogDescription>
            </DialogHeader>
            
            {selectedStore && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Store className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{selectedStore.store_name || selectedStore.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedStore.category || "Categoria não informada"}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedStore.email || "Email não informado"}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedStore.phone || "Telefone não informado"}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {[selectedStore.address, selectedStore.city, selectedStore.state].filter(Boolean).join(", ") || "Endereço não informado"}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">CNPJ: {selectedStore.cnpj || "Não informado"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {selectedStore.total_sales || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Total de Vendas</div>
                      </div>
                      
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${(selectedStore.revenue || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Receita Total</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={selectedStore.status === 'active' ? 'default' : 'secondary'}>
                          {selectedStore.status === 'active' ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Taxa de Comissão:</span>
                        <span className="text-sm font-medium">{selectedStore.commission_rate || 2}%</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Data de Cadastro:</span>
                        <span className="text-sm">
                          {formatSafeDate(selectedStore.created_at, 'short')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedStore.description && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Descrição</h4>
                    <p className="text-sm text-muted-foreground">{selectedStore.description}</p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => {
                setIsDialogOpen(false);
                handleEditStore(selectedStore);
              }}>
                Editar Loja
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Store Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Loja</DialogTitle>
              <DialogDescription>
                Atualize as informações da loja selecionada
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Loja</Label>
                <Input
                  value={editForm.store_name}
                  onChange={(e) => setEditForm({...editForm, store_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={editForm.category}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={editForm.cnpj}
                  onChange={(e) => setEditForm({...editForm, cnpj: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Email</Label>
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={editForm.state}
                  onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateStoreMutation.isPending}>
                {updateStoreMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a loja "{selectedStore?.store_name || selectedStore?.name}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                disabled={deleteStoreMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteStoreMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Status Toggle Dialog */}
        <AlertDialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alterar Status</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja {selectedStore?.status === 'active' ? 'desativar' : 'ativar'} a loja "{selectedStore?.store_name || selectedStore?.name}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleToggleStatus}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedStore?.status === 'active' ? 'Desativar' : 'Ativar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Commission Dialog */}
        <Dialog open={isCommissionDialogOpen} onOpenChange={setIsCommissionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atualizar Taxa de Comissão</DialogTitle>
              <DialogDescription>
                Defina a taxa de comissão para a loja "{selectedStore?.store_name || selectedStore?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Taxa de Comissão (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCommissionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateCommission} disabled={updateCommissionMutation.isPending}>
                {updateCommissionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Atualizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}