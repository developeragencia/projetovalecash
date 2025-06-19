import { useState, useRef, ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Shield, User, Lock, Bell, Loader2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function AdminProfile() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  // Query to get user profile data
  const { 
    data: user, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['/api/admin/profile'],
    retry: 2,
    refetchOnWindowFocus: false,
    onError: (error: any) => {
      console.error("Erro ao carregar perfil:", error);
      setError(error?.message || "Não foi possível carregar seus dados de perfil.");
    }
  });

  // Dados de usuário com fallback seguro
  const userData = user ? {
    ...user,
    notifications: user.notifications || {
      email: true,
      push: true,
      security: true
    },
    security: user.security || {
      twoFactor: false,
      sessionTimeout: 30,
      ipRestriction: false
    }
  } : {
    id: authUser?.id || 0,
    name: authUser?.name || "Administrador",
    email: authUser?.email || "",
    photo: authUser?.photo || "",
    phone: "",
    role: "Administrador",
    permissions: [],
    notifications: {
      email: true,
      push: true,
      security: true
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      ipRestriction: false
    }
  };

  // Mutation para atualizar a foto de perfil
  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      // Feedback imediato - atualizando a UI antes da resposta da API
      const tempUrl = URL.createObjectURL(file);
      
      // Atualiza temporariamente a imagem antes da resposta do servidor
      queryClient.setQueryData(['/api/admin/profile'], (old: any) => ({
        ...old,
        photo: tempUrl
      }));
      
      // Converter a imagem para uma string base64
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64data = reader.result as string;
          resolve(base64data);
        };
        reader.onerror = () => {
          reject(new Error("Falha ao processar a imagem"));
        };
      }).then(async (base64data) => {
        // Enviar a string base64 para o backend
        const response = await apiRequest("POST", "/api/admin/profile/photo", {
          photo: base64data
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Falha ao atualizar foto");
        }
        return response.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso."
      });
      queryClient.invalidateQueries({queryKey: ['/api/admin/profile']});
    },
    onError: (error) => {
      // Revalidar a query para reverter a alteração temporária em caso de erro
      queryClient.invalidateQueries({queryKey: ['/api/admin/profile']});
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar a foto. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Função para lidar com o upload de foto
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validações básicas
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive"
        });
        return;
      }

      // Enviar o arquivo
      photoMutation.mutate(file);
    }
  };

  // Função para abrir o seletor de arquivo
  const triggerPhotoFileInput = () => {
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string
    };

    try {
      const response = await apiRequest("PATCH", "/api/admin/profile", data);
      
      if (response.ok) {
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram atualizadas com sucesso."
        });
        queryClient.invalidateQueries({queryKey: ['/api/admin/profile']});
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao atualizar perfil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o perfil. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const currentPassword = formData.get('current-password') as string;
    const newPassword = formData.get('new-password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive"
      });
      setIsChangingPassword(false);
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/admin/profile/password", {
        currentPassword,
        newPassword
      });
      
      if (response.ok) {
        toast({
          title: "Senha alterada",
          description: "Sua senha foi alterada com sucesso."
        });
        form.reset();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao alterar senha");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao alterar a senha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
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

  return (
    <DashboardLayout title="Perfil do Administrador" type="admin">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="personal" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>Pessoal</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Lock className="mr-2 h-4 w-4" />
              <span>Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              <span>Preferências</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate}>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0 flex flex-col items-center space-y-3">
                      {/* Foto com clique fácil para upload */}
                      <div 
                        className="relative group cursor-pointer hover:shadow-lg transition-all duration-300 rounded-full overflow-hidden ring-2 ring-offset-2 ring-primary/50"
                        onClick={triggerPhotoFileInput}
                      >
                        <Avatar className="h-28 w-28 border-4 border-white shadow">
                          <AvatarImage src={userData.photo} alt={userData.name} />
                          <AvatarFallback className="text-2xl bg-primary text-white">
                            {getInitials(userData.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col items-center justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 text-white mb-1" />
                          <span className="text-white text-xs font-medium">Alterar foto</span>
                        </div>
                      </div>
                      
                      {/* Input file escondido */}
                      <input 
                        type="file" 
                        ref={photoInputRef} 
                        onChange={handlePhotoUpload} 
                        accept="image/jpeg, image/png, image/gif, image/webp" 
                        className="hidden" 
                      />
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input id="name" name="name" defaultValue={userData.name} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" name="email" type="email" defaultValue={userData.email} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" name="phone" defaultValue={userData.phone || ''} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Cargo/Função</Label>
                        <Input id="role" name="role" defaultValue={userData.role || 'Administrador'} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : "Salvar alterações"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Atualize sua senha para manter sua conta segura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha atual</Label>
                    <Input id="current-password" name="current-password" type="password" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova senha</Label>
                    <Input id="new-password" name="new-password" type="password" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" required />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Alterando...
                        </>
                      ) : "Alterar senha"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>
                  Configurações adicionais de segurança para administradores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação de dois fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Adicione uma camada extra de segurança à sua conta
                    </p>
                  </div>
                  <Switch checked={userData.security.twoFactor} />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Restrição de IP</Label>
                    <p className="text-sm text-muted-foreground">
                      Limite o acesso à conta apenas a endereços IP específicos
                    </p>
                  </div>
                  <Switch checked={userData.security.ipRestriction} />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Tempo limite da sessão (minutos)</Label>
                    <p className="text-sm text-muted-foreground">
                      Defina o tempo até que a sessão expire por inatividade
                    </p>
                  </div>
                  <Input 
                    className="w-20 text-right" 
                    type="number" 
                    min="5" 
                    max="60" 
                    defaultValue={userData.security.sessionTimeout.toString()}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Settings */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure como você deseja receber as notificações administrativas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações por e-mail
                    </p>
                  </div>
                  <Switch checked={userData.notifications.email} />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações push no seu dispositivo
                    </p>
                  </div>
                  <Switch checked={userData.notifications.push} />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Alertas de segurança</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas sobre eventos críticos de segurança
                    </p>
                  </div>
                  <Switch checked={userData.notifications.security} />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Interface administrativa</CardTitle>
                <CardDescription>
                  Personalize sua experiência no painel administrativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo escuro</Label>
                    <p className="text-sm text-muted-foreground">
                      Alterne entre o tema claro e escuro
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Mensagens do sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar mensagens e alertas do sistema
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}