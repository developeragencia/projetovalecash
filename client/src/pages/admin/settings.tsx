import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { 
  Percent, 
  DollarSign, 
  Save, 
  RefreshCw, 
  Settings, 
  ShieldCheck, 
  UserCog, 
  CreditCard, 
  MailCheck,
  Smartphone,
  Globe,
  AlertTriangle,
  AlertCircle,
  FileWarning,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Definição do schema para validação do formulário de Taxas (Novo Modelo)
const ratesFormSchema = z.object({
  platformFee: z.preprocess(
    (val) => parseFloat(val as string), 
    z.number().min(0).max(100)
  ),
  cashbackRate: z.preprocess(
    (val) => parseFloat(val as string), 
    z.number().min(0).max(100)
  ),
  referralRate: z.preprocess(
    (val) => parseFloat(val as string), 
    z.number().min(0).max(100)
  ),
  minWithdrawal: z.preprocess(
    (val) => parseFloat(val as string), 
    z.number().min(0)
  ),
});

// Definição do schema para validação do formulário de Segurança
const securityFormSchema = z.object({
  requireEmailVerification: z.boolean().default(true),
  maxLoginAttempts: z.preprocess(
    (val) => parseInt(val as string), 
    z.number().min(1).max(10)
  ),
  passwordExpiryDays: z.preprocess(
    (val) => parseInt(val as string), 
    z.number().min(0).max(365)
  ),
  sessionTimeoutMinutes: z.preprocess(
    (val) => parseInt(val as string), 
    z.number().min(5).max(1440)
  ),
  requireStrongPasswords: z.boolean().default(true),
  twoFactorAuth: z.boolean().default(false),
});

// Definição do schema para validação do formulário de Notificações
const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
  notifyOnLogin: z.boolean().default(true),
  notifyOnTransactions: z.boolean().default(true),
  notifyOnWithdrawals: z.boolean().default(true),
  dailyReports: z.boolean().default(false),
  weeklyReports: z.boolean().default(true),
  monthlyReports: z.boolean().default(true),
});

