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
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Eye, 
  Edit, 
  Lock, 
  Loader2,
  UserPlus,
  RefreshCw,
  Wallet,
  Plus,
  Minus,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  type: 'client' | 'merchant' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  balance?: string;
  created_at: string;
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  type: 'client' | 'merchant' | 'admin';
}

interface EditUserForm {
  name: string;
  email: string;
  phone: string;
  type: 'client' | 'merchant' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
}

interface BalanceOperation {
  amount: string;
  description: string;
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    name: "", email: "", password: "", confirmPassword: "", phone: "",
    type: "client"
  });
  
  const [editForm, setEditForm] = useState<EditUserForm>({
    name: "", email: "", phone: "", type: "client", status: "active"
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
        type: "client"
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
    mutationFn: async ({ userId, userData }: { userId: number; userData: EditUserForm }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}`, userData);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário atualizado com sucesso" });
      setShowEditDialog(false);
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Usuário excluído com sucesso",
        description: `${data.deletedUser?.name || 'Usuário'} foi removido do sistema`
      });
      setShowDeleteDialog(false);
      setSelectedUser(null);
      // Invalidar cache e recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      refetch();
    },
    onError: (error: any) => {
      console.error("Erro ao excluir usuário:", error);
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro inesperado ao excluir o usuário",
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
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/balance`, {
        operation,
        amount,
        description
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Saldo atualizado com sucesso" });
      setShowBalanceDialog(false);
      setBalanceForm({ amount: "", description: "" });
      refetch();
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
      status: user.status
    });
    setShowEditDialog(true);
  };
  
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };
  
  const handleManageBalance = (user: User) => {
    setSelectedUser(user);
    setShowBalanceDialog(true);
  };
  
  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
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
        return <Badge className="bg-blue-100 text-blue-800">Cliente</Badge>;
      case 'merchant':
        return <Badge className="bg-purple-100 text-purple-800">Lojista</Badge>;
      case 'admin':
        return <Badge className="bg-orange-100 text-orange-800">Admin</Badge>;
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
              Gerencie todos os usuários do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>
        
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="client">Clientes</SelectItem>
                    <SelectItem value="merchant">Lojistas</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="suspended">Suspensos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Lista de usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getTypeBadge(user.type)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.type === 'client' ? `$${parseFloat(user.balance || '0').toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
                placeholder="+55 (11) 99999-9999"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Usuário</Label>
              <Select value={createForm.type} onValueChange={(value: 'client' | 'merchant' | 'admin') => setCreateForm({...createForm, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="merchant">Lojista</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Edite as informações do usuário {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
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
              <Label>Tipo</Label>
              <Select value={editForm.type} onValueChange={(value: 'client' | 'merchant' | 'admin') => setEditForm({...editForm, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="merchant">Lojista</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(value: 'active' | 'inactive' | 'suspended') => setEditForm({...editForm, status: value})}>
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedUser && editUserMutation.mutate({ userId: selectedUser.id, userData: editForm })}
              disabled={editUserMutation.isPending}
            >
              {editUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar
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
      
      {/* Dialog Redefinir Senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Digite uma nova senha para o usuário {selectedUser?.name}
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
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                A nova senha deve ter pelo menos 6 caracteres.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedUser && passwordMutation.mutate({ userId: selectedUser.id, password: newPassword })}
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