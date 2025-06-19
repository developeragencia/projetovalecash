import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, AlertCircle, Save, Trash2, Mail, Bell, Clock, CreditCard, Wallet, DollarSign, BadgePercent, Lock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Definição do schema para validação do formulário de Perfil
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Nome da loja deve ter pelo menos 2 caracteres" }),
  description: z.string().max(500, { message: "Descrição deve ter no máximo 500 caracteres" }).optional(),
  address: z.string().min(5, { message: "Endereço deve ser informado corretamente" }),
  phone: z.string().min(10, { message: "Telefone deve ter pelo menos 10 dígitos" }),
  email: z.string().email({ message: "Email inválido" }),
  website: z.string().url({ message: "URL inválida" }).optional().or(z.literal("")),
  category: z.string().min(1, { message: "Selecione uma categoria" }),
});

// Definição do schema para validação do formulário de Pagamentos
const paymentFormSchema = z.object({
  acceptCashback: z.boolean().default(true),
  cashbackBonus: z.number().min(0).max(10).default(0),
  acceptCreditCard: z.boolean().default(true),
  acceptDebitCard: z.boolean().default(true),
  acceptPix: z.boolean().default(true),
  acceptCash: z.boolean().default(true),
  minimumValue: z.number().min(0).default(0),
  autoWithdraw: z.boolean().default(false),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAgency: z.string().optional(),
  pixKey: z.string().optional(),
});

// Definição do schema para validação do formulário de Notificações
const notificationFormSchema = z.object({
  emailSales: z.boolean().default(true),
  emailReferrals: z.boolean().default(true),
  emailCashback: z.boolean().default(true),
  emailMarketing: z.boolean().default(false),
  browserNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  dailySummary: z.boolean().default(true),
  weeklySummary: z.boolean().default(true),
  monthlySummary: z.boolean().default(true),
});