// Definição do schema para validação do formulário de Sistema
const systemFormSchema = z.object({
  maintenanceMode: z.boolean().default(false),
  debugMode: z.boolean().default(false),
  apiThrottleLimit: z.preprocess(
    (val) => parseInt(val as string), 
    z.number().min(10).max(1000)
  ),
  enableReferrals: z.boolean().default(true),
  enableCashback: z.boolean().default(true),
  enableQrCodes: z.boolean().default(true),
  backupFrequencyHours: z.preprocess(
    (val) => parseInt(val as string), 
    z.number().min(1).max(168)
  ),
});

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("rates");
  
  const { toast } = useToast();
  
  // Define o tipo das configurações de taxas (Novo Modelo)
  interface RatesSettings {
    platform_fee: string;
    client_cashback: string;
    referral_bonus: string;
    min_withdrawal: string;
  }

  // Valores padrão para as configurações de taxas (Novo Modelo)
  const defaultRatesSettings: RatesSettings = {
    platform_fee: "5.0",
    client_cashback: "2.0",
    referral_bonus: "1.0",
    min_withdrawal: "20.0"
  };
  
  // Query para buscar configurações de taxas do novo modelo
  const { data: ratesSettings, isLoading: isRatesLoading } = useQuery<RatesSettings>({
    queryKey: ['/api/admin/settings/commission'],
    placeholderData: defaultRatesSettings
  });
  
  // Query para buscar outras configurações do sistema
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    placeholderData: {
      security: {
        requireEmailVerification: true,
        maxLoginAttempts: 5,
        passwordExpiryDays: 90,
        sessionTimeoutMinutes: 120,
        requireStrongPasswords: true,
        twoFactorAuth: false,
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        notifyOnLogin: true,
        notifyOnTransactions: true,
        notifyOnWithdrawals: true,
        dailyReports: false,
        weeklyReports: true,
        monthlyReports: true,
      },
      system: {
        maintenanceMode: false,
        debugMode: false,
        apiThrottleLimit: 100,
        enableReferrals: true,
        enableCashback: true,
        enableQrCodes: true,
        backupFrequencyHours: 24,
      }
    }
  });
  
  // Função para converter string para número com segurança
  const safeParseFloat = (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Formulário para configurações de taxas
  const ratesForm = useForm<z.infer<typeof ratesFormSchema>>({
    resolver: zodResolver(ratesFormSchema),
    defaultValues: {
      cashbackRate: safeParseFloat(ratesSettings?.clientCashback, 2.0),
      referralRate: safeParseFloat(ratesSettings?.referralCommission, 1.0),
      merchantCommission: safeParseFloat(ratesSettings?.merchantCommission, 2.0),
      minWithdrawal: safeParseFloat(ratesSettings?.minimumWithdrawal, 50.0),
      maxCashbackBonus: safeParseFloat(ratesSettings?.maximumCashback, 10.0),
    }
  });
  
  // Atualiza os valores do formulário quando os dados são carregados
  useEffect(() => {
    if (ratesSettings && !isRatesLoading) {
      ratesForm.reset({
        cashbackRate: safeParseFloat(ratesSettings.clientCashback, 2.0),
        referralRate: safeParseFloat(ratesSettings.referralCommission, 1.0),
        merchantCommission: safeParseFloat(ratesSettings.merchantCommission, 2.0),
        minWithdrawal: safeParseFloat(ratesSettings.minimumWithdrawal, 50.0),
        maxCashbackBonus: safeParseFloat(ratesSettings.maximumCashback, 10.0),
      });
    }
  }, [ratesSettings, isRatesLoading, ratesForm]);
  
  // Formulário para configurações de segurança
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      requireEmailVerification: settings?.security?.requireEmailVerification ?? true,
      maxLoginAttempts: settings?.security?.maxLoginAttempts ?? 5,
      passwordExpiryDays: settings?.security?.passwordExpiryDays ?? 90,
      sessionTimeoutMinutes: settings?.security?.sessionTimeoutMinutes ?? 120,
      requireStrongPasswords: settings?.security?.requireStrongPasswords ?? true,
      twoFactorAuth: settings?.security?.twoFactorAuth ?? false,
    }
  });
  
  // Formulário para configurações de notificações
  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: settings?.notifications?.emailNotifications ?? true,
      smsNotifications: settings?.notifications?.smsNotifications ?? false,
      pushNotifications: settings?.notifications?.pushNotifications ?? true,
      notifyOnLogin: settings?.notifications?.notifyOnLogin ?? true,
      notifyOnTransactions: settings?.notifications?.notifyOnTransactions ?? true,
      notifyOnWithdrawals: settings?.notifications?.notifyOnWithdrawals ?? true,
      dailyReports: settings?.notifications?.dailyReports ?? false,
      weeklyReports: settings?.notifications?.weeklyReports ?? true,
      monthlyReports: settings?.notifications?.monthlyReports ?? true,
    }
  });
  
  // Formulário para configurações do sistema
  const systemForm = useForm<z.infer<typeof systemFormSchema>>({
    resolver: zodResolver(systemFormSchema),
    defaultValues: {
      maintenanceMode: settings?.system?.maintenanceMode ?? false,
      debugMode: settings?.system?.debugMode ?? false,
      apiThrottleLimit: settings?.system?.apiThrottleLimit ?? 100,
      enableReferrals: settings?.system?.enableReferrals ?? true,
      enableCashback: settings?.system?.enableCashback ?? true,
      enableQrCodes: settings?.system?.enableQrCodes ?? true,
      backupFrequencyHours: settings?.system?.backupFrequencyHours ?? 24,
    }
  });
  
  // Mutation para atualizar configurações de taxas
  const updateRatesMutation = useMutation({
    mutationFn: async (data: z.infer<typeof ratesFormSchema>) => {
      // Converte os campos do formulário para os campos esperados pela API
      const commissionData = {
        platformFee: "5.0", // Taxa fixa da plataforma por enquanto
        merchantCommission: data.merchantCommission.toString(),
        clientCashback: data.cashbackRate.toString(),
        referralCommission: data.referralRate.toString(),
        withdrawalFee: "5.0",
        minimumWithdrawal: data.minWithdrawal.toString(),
        maximumCashback: data.maxCashbackBonus.toString()
      };
      
      // Log para depuração
      console.log("Enviando dados para atualização:", commissionData);
      
      try {
        const res = await apiRequest("PATCH", "/api/admin/settings/commission", commissionData);
        if (!res.ok) {
          throw new Error(`Erro ao atualizar: ${res.status} ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        console.error("Erro na requisição:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As configurações de taxas foram atualizadas com sucesso",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/commission'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message || "Ocorreu um erro ao atualizar as configurações. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar configurações de segurança
  const updateSecurityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof securityFormSchema>) => {
      const res = await apiRequest("PATCH", "/api/admin/settings/security", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As configurações de segurança foram atualizadas com sucesso",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message || "Ocorreu um erro ao atualizar as configurações. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar configurações de notificações
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationsFormSchema>) => {
      const res = await apiRequest("PATCH", "/api/admin/settings/notifications", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As configurações de notificações foram atualizadas com sucesso",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message || "Ocorreu um erro ao atualizar as configurações. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar configurações do sistema
  const updateSystemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof systemFormSchema>) => {
      const res = await apiRequest("PATCH", "/api/admin/settings/system", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As configurações do sistema foram atualizadas com sucesso",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message || "Ocorreu um erro ao atualizar as configurações. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Manipuladores para submissão dos formulários
  const onRatesSubmit = (data: z.infer<typeof ratesFormSchema>) => {
    updateRatesMutation.mutate(data);
  };
  
  const onSecuritySubmit = (data: z.infer<typeof securityFormSchema>) => {
    updateSecurityMutation.mutate(data);
  };
  
  const onNotificationsSubmit = (data: z.infer<typeof notificationsFormSchema>) => {
    updateNotificationsMutation.mutate(data);
  };
  
  const onSystemSubmit = (data: z.infer<typeof systemFormSchema>) => {
    // Confirmação adicional para modo de manutenção
    if (data.maintenanceMode) {
      if (confirm("Ativar o modo de manutenção deixará o sistema inacessível para usuários comuns. Deseja continuar?")) {
        updateSystemMutation.mutate(data);
      }
    } else {
      updateSystemMutation.mutate(data);
    }
  };
  
  return (
    <DashboardLayout title="Configurações do Sistema" type="admin">
      <Tabs defaultValue="rates" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="rates">
            <Percent className="h-4 w-4 mr-2" />
            Taxas e Valores
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <MailCheck className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="h-4 w-4 mr-2" />
            Sistema
          </TabsTrigger>
        </TabsList>
        
        {/* Aba de Taxas e Valores */}
        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle>Taxas e Valores do Sistema</CardTitle>
              <CardDescription>
                Configure as taxas padrão de cashback, comissões e valores mínimos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRatesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando configurações...</p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                  <h3 className="text-lg font-medium mb-2">Informações sobre Taxas</h3>
                  <p className="text-sm text-muted-foreground mb-2">O sistema de taxas do Vale Cashback funciona com os seguintes componentes:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                    <li><span className="font-medium">Taxa da Plataforma (5%):</span> Taxa fixa cobrada pela plataforma em cada transação</li>
                    <li><span className="font-medium">Comissão do Lojista:</span> Valor cobrado dos lojistas por venda processada</li>
                    <li><span className="font-medium">Cashback do Cliente:</span> Percentual retornado aos clientes em cada compra</li>
                    <li><span className="font-medium">Comissão de Indicação:</span> Percentual pago a quem indicou novos usuários</li>
                  </ul>
                </div>
              )}
              <Form {...ratesForm}>
                <form id="rates-form" onSubmit={ratesForm.handleSubmit(onRatesSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Taxas de Cashback</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure as taxas de cashback padrão do sistema
                        </p>
                      </div>
                      
                      <FormField
                        control={ratesForm.control}
                        name="cashbackRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxa de Cashback Global (%)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  placeholder="2.0"
                                  {...field}
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center">
                                  <Percent className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Taxa padrão de cashback aplicada a todas as compras
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={ratesForm.control}
                        name="referralRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxa de Comissão de Indicação (%)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  placeholder="1.0"
                                  {...field}
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center">
                                  <Percent className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Comissão paga por indicações bem sucedidas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Taxas e Limites</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure as taxas de serviço e valores mínimos
                        </p>
                      </div>
                      
                      <FormField
                        control={ratesForm.control}
                        name="merchantCommission"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxa de Comissão para Lojistas (%)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  placeholder="2.0"
                                  {...field}
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center">
                                  <Percent className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Comissão cobrada dos lojistas sobre vendas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={ratesForm.control}
                        name="minWithdrawal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Mínimo para Saque (R$)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  step="5"
                                  placeholder="50"
                                  {...field}
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Valor mínimo que usuários podem sacar
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={ratesForm.control}
                        name="maxCashbackBonus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Limite Máximo de Bônus de Cashback (%)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  placeholder="10"
                                  {...field}
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center">
                                  <Percent className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Limite máximo de bônus de cashback que lojistas podem oferecer
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                form="rates-form"
                className="ml-auto"
                disabled={updateRatesMutation.isPending}
              >
                {updateRatesMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Aba de Segurança */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configure as políticas de segurança e autenticação do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form id="security-form" onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Políticas de Acesso</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure as regras de autenticação e acesso
                        </p>
                      </div>
                      
                      <FormField
                        control={securityForm.control}
                        name="requireEmailVerification"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Verificação de Email</FormLabel>
                              <FormDescription>
                                Exigir verificação de email para novos cadastros
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="requireStrongPasswords"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Senhas Fortes</FormLabel>
                              <FormDescription>
                                Exigir senhas fortes com números, maiúsculas e símbolos
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="twoFactorAuth"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Autenticação em Dois Fatores</FormLabel>
                              <FormDescription>
                                Habilitar 2FA para contas administrativas
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Limites de Segurança</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure timeouts e limites de segurança
                        </p>
                      </div>
                      
                      <FormField
                        control={securityForm.control}
                        name="maxLoginAttempts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tentativas Máximas de Login</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                placeholder="5"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Número máximo de tentativas de login antes do bloqueio
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="passwordExpiryDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Validade da Senha (dias)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="365"
                                placeholder="90"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Dias até expiração da senha (0 para nunca expirar)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="sessionTimeoutMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timeout de Sessão (minutos)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="5"
                                max="1440"
                                placeholder="120"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Tempo de inatividade até o logout automático
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                form="security-form"
                className="ml-auto"
                disabled={updateSecurityMutation.isPending}
              >
                {updateSecurityMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Aba de Notificações */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure as notificações e relatórios do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form id="notifications-form" onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Canais de Notificação</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Ative ou desative os canais de comunicação
                        </p>
                      </div>
                      
                      <FormField
                        control={notificationsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <MailCheck className="h-4 w-4 mr-2 text-blue-500" />
                                Notificações por Email
                              </FormLabel>
                              <FormDescription>
                                Enviar notificações por email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <Smartphone className="h-4 w-4 mr-2 text-green-500" />
                                Notificações por SMS
                              </FormLabel>
                              <FormDescription>
                                Enviar notificações importantes por SMS
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <Globe className="h-4 w-4 mr-2 text-purple-500" />
                                Notificações Push
                              </FormLabel>
                              <FormDescription>
                                Enviar notificações push para navegadores
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Eventos de Notificação</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure os eventos que geram notificações
                        </p>
                      </div>
                      
                      <FormField
                        control={notificationsForm.control}
                        name="notifyOnLogin"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Logins</FormLabel>
                              <FormDescription>
                                Notificar quando usuários fazem login em novos dispositivos
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="notifyOnTransactions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Transações</FormLabel>
                              <FormDescription>
                                Notificar sobre novas transações e cashbacks
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="notifyOnWithdrawals"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Saques</FormLabel>
                              <FormDescription>
                                Notificar sobre solicitações e conclusões de saques
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Relatórios Automáticos</h3>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <FormField
                        control={notificationsForm.control}
                        name="dailyReports"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Relatórios Diários</FormLabel>
                              <FormDescription>
                                Enviar resumo diário
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="weeklyReports"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Relatórios Semanais</FormLabel>
                              <FormDescription>
                                Enviar resumo semanal
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="monthlyReports"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Relatórios Mensais</FormLabel>
                              <FormDescription>
                                Enviar resumo mensal
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                form="notifications-form"
                className="ml-auto"
                disabled={updateNotificationsMutation.isPending}
              >
                {updateNotificationsMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Aba de Sistema */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configure parâmetros globais e funcionalidades do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...systemForm}>
                <form id="system-form" onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Modos de Operação</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure os modos de operação do sistema
                        </p>
                      </div>
                      
                      <FormField
                        control={systemForm.control}
                        name="maintenanceMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 border-yellow-200 bg-yellow-50">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                                Modo de Manutenção
                              </FormLabel>
                              <FormDescription className="text-yellow-700">
                                Ativa o modo de manutenção, bloqueando o acesso para usuários comuns
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemForm.control}
                        name="debugMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Modo de Debug</FormLabel>
                              <FormDescription>
                                Ativa logs detalhados para depuração
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemForm.control}
                        name="apiThrottleLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Limite de Requisições API (por minuto)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="10"
                                max="1000"
                                placeholder="100"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Limite de requisições API por minuto por usuário
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Recursos do Sistema</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Ative ou desative recursos específicos
                        </p>
                      </div>
                      
                      <FormField
                        control={systemForm.control}
                        name="enableReferrals"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Sistema de Indicações</FormLabel>
                              <FormDescription>
                                Permitir que usuários indiquem outros e recebam comissões
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemForm.control}
                        name="enableCashback"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Sistema de Cashback</FormLabel>
                              <FormDescription>
                                Permitir geração e uso de cashback
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemForm.control}
                        name="enableQrCodes"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Pagamentos por QR Code</FormLabel>
                              <FormDescription>
                                Permitir pagamentos via QR Code
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemForm.control}
                        name="backupFrequencyHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequência de Backup (horas)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="168"
                                placeholder="24"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Intervalo em horas entre backups automáticos do banco de dados
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Informações do Sistema</h4>
                        <div className="mt-2 space-y-1 text-sm text-blue-700">
                          <p><strong>Versão:</strong> 1.0.0</p>
                          <p><strong>Último backup:</strong> 21/07/2023 03:00</p>
                          <p><strong>Último deploy:</strong> 18/07/2023 14:35</p>
                          <p><strong>Tempo online:</strong> 3 dias, 7 horas, 22 minutos</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                form="system-form"
                className="ml-auto"
                disabled={updateSystemMutation.isPending}
              >
                {updateSystemMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}