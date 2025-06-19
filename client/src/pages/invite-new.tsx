import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RefreshCw, UserPlus, Store, AlertCircle, Check, Star, Gift, Users, TrendingUp, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { LogoIcon } from "@/components/ui/icons";

// Validação dos formulários com Zod
const clientSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Telefone inválido"),
  referralCode: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const merchantSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Telefone inválido"),
  storeName: z.string().min(3, "O nome da loja deve ter pelo menos 3 caracteres"),
  storeType: z.string().min(3, "Selecione o tipo de estabelecimento"),
  referralCode: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

import { RouteComponentProps } from "wouter";

interface InvitePageProps extends Partial<RouteComponentProps> {
  defaultType?: "client" | "merchant";
  params?: {
    code?: string;
    anypath?: string;
    anysubpath?: string;
  };
}

export default function InvitePageNew({ defaultType = "client", params }: InvitePageProps) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, userType } = useAuth();
  const { toast } = useToast();
  
  const [referralType, setReferralType] = useState<"client" | "merchant">(defaultType);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  // Se já estiver autenticado, redireciona para a página inicial apropriada
  useEffect(() => {
    if (isAuthenticated) {
      if (userType === "client") {
        setLocation("/client/dashboard");
      } else if (userType === "merchant") {
        setLocation("/merchant/dashboard");
      } else if (userType === "admin") {
        setLocation("/admin/dashboard");
      }
    }
  }, [isAuthenticated, userType, setLocation]);

  // Extrai o código de referência da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    
    if (codeParam) {
      setReferralCode(codeParam);
      setLoading(false);
      return;
    }

    // Verificar se há código na URL do tipo /convite/CODIGO
    const pathParts = location.split('/').filter(part => part.trim() !== '');
    
    // Se a URL é /convite/CODIGO, pegar o segundo elemento
    if (pathParts.length >= 2 && pathParts[0] === 'convite') {
      const code = pathParts[1];
      if (code && code.length >= 4) {
        setReferralCode(code);
        setLoading(false);
        return;
      }
    }
    
    // Se a URL é /parceiro/CODIGO, pegar o segundo elemento
    if (pathParts.length >= 2 && pathParts[0] === 'parceiro') {
      const code = pathParts[1];
      if (code && code.length >= 4) {
        setReferralCode(code);
        setLoading(false);
        return;
      }
    }
    
    // Buscar código em qualquer parte da URL como fallback
    for (const part of pathParts) {
      if (part.match(/^[A-Z0-9]+$/i) && part.length >= 4) {
        setReferralCode(part);
        setLoading(false);
        return;
      }
    }
    
    setLoading(false);
  }, [location]);

  // Formulário para cliente
  const clientForm = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      referralCode: referralCode
    },
    mode: "onChange"
  });

  // Formulário para lojista
  const merchantForm = useForm<z.infer<typeof merchantSchema>>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      storeName: "",
      storeType: "",
      referralCode: referralCode
    },
    mode: "onChange"
  });

  // Atualiza o valor do código de referência nos formulários quando ele muda
  useEffect(() => {
    clientForm.setValue("referralCode", referralCode);
    merchantForm.setValue("referralCode", referralCode);
  }, [referralCode]);

  // Mutation para cadastro de cliente
  const clientRegisterMutation = useMutation({
    mutationFn: async (data: z.infer<typeof clientSchema>) => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            type: "client"
          }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Erro ao realizar o cadastro");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Erro no cadastro de cliente:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você ganhou $10 de bônus de boas-vindas! Redirecionando para login...",
        variant: "default",
      });
      
      setTimeout(() => {
        window.location.href = "/auth";
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro ao realizar o cadastro. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutation para cadastro de lojista
  const merchantRegisterMutation = useMutation({
    mutationFn: async (data: z.infer<typeof merchantSchema>) => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            type: "merchant"
          }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Erro ao realizar o cadastro");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Erro no cadastro de lojista:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu cadastro será analisado. Redirecionando para login...",
        variant: "default",
      });
      
      setTimeout(() => {
        window.location.href = "/auth";
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro ao realizar o cadastro. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Tipos de estabelecimento para o select
  const storeTypes = [
    { value: "restaurant", label: "Restaurante" },
    { value: "supermarket", label: "Supermercado" },
    { value: "clothing", label: "Loja de Roupas" },
    { value: "pharmacy", label: "Farmácia" },
    { value: "electronics", label: "Eletrônicos" },
    { value: "furniture", label: "Móveis" },
    { value: "beauty", label: "Salão de Beleza" },
    { value: "other", label: "Outro" }
  ];

  // Consulta para obter informações do convite
  const { data: inviteData, isLoading: isLoadingInvite } = useQuery({
    queryKey: ['/api/invite', referralCode],
    queryFn: async () => {
      if (!referralCode) return null;
      
      try {
        const res = await fetch(`/api/invite/${referralCode}`);
        
        if (!res.ok) {
          return null;
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return null;
        }
        
        const data = await res.json();
        
        if (data.valid) {
          if (data.referrerName) {
            setReferrerName(data.referrerName);
          }
          
          return {
            referrerId: data.referrerId,
            referrerName: data.referrerName,
            referrerType: data.referrerType,
            referralCode: data.referralCode,
            bonus: data.bonus
          };
        }
        
        return null;
      } catch (error) {
        console.error('Erro ao verificar convite:', error);
        return null;
      }
    },
    enabled: !!referralCode,
    retry: 2,
    staleTime: 60000
  });

  const onClientSubmit = (data: z.infer<typeof clientSchema>) => {
    clientRegisterMutation.mutate(data);
  };
  
  const onMerchantSubmit = (data: z.infer<typeof merchantSchema>) => {
    merchantRegisterMutation.mutate(data);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-orange-50">
        <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Header com Logo */}
      <header className="relative border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoIcon className="h-12 w-12" />
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-orange-500 bg-clip-text text-transparent">
                Vale Cashback
              </span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/auth")}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Já tenho conta
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Bem-vindo ao{" "}
                <span className="bg-gradient-to-r from-green-600 to-orange-500 bg-clip-text text-transparent">
                  Vale Cashback
                </span>
              </h1>
              
              {referrerName && (
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6">
                  <Gift className="h-5 w-5" />
                  <span className="font-medium">
                    Você foi convidado por {referrerName}
                  </span>
                </div>
              )}
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Ganhe dinheiro de volta em suas compras e compartilhe com seus amigos. 
                Junte-se a milhares de pessoas que já economizam com o Vale Cashback.
              </p>

              {/* Benefícios em destaque */}
              <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-green-100"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <Gift className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Bônus de $10</h3>
                  <p className="text-gray-600 text-sm">
                    Ganhe $10 grátis apenas por se cadastrar
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Até 2% Cashback</h3>
                  <p className="text-gray-600 text-sm">
                    Receba dinheiro de volta em todas as compras
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-green-100"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Indique e Ganhe</h3>
                  <p className="text-gray-600 text-sm">
                    Ganhe 1% das compras dos seus indicados
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Formulário de Cadastro */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Criar sua conta
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Escolha o tipo de conta que deseja criar
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs value={referralType} onValueChange={(value) => setReferralType(value as "client" | "merchant")}>
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="client" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Cliente
                    </TabsTrigger>
                    <TabsTrigger value="merchant" className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Lojista
                    </TabsTrigger>
                  </TabsList>

                  {/* Formulário Cliente */}
                  <TabsContent value="client" className="space-y-6">
                    <Form {...clientForm}>
                      <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={clientForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome Completo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Seu nome completo" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={clientForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="seu@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={clientForm.control}
                          name="phone"
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

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={clientForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={clientForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Confirme sua senha" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {referralCode && (
                          <FormField
                            control={clientForm.control}
                            name="referralCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código de Convite</FormLabel>
                                <FormControl>
                                  <Input {...field} readOnly className="bg-green-50 border-green-200" />
                                </FormControl>
                                <FormDescription>
                                  Você foi convidado com este código
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        )}

                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-6 text-lg font-semibold"
                          disabled={clientRegisterMutation.isPending}
                        >
                          {clientRegisterMutation.isPending ? (
                            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                          ) : (
                            <Check className="h-5 w-5 mr-2" />
                          )}
                          Criar Conta de Cliente
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  {/* Formulário Lojista */}
                  <TabsContent value="merchant" className="space-y-6">
                    <Form {...merchantForm}>
                      <form onSubmit={merchantForm.handleSubmit(onMerchantSubmit)} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={merchantForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome Completo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Seu nome completo" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={merchantForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="seu@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={merchantForm.control}
                          name="phone"
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

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={merchantForm.control}
                            name="storeName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome da Loja</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome do seu estabelecimento" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={merchantForm.control}
                            name="storeType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Estabelecimento</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {storeTypes.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={merchantForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={merchantForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Confirme sua senha" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {referralCode && (
                          <FormField
                            control={merchantForm.control}
                            name="referralCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código de Convite</FormLabel>
                                <FormControl>
                                  <Input {...field} readOnly className="bg-orange-50 border-orange-200" />
                                </FormControl>
                                <FormDescription>
                                  Você foi convidado com este código
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        )}

                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-6 text-lg font-semibold"
                          disabled={merchantRegisterMutation.isPending}
                        >
                          {merchantRegisterMutation.isPending ? (
                            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                          ) : (
                            <Store className="h-5 w-5 mr-2" />
                          )}
                          Criar Conta de Lojista
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <LogoIcon className="h-8 w-8" />
              <span className="text-gray-600">© 2025 Vale Cashback. Todos os direitos reservados.</span>
            </div>
            <div className="flex items-center space-x-4">
              <Shield className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Plataforma segura e confiável</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}