// Definição do schema para validação do formulário de Segurança
const securityFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Senha atual deve ter pelo menos 6 caracteres" }),
  newPassword: z.string().min(8, { message: "Nova senha deve ter pelo menos 8 caracteres" })
    .regex(/[A-Z]/, { message: "Senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[0-9]/, { message: "Senha deve conter pelo menos um número" }),
  confirmPassword: z.string().min(8, { message: "Confirmação de senha deve ter pelo menos 8 caracteres" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

export default function MerchantSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  
  const { toast } = useToast();
  
  // Query para buscar os dados do perfil do lojista
  const { data: merchantData, isLoading } = useQuery({
    queryKey: ['/api/merchant/profile'],
    placeholderData: {
      id: 1,
      name: "Loja Example",
      description: "Supermercado com produtos naturais e orgânicos.",
      address: "Rua das Flores, 123 - Centro",
      phone: "11999887766",
      email: "contato@example.com",
      website: "https://example.com",
      category: "supermarket",
      paymentSettings: {
        acceptCashback: true,
        cashbackBonus: 1,
        acceptCreditCard: true,
        acceptDebitCard: true,
        acceptPix: true,
        acceptCash: true,
        minimumValue: 10,
        autoWithdraw: true,
        bankName: "Banco do Brasil",
        bankAccount: "12345-6",
        bankAgency: "1234",
        pixKey: "contato@example.com",
      },
      notificationSettings: {
        emailSales: true,
        emailReferrals: true,
        emailCashback: true,
        emailMarketing: false,
        browserNotifications: true,
        smsNotifications: false,
        dailySummary: true,
        weeklySummary: true,
        monthlySummary: true,
      }
    }
  });
  
  // Formulário para o perfil da loja
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: merchantData?.name || "",
      description: merchantData?.description || "",
      address: merchantData?.address || "",
      phone: merchantData?.phone || "",
      email: merchantData?.email || "",
      website: merchantData?.website || "",
      category: merchantData?.category || "",
    }
  });
  
  // Formulário para configurações de pagamento
  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      acceptCashback: merchantData?.paymentSettings?.acceptCashback || true,
      cashbackBonus: merchantData?.paymentSettings?.cashbackBonus || 0,
      acceptCreditCard: merchantData?.paymentSettings?.acceptCreditCard || true,
      acceptDebitCard: merchantData?.paymentSettings?.acceptDebitCard || true,
      acceptPix: merchantData?.paymentSettings?.acceptPix || true,
      acceptCash: merchantData?.paymentSettings?.acceptCash || true,
      minimumValue: merchantData?.paymentSettings?.minimumValue || 0,
      autoWithdraw: merchantData?.paymentSettings?.autoWithdraw || false,
      bankName: merchantData?.paymentSettings?.bankName || "",
      bankAccount: merchantData?.paymentSettings?.bankAccount || "",
      bankAgency: merchantData?.paymentSettings?.bankAgency || "",
      pixKey: merchantData?.paymentSettings?.pixKey || "",
    }
  });
  
  // Formulário para configurações de notificações
  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailSales: merchantData?.notificationSettings?.emailSales || true,
      emailReferrals: merchantData?.notificationSettings?.emailReferrals || true,
      emailCashback: merchantData?.notificationSettings?.emailCashback || true,
      emailMarketing: merchantData?.notificationSettings?.emailMarketing || false,
      browserNotifications: merchantData?.notificationSettings?.browserNotifications || true,
      smsNotifications: merchantData?.notificationSettings?.smsNotifications || false,
      dailySummary: merchantData?.notificationSettings?.dailySummary || true,
      weeklySummary: merchantData?.notificationSettings?.weeklySummary || true,
      monthlySummary: merchantData?.notificationSettings?.monthlySummary || true,
    }
  });
  
  // Formulário para configurações de segurança
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });
  
  // Mutation para atualizar o perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      const res = await apiRequest("PATCH", "/api/merchant/profile", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "As informações da sua loja foram atualizadas com sucesso",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Ocorreu um erro ao atualizar o perfil. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar as configurações de pagamento
  const updatePaymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentFormSchema>) => {
      const res = await apiRequest("PATCH", "/api/merchant/settings/payment", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações de pagamento atualizadas",
        description: "As configurações de pagamento foram atualizadas com sucesso",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message || "Ocorreu um erro ao atualizar as configurações de pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar as configurações de notificações
  const updateNotificationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationFormSchema>) => {
      const res = await apiRequest("PATCH", "/api/merchant/settings/notifications", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações de notificações atualizadas",
        description: "As configurações de notificações foram atualizadas com sucesso",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message || "Ocorreu um erro ao atualizar as configurações de notificações. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar a senha
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof securityFormSchema>) => {
      const res = await apiRequest("POST", "/api/merchant/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso",
        variant: "default",
      });
      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message || "Ocorreu um erro ao atualizar a senha. Verifique se a senha atual está correta.",
        variant: "destructive",
      });
    }
  });
  
  // Manipuladores para submissão dos formulários
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };
  
  const onPaymentSubmit = (data: z.infer<typeof paymentFormSchema>) => {
    updatePaymentMutation.mutate(data);
  };
  
  const onNotificationSubmit = (data: z.infer<typeof notificationFormSchema>) => {
    updateNotificationMutation.mutate(data);
  };
  
  const onSecuritySubmit = (data: z.infer<typeof securityFormSchema>) => {
    updatePasswordMutation.mutate(data);
  };
  
  // Função para desativar a loja
  const handleDeactivateStore = () => {
    toast({
      title: "Solicitar Desativação",
      description: "Entre em contato com o suporte para solicitar a desativação da sua loja.",
      variant: "default",
    });
  };
  
  return (
    <DashboardLayout title="Configurações" type="merchant">
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil da Loja</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>
        
        {/* Aba de Perfil da Loja */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Loja</CardTitle>
              <CardDescription>
                Atualize as informações da sua loja que serão exibidas para os clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form id="profile-form" onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Loja</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da Loja" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva sua loja em poucas palavras"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Esta descrição será exibida para os clientes no aplicativo.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
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
                              <SelectItem value="supermarket">Supermercado</SelectItem>
                              <SelectItem value="restaurant">Restaurante</SelectItem>
                              <SelectItem value="pharmacy">Farmácia</SelectItem>
                              <SelectItem value="clothing">Vestuário</SelectItem>
                              <SelectItem value="electronics">Eletrônicos</SelectItem>
                              <SelectItem value="beauty">Beleza</SelectItem>
                              <SelectItem value="other">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input placeholder="Endereço completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
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
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contato@sualoja.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.sualoja.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleDeactivateStore}>
                <Trash2 className="h-4 w-4 mr-2" />
                Solicitar Desativação
              </Button>
              <Button type="submit" form="profile-form" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? (
                  <>Salvando...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Aba de Pagamentos */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Pagamento</CardTitle>
              <CardDescription>
                Gerencie os métodos de pagamento e configurações financeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...paymentForm}>
                <form id="payment-form" onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Métodos de Pagamento Aceitos</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecione os métodos de pagamento que sua loja aceita
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="acceptCreditCard"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Cartão de Crédito</FormLabel>
                              <FormDescription>
                                Aceitar pagamentos com cartão de crédito
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
                        control={paymentForm.control}
                        name="acceptDebitCard"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Cartão de Débito</FormLabel>
                              <FormDescription>
                                Aceitar pagamentos com cartão de débito
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
                        control={paymentForm.control}
                        name="acceptPix"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>PIX</FormLabel>
                              <FormDescription>
                                Aceitar pagamentos via PIX
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
                        control={paymentForm.control}
                        name="acceptCash"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Dinheiro</FormLabel>
                              <FormDescription>
                                Aceitar pagamentos em dinheiro
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
                        control={paymentForm.control}
                        name="acceptCashback"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 md:col-span-2">
                            <div className="space-y-0.5">
                              <FormLabel>Saldo de Cashback</FormLabel>
                              <FormDescription>
                                Permitir que clientes paguem usando saldo de cashback
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
                    <h3 className="text-lg font-medium">Configurações de Cashback</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure as opções de cashback para sua loja
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="cashbackBonus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bônus de Cashback (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Adicional ao cashback padrão de 2%. O sistema somará este valor.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={paymentForm.control}
                        name="minimumValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Mínimo para Cashback (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0,00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Valor mínimo da compra para gerar cashback.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium">Dados Bancários</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure suas informações bancárias para recebimentos
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banco</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do banco" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={paymentForm.control}
                        name="bankAgency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agência</FormLabel>
                            <FormControl>
                              <Input placeholder="Número da agência" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={paymentForm.control}
                        name="bankAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conta</FormLabel>
                            <FormControl>
                              <Input placeholder="Número da conta" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={paymentForm.control}
                        name="pixKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chave PIX</FormLabel>
                            <FormControl>
                              <Input placeholder="Sua chave PIX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <FormField
                      control={paymentForm.control}
                      name="autoWithdraw"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Saque Automático</FormLabel>
                            <FormDescription>
                              Transferir automaticamente o saldo disponível para a conta bancária
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
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                form="payment-form"
                className="ml-auto"
                disabled={updatePaymentMutation.isPending}
              >
                {updatePaymentMutation.isPending ? (
                  <>Salvando...</>
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
                Gerencie como e quando você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form id="notification-form" onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notificações por Email</h3>
                    
                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="emailSales"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                                Vendas
                              </FormLabel>
                              <FormDescription>
                                Receber notificações por email para cada venda
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
                        control={notificationForm.control}
                        name="emailReferrals"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-blue-500" />
                                Indicações
                              </FormLabel>
                              <FormDescription>
                                Receber notificações quando uma loja se cadastrar usando sua indicação
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
                        control={notificationForm.control}
                        name="emailCashback"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <BadgePercent className="h-4 w-4 mr-2 text-orange-500" />
                                Cashback
                              </FormLabel>
                              <FormDescription>
                                Receber notificações sobre distribuição de cashback
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
                        control={notificationForm.control}
                        name="emailMarketing"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-purple-500" />
                                Marketing
                              </FormLabel>
                              <FormDescription>
                                Receber emails com dicas, novidades e ofertas
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
                    <h3 className="text-lg font-medium mb-4">Outras Notificações</h3>
                    
                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="browserNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <Bell className="h-4 w-4 mr-2 text-blue-500" />
                                Notificações no Navegador
                              </FormLabel>
                              <FormDescription>
                                Receber notificações em tempo real no navegador
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
                        control={notificationForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-green-500" />
                                Notificações por SMS
                              </FormLabel>
                              <FormDescription>
                                Receber notificações importantes por SMS
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
                    <h3 className="text-lg font-medium mb-4">Relatórios Periódicos</h3>
                    
                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="dailySummary"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                                Resumo Diário
                              </FormLabel>
                              <FormDescription>
                                Receber resumo diário de vendas e transações
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
                        control={notificationForm.control}
                        name="weeklySummary"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-purple-500" />
                                Resumo Semanal
                              </FormLabel>
                              <FormDescription>
                                Receber relatório semanal com análise de desempenho
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
                        control={notificationForm.control}
                        name="monthlySummary"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-orange-500" />
                                Resumo Mensal
                              </FormLabel>
                              <FormDescription>
                                Receber relatório mensal consolidado
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
                form="notification-form"
                className="ml-auto"
                disabled={updateNotificationMutation.isPending}
              >
                {updateNotificationMutation.isPending ? (
                  <>Salvando...</>
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
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie as configurações de segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form id="security-form" onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
                    
                    <div className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Sua senha atual" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Nova senha" {...field} />
                            </FormControl>
                            <FormDescription>
                              A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula e um número.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Nova Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirme a nova senha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={updatePasswordMutation.isPending}
                    >
                      {updatePasswordMutation.isPending ? (
                        <>Atualizando...</>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Atualizar Senha
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Sessões Ativas</h3>
                <div className="border rounded-lg">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Este dispositivo</div>
                        <div className="text-sm text-muted-foreground">
                          Windows • Chrome • São Paulo, SP
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-muted-foreground">Ativo agora</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-muted-foreground mb-2">
                      Sessões em outros dispositivos não detectadas
                    </div>
                    <Button variant="outline" size="sm">
                      Encerrar todas as outras sessões
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}