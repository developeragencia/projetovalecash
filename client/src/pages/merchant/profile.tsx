import { useState, useRef, ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Timer, Store, GanttChart, Clock, MapPin, Phone, Mail, Globe, User, Loader2, Camera, ShieldAlert, CheckCircle, AlertCircle, Settings, Calendar, Ban, ChevronUp, ChevronDown, RefreshCw, DollarSign, PercentIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

export default function MerchantProfile() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [selectedTab, setSelectedTab] = useState("general");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Query to get merchant profile data
  const { data: merchant, isLoading } = useQuery({
    queryKey: ['/api/merchant/profile'],
  });

  // Query to get merchant statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/merchant/stats'],
    enabled: !!merchant, // Only fetch stats when merchant data is available
  });

  // Handle received merchant data and map API fields correctly
  const merchantData = merchant ? {
    id: merchant.id,
    name: merchant.store_name || "Loja Demo",
    email: merchant.email || "contato@loja.com",
    phone: merchant.phone || "(11) 99999-9999",
    address: merchant.address || "Rua Principal, 123",
    city: merchant.city || "São Paulo",
    state: merchant.state || "SP",
    country: merchant.country || "Brasil",
    status: merchant.approved ? "approved" : "pending",
    category: merchant.category || "Comércio",
    description: merchant.description || "Loja parceira do Vale Cashback com produtos de qualidade e ótimo atendimento.",
    business_hours: merchant.business_hours || "Seg-Sex: 08:00-18:00, Sáb: 08:00-14:00",
    logo: merchant.logo || merchant.company_logo,
    photo: merchant.photo,
    owner: merchant.owner || "Lojista Demo",
    created_at: merchant.created_at,
    invitationCode: merchant.invitation_code || "INVITE003",
    approved: merchant.approved,
    cashbackRate: 2,
    commissionRate: parseFloat(merchant.commission_rate) || 5,
    totalSales: merchant.totalSales || 0,
    totalCustomers: merchant.totalCustomers || 0,
    totalCashbackIssued: merchant.totalCashbackIssued || 0,
    website: merchant.website || "www.loja.com.br",
    cashbackPromotions: {
      enabled: false,
      doubleOnWeekends: false,
      specialCategories: false,
      minimumPurchase: 0,
      firstPurchaseBonus: 10,
      birthDayBonus: 5
    }
  } : {
    id: 0,
    name: "Loja Demo",
    email: "contato@loja.com",
    phone: "(11) 99999-9999",
    address: "Rua Principal, 123",
    city: "São Paulo",
    state: "SP",
    country: "Brasil",
    status: "pending",
    category: "Comércio",
    description: "Loja parceira do Vale Cashback",
    business_hours: "Seg-Sex: 08:00-18:00",
    logo: null,
    photo: null,
    owner: "Lojista Demo",
    created_at: new Date().toISOString(),
    invitationCode: "INVITE003",
    approved: false,
    cashbackRate: 2,
    commissionRate: 5,
    cashbackTotal: 0,
    website: "www.loja.com.br",
    cashbackPromotions: {
      enabled: false,
      doubleOnWeekends: false,
      specialCategories: false,
      minimumPurchase: 0
    }
  };
  
  const merchantStats = stats || {
    totalSales: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    totalCashbackIssued: 0,
    conversionRate: 0,
    recentSales: []
  };

  // Status alerts for UI feedback
  // Ensure cashbackPromotions object exists (this may be null from API)
  const cashbackPromotions = merchantData.cashbackPromotions || {
    enabled: false,
    doubleOnWeekends: false,
    specialCategories: false,
    minimumPurchase: 0
  };
  
  // Status alerts for UI feedback
  const [statusAlerts, setStatusAlerts] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'loading';
  }>({
    show: false,
    message: '',
    type: 'loading'
  });
  
  // Mutation para atualizar a foto de perfil do lojista
  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      // Feedback imediato - atualizando a UI antes da resposta da API
      const tempUrl = URL.createObjectURL(file);
      
      // Atualiza temporariamente a imagem antes da resposta do servidor
      queryClient.setQueryData(['/api/merchant/profile'], (old: any) => ({
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
        const response = await apiRequest("POST", "/api/merchant/profile/photo", {
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
      queryClient.invalidateQueries({queryKey: ['/api/merchant/profile']});
    },
    onError: (error) => {
      // Revalidar a query para reverter a alteração temporária em caso de erro
      queryClient.invalidateQueries({queryKey: ['/api/merchant/profile']});
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar a foto. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  // Create direct mutation for logo upload with immediate feedback
  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      // Mostrar alerta de carregamento
      setStatusAlerts({
        show: true,
        message: 'Atualizando o logo da loja...',
        type: 'loading'
      });
      
      // Feedback imediato - atualizando a UI antes da resposta da API
      const tempUrl = URL.createObjectURL(file);
      
      // Atualiza temporariamente a imagem antes da resposta do servidor
      queryClient.setQueryData(['/api/merchant/profile'], (old: any) => ({
        ...old,
        logo: tempUrl
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
        const response = await apiRequest("POST", "/api/merchant/profile/logo", {
          logo: base64data
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Falha ao atualizar logo");
        }
        return response.json();
      });
    },
    onSuccess: () => {
      // Atualizar alerta para sucesso
      setStatusAlerts({
        show: true,
        message: 'Logo atualizado com sucesso!',
        type: 'success'
      });
      
      toast({
        title: "Logo atualizado",
        description: "A imagem da loja foi atualizada com sucesso."
      });
      
      queryClient.invalidateQueries({queryKey: ['/api/merchant/profile']});
      
      // Esconder o alerta após 3 segundos
      setTimeout(() => {
        setStatusAlerts(prev => ({ ...prev, show: false }));
      }, 3000);
    },
    onError: (error) => {
      // Atualizar alerta para erro
      setStatusAlerts({
        show: true,
        message: error instanceof Error ? error.message : "Falha ao atualizar logo",
        type: 'error'
      });
      
      // Revalidar a query para reverter a alteração temporária em caso de erro
      queryClient.invalidateQueries({queryKey: ['/api/merchant/profile']});
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar a logo. Tente novamente.",
        variant: "destructive"
      });
      
      // Esconder o alerta após 3 segundos
      setTimeout(() => {
        setStatusAlerts(prev => ({ ...prev, show: false }));
      }, 3000);
    },
    onSettled: () => {
      setUploadingLogo(false);
    }
  });

  // Função para converter o status em formato legível
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'ativo':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>;
      case 'pending':
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'suspended':
      case 'suspenso':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Suspenso</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Desconhecido</Badge>;
    }
  };

  // Função simplificada para lidar com o upload de logo
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validações básicas sem interromper o fluxo com mensagens complexas
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive"
        });
        return;
      }

      // Enviar o arquivo imediatamente
      setUploadingLogo(true);
      logoMutation.mutate(file);
    }
  };
  
  // Função para lidar com o upload de foto de perfil
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validações básicas sem interromper o fluxo com mensagens complexas
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive"
        });
        return;
      }

      // Enviar o arquivo imediatamente
      photoMutation.mutate(file);
    }
  };

  // Função simplificada para abrir o seletor de arquivo diretamente
  const triggerLogoFileInput = () => {
    if (logoInputRef.current) {
      logoInputRef.current.click();
    }
  };
  
  // Função para abrir o seletor de arquivo para foto de perfil
  const triggerPhotoFileInput = () => {
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  };

  // Função para atualizar o status de ativo/inativo da loja
  const handleStoreStatusChange = async (checked: boolean) => {
    try {
      const response = await apiRequest("PATCH", "/api/merchant/profile/status", {
        active: checked
      });
      
      if (response.ok) {
        toast({
          title: checked ? "Loja ativada" : "Loja desativada",
          description: checked 
            ? "Sua loja está agora visível para os clientes." 
            : "Sua loja está temporariamente invisível para os clientes."
        });
        queryClient.invalidateQueries({queryKey: ['/api/merchant/profile']});
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao atualizar status da loja");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o status da loja.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setIsUpdating(true);

    try {
      // Get form data
      const formData = new FormData(form);
      const data = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        website: formData.get('website') as string,
        category: formData.get('category') as string,
        owner: formData.get('owner') as string,
        business_hours: formData.get('business_hours') as string
      };
      
      // Make API call
      const response = await apiRequest("PATCH", "/api/merchant/profile", data);
      
      if (response.ok) {
        toast({
          title: "Perfil atualizado",
          description: "As informações da loja foram atualizadas com sucesso."
        });
        
        // Refresh profile data
        queryClient.invalidateQueries({queryKey: ['/api/merchant/profile']});
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
  
  // Função para atualizar a senha do usuário
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setIsChangingPassword(true);
    
    try {
      const formData = new FormData(form);
      const currentPassword = formData.get('current_password') as string;
      const newPassword = formData.get('new_password') as string;
      const confirmPassword = formData.get('confirm_password') as string;
      
      // Validação simples no cliente
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast({
          title: "Campos obrigatórios",
          description: "Todos os campos são obrigatórios para alterar sua senha.",
          variant: "destructive"
        });
        return;
      }
      
      if (newPassword !== confirmPassword) {
        toast({
          title: "Senhas não coincidem",
          description: "A nova senha e a confirmação devem ser idênticas.",
          variant: "destructive"
        });
        return;
      }
      
      if (newPassword.length < 6) {
        toast({
          title: "Senha muito curta",
          description: "A nova senha deve ter pelo menos 6 caracteres.",
          variant: "destructive"
        });
        return;
      }
      
      // Fazer chamada API
      const response = await apiRequest("POST", "/api/merchant/change-password", {
        currentPassword,
        newPassword
      });
      
      if (response.ok) {
        toast({
          title: "Senha alterada",
          description: "Sua senha foi atualizada com sucesso."
        });
        
        // Limpar o formulário
        form.reset();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao alterar senha");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao alterar sua senha. Tente novamente.",
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
    <DashboardLayout title="Perfil da Loja" type="merchant">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px] rounded-xl shadow-sm">
            <TabsTrigger value="general" className="flex items-center h-12">
              <Store className="mr-2 h-4 w-4" />
              <span>Informações Gerais</span>
            </TabsTrigger>
            <TabsTrigger value="cashback" className="flex items-center h-12">
              <GanttChart className="mr-2 h-4 w-4" />
              <span>Cashback</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center h-12">
              <ShieldAlert className="mr-2 h-4 w-4" />
              <span>Segurança</span>
            </TabsTrigger>
          </TabsList>

          {/* General Information */}
          <TabsContent value="general">
            <div className="flex flex-col p-8 mb-6 bg-gradient-to-br from-primary/10 via-accent/5 to-background rounded-xl shadow-md">
              <div className="w-full flex flex-col items-center justify-center mb-6">
                {/* Logo da loja - Agora no topo e centralizado em todas as versões */}
                <div
                  onClick={triggerLogoFileInput}
                  className="relative cursor-pointer group transition duration-300 transform hover:scale-105 mb-4"
                >
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <Camera className="text-white opacity-0 group-hover:opacity-100 h-8 w-8" />
                  </div>
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage src={merchantData.logo} alt={merchantData.name} />
                    <AvatarFallback className="text-2xl bg-accent text-white">
                      {getInitials(merchantData.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center mt-2 text-sm text-primary font-medium">
                    Logo da Loja
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Foto do proprietário */}
                <div onClick={triggerPhotoFileInput} className="relative cursor-pointer group transition duration-300 transform hover:scale-105">
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <Camera className="text-white opacity-0 group-hover:opacity-100 h-6 w-6" />
                  </div>
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={merchantData.photo} alt={merchantData.owner || merchantData.name} />
                    <AvatarFallback className="text-xl bg-primary text-white">
                      {getInitials(merchantData.owner || merchantData.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center mt-2 text-xs text-muted-foreground">
                    Foto de Perfil
                  </div>
                </div>
                
                {/* Info do lojista */}
                <div className="flex flex-col items-center md:items-start gap-2 mt-4 md:mt-0 flex-1">
                  <Badge variant={merchantData.approved ? "default" : "outline"} className="mb-1 px-3 py-1 font-medium">
                    {merchantData.approved ? "Aprovado" : "Aprovação Pendente"}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold text-center md:text-left">{merchantData.name}</h2>
                  <p className="text-muted-foreground text-sm text-center md:text-left">Lojista desde {new Date(merchantData.created_at).toLocaleDateString()}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                    <Badge variant="outline" className="px-3 py-1 text-sm bg-background">
                      {merchantData.category || "Categoria não definida"}
                    </Badge>
                    {getStatusBadge(merchantData.status)}
                  </div>
                </div>
              </div>
              
              {/* Inputs file escondidos */}
              <input 
                type="file" 
                ref={logoInputRef} 
                onChange={handleLogoUpload} 
                accept="image/jpeg, image/png, image/gif, image/webp" 
                className="hidden" 
              />
              
              <input 
                type="file" 
                ref={photoInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/jpeg, image/png, image/gif, image/webp" 
                className="hidden" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-2">
                    <DollarSign className="w-10 h-10 text-accent mb-2" />
                    <p className="text-sm text-muted-foreground">Total em Vendas</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(merchantStats.totalSales)}</h3>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-2">
                    <User className="w-10 h-10 text-accent mb-2" />
                    <p className="text-sm text-muted-foreground">Total de Clientes</p>
                    <h3 className="text-2xl font-bold">{merchantStats.totalCustomers}</h3>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-2">
                    <PercentIcon className="w-10 h-10 text-accent mb-2" />
                    <p className="text-sm text-muted-foreground">Total em Cashback</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(merchantStats.totalCashbackIssued)}</h3>
                  </div>
                </CardContent>
              </Card>
            </div>
          
            <Card>
              <CardHeader>
                <CardTitle>Informações da Loja</CardTitle>
                <CardDescription>
                  Atualize as informações da sua loja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile}>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0 flex flex-col items-center md:items-start">
                      <Label htmlFor="store-status" className="mb-2 font-medium text-sm text-gray-600">Status da Loja</Label>
                      <div className="flex items-center space-x-2 mb-6">
                        <Switch 
                          id="store-status" 
                          checked={merchantData.status === "active"} 
                          onCheckedChange={handleStoreStatusChange}
                        />
                        <span className="text-sm">
                          {merchantData.status === "active" ? "Loja Ativa" : "Loja Inativa"}
                        </span>
                      </div>
                      
                      {/* Inputs file escondidos (mantidos) */}
                      <input 
                        type="file" 
                        ref={logoInputRef} 
                        onChange={handleLogoUpload} 
                        accept="image/jpeg, image/png, image/gif, image/webp" 
                        className="hidden" 
                      />
                      
                      <input 
                        type="file" 
                        ref={photoInputRef} 
                        onChange={handlePhotoUpload} 
                        accept="image/jpeg, image/png, image/gif, image/webp" 
                        className="hidden" 
                      />
                      
                      {/* Status da loja */}
                      <div className="flex flex-col items-center gap-2">
                        {uploadingLogo && (
                          <div className="flex items-center text-accent">
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            <span className="text-xs">Atualizando logo...</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(merchantData.status || 'pending')}
                        </div>
                        
                        <div className="mt-2 flex items-center gap-2">
                          <Switch 
                            id="active-status" 
                            checked={merchantData.status === 'active'} 
                            onCheckedChange={handleStoreStatusChange}
                          />
                          <Label htmlFor="active-status" className="text-sm cursor-pointer">
                            {merchantData.status === 'active' ? 'Loja Ativa' : 'Loja Inativa'}
                          </Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da Loja</Label>
                        <Input id="name" name="name" defaultValue={merchantData.name} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <select 
                          id="category" 
                          name="category"
                          defaultValue={merchantData.category}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="Supermercado">Supermercado</option>
                          <option value="Restaurante">Restaurante</option>
                          <option value="Farmácia">Farmácia</option>
                          <option value="Posto de Combustível">Posto de Combustível</option>
                          <option value="Vestuário">Vestuário</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea 
                          id="description" 
                          name="description"
                          defaultValue={merchantData.description}
                          rows={3} 
                          placeholder="Descreva sua loja em poucas palavras"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="owner">Responsável</Label>
                        <Input 
                          id="owner" 
                          name="owner" 
                          defaultValue={merchantData.owner} 
                          placeholder="Nome do proprietário/responsável"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          defaultValue={merchantData.email}
                          placeholder="contato@minhaloja.com" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          defaultValue={merchantData.phone}
                          placeholder="(00) 00000-0000" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input 
                          id="website" 
                          name="website" 
                          defaultValue={merchantData.website}
                          placeholder="www.minhaloja.com" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input 
                          id="address" 
                          name="address" 
                          defaultValue={merchantData.address}
                          placeholder="Rua, número" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="city-state">Cidade/Estado</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="city" 
                            name="city"
                            defaultValue={merchantData.city}
                            placeholder="Cidade"
                            className="flex-1" 
                          />
                          <Input 
                            id="state" 
                            name="state"
                            defaultValue={merchantData.state}
                            placeholder="UF"
                            className="w-20" 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="business-hours">Horário de Funcionamento</Label>
                        <Input 
                          id="business-hours" 
                          name="business_hours" 
                          defaultValue={merchantData.business_hours}
                          placeholder="Seg-Sex: 9h às 18h, Sáb: 9h às 13h" 
                        />
                      </div>
                      
                      <div className="space-y-2 flex items-center">
                        <Alert variant="outline" className="bg-muted/40 border-accent/20">
                          <AlertCircle className="h-4 w-4 text-accent" />
                          <AlertTitle className="text-sm">Status da Loja</AlertTitle>
                          <AlertDescription className="text-xs">
                            Para alterar o status de visibilidade da loja, use o toggle próximo ao logo.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button type="submit" className="bg-accent" disabled={isUpdating}>
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
              {merchantData.invitationCode && (
                <CardFooter className="bg-muted/50 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm">
                  <div className="flex items-center">
                    <Store className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Seu código convite: </span>
                    <span className="font-medium ml-1">{merchantData.invitationCode}</span>
                  </div>
                  <span className="text-xs text-muted-foreground sm:ml-auto">
                    Indique novos lojistas e ganhe bônus 1% indicações
                  </span>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          {/* Segurança e Senha */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Altere sua senha de acesso ao sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Senha Atual</Label>
                    <Input 
                      id="current_password" 
                      name="current_password" 
                      type="password" 
                      placeholder="Digite sua senha atual" 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_password">Nova Senha</Label>
                    <Input 
                      id="new_password" 
                      name="new_password" 
                      type="password" 
                      placeholder="Digite a nova senha" 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                    <Input 
                      id="confirm_password" 
                      name="confirm_password" 
                      type="password" 
                      placeholder="Confirme a nova senha" 
                      required
                    />
                  </div>
                  
                  <Alert variant="outline" className="bg-muted/40 border-muted-foreground/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-sm">Segurança</AlertTitle>
                    <AlertDescription className="text-xs">
                      Use senhas fortes com pelo menos 6 caracteres, incluindo letras, números e caracteres especiais.
                    </AlertDescription>
                  </Alert>
                  
                  <Button type="submit" className="bg-primary" disabled={isChangingPassword}>
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : "Alterar Senha"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>Configurações de segurança adicionais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">Autenticação em Dois Fatores</h4>
                    <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                  </div>
                  <Button variant="outline" disabled>Em breve</Button>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">Logins Recentes</h4>
                    <p className="text-sm text-muted-foreground">Verifique os dispositivos conectados</p>
                  </div>
                  <Button variant="outline" disabled>Em breve</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashback Settings */}
          <TabsContent value="cashback">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-100">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-2">
                    <DollarSign className="w-8 h-8 text-indigo-600 mb-2" />
                    <p className="text-sm text-indigo-700">Cashback Cliente</p>
                    <h3 className="text-2xl font-bold text-indigo-900">{merchantData.cashbackRate || 2}%</h3>
                    <p className="text-xs text-indigo-600 text-center">Porcentagem padrão de retorno para o cliente</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-violet-100">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-2">
                    <PercentIcon className="w-8 h-8 text-violet-600 mb-2" />
                    <p className="text-sm text-violet-700">Taxa Plataforma</p>
                    <h3 className="text-2xl font-bold text-violet-900">5%</h3>
                    <p className="text-xs text-violet-600 text-center">Taxa cobrada pelo Vale Cashback</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-teal-50 to-green-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-2">
                    <Store className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-sm text-green-700">Total de Cashback</p>
                    <h3 className="text-2xl font-bold text-green-900">{merchantData.cashbackTotal ? formatCurrency(merchantData.cashbackTotal) : formatCurrency(0)}</h3>
                    <p className="text-xs text-green-600 text-center">Valor total distribuído em cashback</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Cashback</CardTitle>
                <CardDescription>
                  Personalize as regras de cashback para seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  
                  try {
                    setIsUpdating(true);
                    const data = {
                      cashbackPromotions: {
                        enabled: formData.get('enable-promotions') === 'on',
                        doubleOnWeekends: formData.get('double-weekends') === 'on',
                        specialCategories: formData.get('special-categories') === 'on',
                        minimumPurchase: parseFloat(formData.get('minimum-purchase') as string) || 0,
                        firstPurchaseBonus: formData.get('first-purchase-bonus') === 'on',
                        birthDayBonus: formData.get('birthday-bonus') === 'on'
                      }
                    };
                    
                    const response = await apiRequest("PATCH", "/api/merchant/settings/cashback", data);
                    
                    if (response.ok) {
                      toast({
                        title: "Configurações atualizadas",
                        description: "As configurações de cashback foram atualizadas com sucesso."
                      });
                      
                      // Refresh profile data
                      queryClient.invalidateQueries({queryKey: ['/api/merchant/profile']});
                    } else {
                      const errorData = await response.json();
                      throw new Error(errorData.message || "Falha ao atualizar configurações");
                    }
                  } catch (error) {
                    toast({
                      title: "Erro",
                      description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar as configurações. Tente novamente.",
                      variant: "destructive"
                    });
                  } finally {
                    setIsUpdating(false);
                  }
                }}>
                  <Alert className="mb-6 bg-blue-50 border-blue-100">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Informação</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      O cashback é calculado como uma porcentagem do valor da compra. Você pode personalizar regras adicionais abaixo.
                    </AlertDescription>
                  </Alert>
                
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Taxa de comissão padrão</Label>
                        <p className="text-sm text-muted-foreground">
                          Esta é a taxa padrão definida pelo sistema
                        </p>
                      </div>
                      <div className="bg-muted p-2 px-3 rounded-lg font-medium">
                        {merchantData.commissionRate || 2}%
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Configurações de Promoções</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Defina regras especiais para aumentar a fidelização de clientes
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-promotions">Habilitar promoções de cashback</Label>
                        <p className="text-sm text-muted-foreground">
                          Ofereça bônus de cashback em determinadas situações
                        </p>
                      </div>
                      <div>
                        <input 
                          type="checkbox" 
                          id="enable-promotions"
                          name="enable-promotions"
                          className="hidden"
                          defaultChecked={cashbackPromotions.enabled}
                        />
                        <Switch 
                          id="enable-promotions-switch"
                          checked={cashbackPromotions.enabled}
                          onCheckedChange={(checked) => {
                            const input = document.getElementById('enable-promotions') as HTMLInputElement;
                            if (input) input.checked = checked;
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="double-weekends">Cashback em dobro nos finais de semana</Label>
                        <p className="text-sm text-muted-foreground">
                          O cashback será dobrado em compras realizadas aos sábados e domingos
                        </p>
                      </div>
                      <div>
                        <input 
                          type="checkbox" 
                          id="double-weekends"
                          name="double-weekends"
                          className="hidden"
                          defaultChecked={cashbackPromotions.doubleOnWeekends}
                        />
                        <Switch 
                          id="double-weekends-switch"
                          checked={cashbackPromotions.doubleOnWeekends}
                          onCheckedChange={(checked) => {
                            const input = document.getElementById('double-weekends') as HTMLInputElement;
                            if (input) input.checked = checked;
                          }}
                          disabled={!cashbackPromotions.enabled}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="special-categories">Cashback para categorias especiais</Label>
                        <p className="text-sm text-muted-foreground">
                          Oferece cashback aumentado para certas categorias de produtos
                        </p>
                      </div>
                      <div>
                        <input 
                          type="checkbox" 
                          id="special-categories"
                          name="special-categories"
                          className="hidden"
                          defaultChecked={cashbackPromotions.specialCategories}
                        />
                        <Switch 
                          id="special-categories-switch"
                          checked={cashbackPromotions.specialCategories}
                          onCheckedChange={(checked) => {
                            const input = document.getElementById('special-categories') as HTMLInputElement;
                            if (input) input.checked = checked;
                          }}
                          disabled={!cashbackPromotions.enabled}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="first-purchase-bonus">Bônus na primeira compra</Label>
                        <p className="text-sm text-muted-foreground">
                          Oferece um bônus extra na primeira compra de um cliente
                        </p>
                      </div>
                      <div>
                        <input 
                          type="checkbox" 
                          id="first-purchase-bonus"
                          name="first-purchase-bonus"
                          className="hidden"
                          defaultChecked={cashbackPromotions.firstPurchaseBonus}
                        />
                        <Switch 
                          id="first-purchase-bonus-switch"
                          checked={cashbackPromotions.firstPurchaseBonus || false}
                          onCheckedChange={(checked) => {
                            const input = document.getElementById('first-purchase-bonus') as HTMLInputElement;
                            if (input) input.checked = checked;
                          }}
                          disabled={!cashbackPromotions.enabled}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="birthday-bonus">Bônus de aniversário</Label>
                        <p className="text-sm text-muted-foreground">
                          Oferece cashback dobrado quando cliente compra no mês do seu aniversário
                        </p>
                      </div>
                      <div>
                        <input 
                          type="checkbox" 
                          id="birthday-bonus"
                          name="birthday-bonus"
                          className="hidden"
                          defaultChecked={cashbackPromotions.birthDayBonus}
                        />
                        <Switch 
                          id="birthday-bonus-switch"
                          checked={cashbackPromotions.birthDayBonus || false}
                          onCheckedChange={(checked) => {
                            const input = document.getElementById('birthday-bonus') as HTMLInputElement;
                            if (input) input.checked = checked;
                          }}
                          disabled={!cashbackPromotions.enabled}
                        />
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="minimum-purchase">Valor mínimo de compra para cashback</Label>
                        <p className="text-sm text-muted-foreground">
                          Defina um valor mínimo de compra para que o cashback seja aplicado
                        </p>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                          <Input 
                            id="minimum-purchase"
                            name="minimum-purchase"
                            type="number" 
                            className="pl-7"
                            defaultValue={cashbackPromotions.minimumPurchase || 0}
                            min={0}
                            step={5}
                            disabled={!cashbackPromotions.enabled}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button type="submit" className="bg-accent" disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : "Salvar configurações"}
                    </Button>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="bg-muted/50 justify-between flex-col sm:flex-row items-start border-t">
                <div className="text-sm text-muted-foreground">
                  <span className="flex items-center mb-1"><CheckCircle className="h-3 w-3 mr-1 text-green-600" /> Cálculo automático de taxas</span>
                  <span className="flex items-center"><CheckCircle className="h-3 w-3 mr-1 text-green-600" /> Distribuição proporcional do cashback</span>
                </div>
                <div className="text-sm text-muted-foreground mt-2 sm:mt-0">
                  <span className="flex items-center">Última atualização: {new Date().toLocaleDateString()}</span>
                </div>
              </CardFooter>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Visualização para Clientes</CardTitle>
                <CardDescription>
                  Assim é como os clientes veem sua loja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-6 rounded-lg">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={merchantData.logo} alt={merchantData.name} />
                      <AvatarFallback className="text-lg bg-accent text-white">
                        {getInitials(merchantData.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{merchantData.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{merchantData.category}</p>
                      
                      <p className="text-sm mb-4">{merchantData.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{merchantData.address}, {merchantData.city}/{merchantData.state}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{merchantData.phone}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{merchantData.email}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{merchantData.website}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{merchantData.business_hours}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Responsável: {merchantData.owner}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className="px-3 py-1 rounded-full bg-accent/90 text-white text-sm">
                          {merchantData.cashbackRate || 2}% de cashback
                        </div>
                        
                        {cashbackPromotions.enabled && cashbackPromotions.doubleOnWeekends && (
                          <div className="px-3 py-1 rounded-full bg-blue-600 text-white text-sm">
                            2x aos finais de semana
                          </div>
                        )}
                        
                        {cashbackPromotions.enabled && cashbackPromotions.firstPurchaseBonus && (
                          <div className="px-3 py-1 rounded-full bg-green-600 text-white text-sm">
                            Bônus na primeira compra
                          </div>
                        )}
                        
                        {cashbackPromotions.enabled && cashbackPromotions.birthDayBonus && (
                          <div className="px-3 py-1 rounded-full bg-purple-600 text-white text-sm">
                            Bônus de aniversário
                          </div>
                        )}
                        
                        {cashbackPromotions.enabled && cashbackPromotions.minimumPurchase > 0 && (
                          <div className="px-3 py-1 rounded-full bg-gray-600 text-white text-sm">
                            Mínimo: {formatCurrency(cashbackPromotions.minimumPurchase)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}
