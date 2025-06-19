import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
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
  SelectValue 
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Activity,
  Clock,
  Loader2,
  Filter,
  UserPlus,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Wallet,
  CreditCard,
  Users,
  Store,
  Save,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Unlock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  type: 'client' | 'merchant' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  created_at: string;
  last_login?: string;
  balance?: string;
  total_earned?: string;
  total_spent?: string;
  store_name?: string;
  merchant_approved?: boolean;
}

interface UserDetails extends User {
  recentTransactions: Array<{
    id: number;
    amount: string;
    cashback_amount: string;
    description: string;
    status: string;
    payment_method: string;
    created_at: string;
    merchant_name?: string;
  }>;
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  type: 'client' | 'merchant' | 'admin';
  address: string;
  city: string;
  state: string;
  country: string;
}

interface EditUserForm {
  name: string;
  email: string;
  phone: string;
  type: 'client' | 'merchant' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  address: string;
  city: string;
  state: string;
  country: string;
}

interface BalanceOperation {
  amount: string;
  description: string;
}

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    name: "", email: "", password: "", confirmPassword: "", phone: "",
    type: "client", address: "", city: "", state: "", country: "Brasil"
  });
  
  const [editForm, setEditForm] = useState<EditUserForm>({
    name: "", email: "", phone: "", type: "client", status: "active",
    address: "", city: "", state: "", country: "Brasil"
  });
  
  const [balanceForm, setBalanceForm] = useState<BalanceOperation>({
    amount: "", description: ""
  });
  
  const [newPassword, setNewPassword] = useState("");
  const [balanceOperation, setBalanceOperation] = useState<'add' | 'remove'>('add');
  
  const { toast } = useToast();
  
  // Carregar lista de usuários
  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return await response.json();
    }
  });
  
  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm));
    const matchesType = typeFilter === "all" || user.type === typeFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserForm) => {
      const response = await apiRequest("POST", "/api/admin/users", userData);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso" });
      setShowCreateDialog(false);
      setCreateForm({
        name: "", email: "", password: "", confirmPassword: "", phone: "",
        type: "client", address: "", city: "", state: "", country: "Brasil"
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  });
  
  // Mutation para editar usuário
  const editUserMutation = useMutation({
    mutationFn: async ({ id, ...userData }: EditUserForm & { id: number }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${id}`, userData);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário atualizado com sucesso" });
      setShowEditDialog(false);
      setSelectedUser(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  });
  
  // Mutation para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário excluído com sucesso" });
      setShowDeleteDialog(false);
      setSelectedUser(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  });
  
  // Mutation para gerenciar saldo
  const balanceMutation = useMutation({
    mutationFn: async ({ userId, operation, amount, description }: {
      userId: number;
      operation: 'add' | 'remove';
      amount: number;
      description: string;
    }) => {
      if (operation === 'add') {
        const response = await apiRequest("POST", `/api/admin/users/${userId}/balance`, {
          amount, description
        });
        return await response.json();
      } else {
        const response = await apiRequest("DELETE", `/api/admin/users/${userId}/balance`, {
          amount, description
        });
        return await response.json();
      }
    },
    onSuccess: () => {
      toast({ title: "Saldo atualizado com sucesso" });
      setShowBalanceDialog(false);
      setBalanceForm({ amount: "", description: "" });
      refetch();
      if (userDetails) {
        loadUserDetails(userDetails.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar saldo",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  });
  
  // Mutation para redefinir senha
  const passwordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number; password: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/password`, {
        password
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Senha redefinida com sucesso" });
      setShowPasswordDialog(false);
      setNewPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  });
  
  // Carregar detalhes do usuário
  const loadUserDetails = async (userId: number) => {
    try {
      const response = await apiRequest("GET", `/api/admin/users/${userId}`);
      const details = await response.json();
      setUserDetails(details);
    } catch (error) {
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar os detalhes do usuário",
        variant: "destructive"
      });
    }
  };
  
  // Handlers
  const handleCreateUser = () => {
    if (createForm.password !== createForm.confirmPassword) {
      toast({
        title: "Erro de validação",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }
    
    if (createForm.password.length < 6) {
      toast({
        title: "Erro de validação",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    
    createUserMutation.mutate(createForm);
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      type: user.type,
      status: user.status,
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      country: user.country || "Brasil"
    });
    setShowEditDialog(true);
  };
  
  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    await loadUserDetails(user.id);
    setShowDetailsDialog(true);
  };
  
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };
  
  const handleManageBalance = (user: User) => {
    setSelectedUser(user);
    setBalanceForm({ amount: "", description: "" });
    setShowBalanceDialog(true);
  };
  
  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowPasswordDialog(true);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspenso</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'client':
        return <Badge variant="secondary">Cliente</Badge>;
      case 'merchant':
        return <Badge variant="outline">Comerciante</Badge>;
      case 'admin':
        return <Badge variant="destructive">Administrador</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };
  
  return (
    <DashboardLayout title="Gerenciamento de Usuários" type="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie todos os usuários do sistema - criar, editar, excluir e controlar saldos
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total de Usuários</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Clientes</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.type === 'client').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Store className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Comerciantes</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.type === 'merchant').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">Usuários Ativos</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtros e Busca */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Tipo de usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="client">Clientes</SelectItem>
                  <SelectItem value="merchant">Comerciantes</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="suspended">Suspensos</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabela de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.phone && (
                              <p className="text-xs text-muted-foreground">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(user.type)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.type === 'client' && (
                          <div className="text-sm">
                            <p className="font-medium">R$ {parseFloat(user.balance || "0").toFixed(2)}</p>
                            <p className="text-muted-foreground">
                              Total: R$ {parseFloat(user.total_earned || "0").toFixed(2)}
                            </p>
                          </div>
                        )}
                        {user.type === 'merchant' && user.store_name && (
                          <div className="text-sm">
                            <p className="font-medium">{user.store_name}</p>
                            <p className="text-muted-foreground">
                              {user.merchant_approved ? 'Aprovado' : 'Pendente'}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.type === 'client' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleManageBalance(user)}
                            >
                              <Wallet className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user)}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog Criar Usuário */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nome Completo</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                placeholder="Digite o nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-password">Senha</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                placeholder="Digite a senha"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-confirm-password">Confirmar Senha</Label>
              <Input
                id="create-confirm-password"
                type="password"
                value={createForm.confirmPassword}
                onChange={(e) => setCreateForm({...createForm, confirmPassword: e.target.value})}
                placeholder="Confirme a senha"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-phone">Telefone</Label>
              <Input
                id="create-phone"
                value={createForm.phone}
                onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-type">Tipo de Usuário</Label>
              <Select 
                value={createForm.type} 
                onValueChange={(value: 'client' | 'merchant' | 'admin') => 
                  setCreateForm({...createForm, type: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="merchant">Comerciante</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-address">Endereço</Label>
              <Input
                id="create-address"
                value={createForm.address}
                onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
                placeholder="Rua, número, bairro"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-city">Cidade</Label>
              <Input
                id="create-city"
                value={createForm.city}
                onChange={(e) => setCreateForm({...createForm, city: e.target.value})}
                placeholder="Nome da cidade"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-state">Estado</Label>
              <Input
                id="create-state"
                value={createForm.state}
                onChange={(e) => setCreateForm({...createForm, state: e.target.value})}
                placeholder="UF"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-country">País</Label>
              <Input
                id="create-country"
                value={createForm.country}
                onChange={(e) => setCreateForm({...createForm, country: e.target.value})}
                placeholder="Brasil"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Editar Usuário */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere os dados do usuário {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-type">Tipo de Usuário</Label>
              <Select 
                value={editForm.type} 
                onValueChange={(value: 'client' | 'merchant' | 'admin') => 
                  setEditForm({...editForm, type: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="merchant">Comerciante</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={editForm.status} 
                onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                  setEditForm({...editForm, status: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-address">Endereço</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-city">Cidade</Label>
              <Input
                id="edit-city"
                value={editForm.city}
                onChange={(e) => setEditForm({...editForm, city: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-state">Estado</Label>
              <Input
                id="edit-state"
                value={editForm.state}
                onChange={(e) => setEditForm({...editForm, state: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedUser && editUserMutation.mutate({ id: selectedUser.id, ...editForm })}
              disabled={editUserMutation.isPending}
            >
              {editUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Detalhes do Usuário */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          {userDetails && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="balance">Saldo</TabsTrigger>
                <TabsTrigger value="transactions">Transações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Nome</Label>
                        <p className="text-sm">{userDetails.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm">{userDetails.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Telefone</Label>
                        <p className="text-sm">{userDetails.phone || "Não informado"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Tipo</Label>
                        <p className="text-sm">{getTypeBadge(userDetails.type)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <p className="text-sm">{getStatusBadge(userDetails.status)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Endereço</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Endereço</Label>
                        <p className="text-sm">{userDetails.address || "Não informado"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Cidade</Label>
                        <p className="text-sm">{userDetails.city || "Não informado"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Estado</Label>
                        <p className="text-sm">{userDetails.state || "Não informado"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">País</Label>
                        <p className="text-sm">{userDetails.country || "Não informado"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="balance" className="space-y-4">
                {userDetails.type === 'client' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Saldo de Cashback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <p className="text-sm text-muted-foreground">Saldo Atual</p>
                          <p className="text-2xl font-bold text-green-600">
                            R$ {parseFloat(userDetails.balance || "0").toFixed(2)}
                          </p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-sm text-muted-foreground">Total Ganho</p>
                          <p className="text-2xl font-bold text-blue-600">
                            R$ {parseFloat(userDetails.total_earned || "0").toFixed(2)}
                          </p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <CreditCard className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                          <p className="text-sm text-muted-foreground">Total Gasto</p>
                          <p className="text-2xl font-bold text-orange-600">
                            R$ {parseFloat(userDetails.total_spent || "0").toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="transactions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Últimas Transações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetails.recentTransactions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Cashback</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetails.recentTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>R$ {parseFloat(transaction.amount).toFixed(2)}</TableCell>
                              <TableCell>R$ {parseFloat(transaction.cashback_amount).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                                  {transaction.status === 'completed' ? 'Concluída' : transaction.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma transação encontrada
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog Gerenciar Saldo */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Saldo</DialogTitle>
            <DialogDescription>
              Adicionar ou remover saldo de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={balanceOperation === 'add' ? 'default' : 'outline'}
                onClick={() => setBalanceOperation('add')}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
              <Button
                variant={balanceOperation === 'remove' ? 'default' : 'outline'}
                onClick={() => setBalanceOperation('remove')}
                className="flex-1"
              >
                <Minus className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="balance-amount">
                Valor (R$) para {balanceOperation === 'add' ? 'adicionar' : 'remover'}
              </Label>
              <Input
                id="balance-amount"
                type="number"
                step="0.01"
                min="0"
                value={balanceForm.amount}
                onChange={(e) => setBalanceForm({...balanceForm, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="balance-description">Motivo da operação</Label>
              <Textarea
                id="balance-description"
                value={balanceForm.description}
                onChange={(e) => setBalanceForm({...balanceForm, description: e.target.value})}
                placeholder="Descreva o motivo desta operação..."
                rows={3}
              />
            </div>
            
            {selectedUser && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Saldo atual:</p>
                <p className="text-lg font-bold">
                  R$ {parseFloat(selectedUser.balance || "0").toFixed(2)}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBalanceDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedUser && balanceForm.amount) {
                  balanceMutation.mutate({
                    userId: selectedUser.id,
                    operation: balanceOperation,
                    amount: parseFloat(balanceForm.amount),
                    description: balanceForm.description
                  });
                }
              }}
              disabled={balanceMutation.isPending || !balanceForm.amount}
            >
              {balanceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {balanceOperation === 'add' ? 'Adicionar' : 'Remover'} Saldo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Redefinir Senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Definir nova senha para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
              <p className="text-xs text-muted-foreground">
                A senha deve ter pelo menos 6 caracteres
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedUser && newPassword.length >= 6) {
                  passwordMutation.mutate({
                    userId: selectedUser.id,
                    password: newPassword
                  });
                }
              }}
              disabled={passwordMutation.isPending || newPassword.length < 6}
            >
              {passwordMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Redefinir Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Gerenciar Saldo */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Saldo</DialogTitle>
            <DialogDescription>
              Adicionar ou remover saldo do usuário {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
              <Wallet className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Saldo Atual</p>
                <p className="text-lg font-bold text-blue-600">
                  R$ {selectedUser?.balance || '0,00'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Operação</Label>
              <Select value={balanceOperation} onValueChange={(value: 'add' | 'remove') => setBalanceOperation(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-600" />
                      Adicionar Saldo
                    </div>
                  </SelectItem>
                  <SelectItem value="remove">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-600" />
                      Remover Saldo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="balance-amount">Valor</Label>
              <Input
                id="balance-amount"
                type="number"
                step="0.01"
                min="0"
                value={balanceForm.amount}
                onChange={(e) => setBalanceForm({...balanceForm, amount: e.target.value})}
                placeholder="0,00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="balance-description">Descrição</Label>
              <Input
                id="balance-description"
                value={balanceForm.description}
                onChange={(e) => setBalanceForm({...balanceForm, description: e.target.value})}
                placeholder="Motivo da operação"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBalanceDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedUser && balanceForm.amount && balanceForm.description) {
                  balanceMutation.mutate({
                    userId: selectedUser.id,
                    operation: balanceOperation,
                    amount: parseFloat(balanceForm.amount),
                    description: balanceForm.description
                  });
                }
              }}
              disabled={balanceMutation.isPending || !balanceForm.amount || !balanceForm.description}
            >
              {balanceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {balanceOperation === 'add' ? 'Adicionar' : 'Remover'} Saldo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir Usuário */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Tem certeza que deseja excluir o usuário {selectedUser?.name}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Atenção!</p>
              <p className="text-xs text-red-600">
                Todos os dados relacionados a este usuário serão permanentemente removidos.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}