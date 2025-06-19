import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LogoIcon } from "@/components/ui/icons";
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
import { RefreshCw, UserPlus, Store, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

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

export default function InvitePage({ defaultType = "client", params }: InvitePageProps) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, userType } = useAuth();
  const { toast } = useToast();
  
  // Determina o tipo inicial baseado na URL e props
  const getInitialReferralType = () => {
    const currentPath = window.location.pathname;
    if (currentPath === '/convite/lojista') return "merchant";
    if (currentPath === '/convite/cliente') return "client";
    return defaultType;
  };
  
  const [referralType, setReferralType] = useState<"client" | "merchant">(getInitialReferralType);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  
  // Se já estiver autenticado, redireciona para a página inicial apropriada
  // Mas verifica se não estamos na página de convite específica, que deve estar sempre acessível
  useEffect(() => {
    // Verifica se a página atual é uma página de convite específica
    const isInvitePage = location.startsWith('/convite/');
    
    // Se estiver autenticado e NÃO estiver em uma página de convite, redireciona
    if (isAuthenticated && !isInvitePage) {
      if (userType === "client") {
        setLocation("/client/dashboard");
      } else if (userType === "merchant") {
        setLocation("/merchant/dashboard");
      } else if (userType === "admin") {
        setLocation("/admin/dashboard");
      }
    }
  }, [isAuthenticated, userType, setLocation, location]);
  
  // Extrai o código de referência e tipo da URL
  useEffect(() => {
    if (loading === false) return; // Previne múltiplas execuções se o estado de loading já foi definido
    
    // Verificar tipo baseado no path e props recebidas
    setReferralType(defaultType);
    console.log("Tipo definido pelas props:", defaultType);
    
    // Verificar se há código nos parâmetros da rota
    if (params?.code) {
      setReferralCode(params.code);
      console.log("Código de convite dos parâmetros da rota:", params.code);
    }
    
    // Verifica primeiro se há um parâmetro de consulta 'code'
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    
    if (codeParam) {
      console.log("Found code in query parameter:", codeParam);
      
      // Determina o tipo de código (cliente ou lojista) se ainda não foi definido pelas props
      if (window.location.pathname !== '/convite/cliente' && window.location.pathname !== '/convite/lojista') {
        if (codeParam.match(/^CL[0-9]+$/i) || codeParam.toUpperCase() === 'CLIENT123') {
          console.log("Identified as client referral code");
          setReferralType("client");
        } else if (codeParam.match(/^LJ[0-9]+$/i) || codeParam.match(/^MERCHANT[0-9]+$/i)) {
          console.log("Identified as merchant referral code");
          setReferralType("merchant");
        } else {
          // Código genérico, assumindo que é um código de cliente por padrão
          console.log("Generic code, assuming client type:", codeParam);
          setReferralType("client");
        }
      }
      
      setReferralCode(codeParam);
      setLoading(false);
      return;
    }
    
    // Procurando por código de referência em qualquer parte da URL
    // Exemplos: /convite/CL0005, /como/te/CL0005, ou qualquer outra variação
    const pathParts = location.split('/').filter(part => part.trim() !== '');
    
    console.log("Checking URL parts for referral code:", pathParts);
    
    // Verifica se a URL é explicitamente de formato "/como/te/CL0005"
    // Tratamos isto como prioridade máxima
    if (pathParts.length >= 3 && pathParts[0] === "como" && pathParts[1] === "te") {
      const code = pathParts[2];
      console.log("Checking code in /como/te/ format:", code);
      
      if (code.match(/^CL[0-9]+$/i)) {
        console.log("Found client referral code in '/como/te/' format:", code);
        setReferralType("client");
        setReferralCode(code);
        setLoading(false);
        return;
      } else if (code.match(/^LJ[0-9]+$/i)) {
        console.log("Found merchant referral code in '/como/te/' format:", code);
        setReferralType("merchant");
        setReferralCode(code);
        setLoading(false);
        return;
      }
    }
    
    // Verifica se é uma URL de rota específica: /client/referrals ou /merchant/referrals
    if (pathParts.length >= 2) {
      // Rota de lojistas
      if (pathParts[0] === "merchant" && pathParts[1] === "referrals") {
        console.log("User came from merchant referrals page");
        setReferralType("merchant");
        
        // Se tiver um código específico na URL como /merchant/referrals/LJ0001
        if (pathParts.length >= 3 && pathParts[2].match(/^LJ[0-9]+$/i)) {
          setReferralCode(pathParts[2]);
          setLoading(false);
          return;
        } else {
          // Caso contrário, buscar o primeiro lojista do sistema como referência padrão
          fetch("/api/merchants/first")
            .then(res => {
              if (res.ok) return res.json();
              throw new Error("Erro ao buscar lojista padrão");
            })
            .then(data => {
              if (data && data.referralCode) {
                console.log("Setting default merchant referral code:", data.referralCode);
                setReferralCode(data.referralCode);
                
                // Atualizamos também o estado global do convite
                queryClient.setQueryData(['/api/invite', data.referralCode], {
                  referrerId: data.referrerId,
                  referrerName: data.inviterName,
                  referrerType: data.inviterType,
                  referralCode: data.referralCode
                });
              }
              setLoading(false);
            })
            .catch(err => {
              console.error("Error fetching default merchant:", err);
              setLoading(false);
            });
          return;
        }
      }
      
      // Rota de clientes
      else if (pathParts[0] === "client" && pathParts[1] === "referrals") {
        console.log("User came from client referrals page");
        setReferralType("client");
        
        // Se tiver um código específico na URL
        if (pathParts.length >= 3 && pathParts[2].match(/^CL[0-9]+$/i)) {
          setReferralCode(pathParts[2]);
          setLoading(false);
          return;
        } else {
          // Buscar o primeiro cliente como referência padrão
          fetch("/api/clients/first")
            .then(res => {
              if (res.ok) return res.json();
              throw new Error("Erro ao buscar cliente padrão");
            })
            .then(data => {
              if (data && data.referralCode) {
                console.log("Setting default client referral code:", data.referralCode);
                setReferralCode(data.referralCode);
                
                // Atualizamos também o estado global do convite
                queryClient.setQueryData(['/api/invite', data.referralCode], {
                  referrerId: data.referrerId,
                  referrerName: data.inviterName,
                  referrerType: data.inviterType,
                  referralCode: data.referralCode
                });
              }
              setLoading(false);
            })
            .catch(err => {
              console.error("Error fetching default client:", err);
              setLoading(false);
            });
          return;
        }
      }
    }
    
    // Procura por códigos de referência em qualquer segmento da URL
    for (const part of pathParts) {
      // Verifica se é um código de referência de cliente
      if (part.match(/^CL[0-9]+$/i)) {
        console.log("Found client referral code:", part);
        setReferralType("client");
        setReferralCode(part);
        setLoading(false);
        return;
      } 
      // Verifica se é um código de referência de lojista
      else if (part.match(/^LJ[0-9]+$/i)) {
        console.log("Found merchant referral code:", part);
        setReferralType("merchant");
        setReferralCode(part);
        setLoading(false);
        return;
      }
    }
    
    // Se chegarmos aqui, finalmente verificamos se há um ID numérico na URL
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.match(/^[0-9]+$/)) {
        console.log("Found numeric ID in URL:", lastPart);
        // Vamos buscar o tipo de usuário e código de convite com base no ID
        fetch(`/api/user/${lastPart}/invitecode`)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error("Failed to fetch user invitation code");
          })
          .then(data => {
            if (data && data.invitationCode) {
              console.log("Retrieved invitation code:", data.invitationCode);
              if (data.invitationCode.startsWith("CL")) {
                setReferralType("client");
              } else if (data.invitationCode.startsWith("LJ")) {
                setReferralType("merchant");
              }
              setReferralCode(data.invitationCode);
            }
            setLoading(false);
          })
          .catch(err => {
            console.error("Error fetching invitation code:", err);
            setLoading(false);
          });
        return;
      }
    }
    
    // Se não detectou nenhum código, define um padrão
    setReferralType("client"); // Define cliente como tipo padrão
    setLoading(false);
  }, [location, loading]);
  
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
  
  // Vamos usar uma abordagem mais React-friendly sem acessar o DOM diretamente
  // e simplesmente garantir que nossos componentes do formulário não tenham props readOnly ou disabled
  
  // Em vez de usar efeitos DOM, vamos garantir que os dados do formulário estejam sempre atualizados
  useEffect(() => {
    if (clientForm && merchantForm) {
      // Atualiza os valores do código de referência nos formulários
      clientForm.setValue("referralCode", referralCode);
      merchantForm.setValue("referralCode", referralCode);
      
      // Coloca os campos em um estado válido para edição
      clientForm.clearErrors();
      merchantForm.clearErrors();
    }
  }, [referralCode, referralType, clientForm, merchantForm]);
  
  // Mutation para cadastro de cliente
  const clientRegisterMutation = useMutation({
    mutationFn: async (data: z.infer<typeof clientSchema>) => {
      try {
        const res = await fetch("/api/register/client", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            referralInfo: inviteData ? {
              referrerId: inviteData.referrerId,
              referralCode: inviteData.referralCode
            } : undefined
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
      // Registra o sucesso no console para facilitar o debug
      console.log("Cadastro cliente concluído com sucesso, preparando redirecionamento para /auth");
      
      // Mostra a mensagem de sucesso com um botão para ir para a página de login
      toast({
        title: "Cadastro realizado com sucesso!",
        description: (
          <div className="flex flex-col gap-2">
            <p>Você será redirecionado para a página de login em alguns instantes.</p>
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={() => window.location.href = "/auth"}
            >
              Ir para página de login agora
            </Button>
          </div>
        ),
        variant: "default",
        duration: 5000 // Aumenta a duração para dar tempo de clicar no botão
      });
      
      // Redirecionamento automático para a página de login
      setTimeout(() => {
        console.log("Executando redirecionamento automatico para /auth");
        window.location.href = "/auth"; // Usamos window.location em vez de setLocation
      }, 3000);
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
        const res = await fetch("/api/register/merchant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            referralInfo: inviteData ? {
              referrerId: inviteData.referrerId,
              referralCode: inviteData.referralCode
            } : undefined
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
      // Registra o sucesso no console para facilitar o debug
      console.log("Cadastro lojista concluído com sucesso, preparando redirecionamento para /auth");
      
      // Mostra a mensagem de sucesso com um botão para ir para a página de login
      toast({
        title: "Cadastro realizado com sucesso!",
        description: (
          <div className="flex flex-col gap-2">
            <p>Seu cadastro será analisado e você receberá um email com as próximas instruções.</p>
            <p>Você será redirecionado para a página de login em alguns instantes.</p>
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={() => window.location.href = "/auth"}
            >
              Ir para página de login agora
            </Button>
          </div>
        ),
        variant: "default",
        duration: 5000 // Aumenta a duração para dar tempo de clicar no botão
      });
      
      // Redirecionamento automático para a página de login
      setTimeout(() => {
        console.log("Executando redirecionamento automatico para /auth");
        window.location.href = "/auth"; // Usamos window.location em vez de setLocation
      }, 3000);
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
        console.log("Verificando informações do convite com código:", referralCode);
        const res = await fetch(`/api/invite/${referralCode}`);
        
        if (!res.ok) {
          console.warn("Código de convite não encontrado");
          return null;
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Resposta não é JSON válido');
          return null;
        }
        
        const data = await res.json();
        console.log("Dados do convite recebidos:", data);
        
        if (data.valid) {
          // Armazena o nome do referenciador quando os dados são carregados
          if (data.referrerName) {
            console.log("Referenciador encontrado:", data.referrerName);
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
    retry: 2, // Aumenta o número de tentativas para garantir
    staleTime: 60000 // Mantém os dados por 1 minuto
  });

  // Funções para submissão dos formulários
  const onClientSubmit = (data: z.infer<typeof clientSchema>) => {
    console.log("Cliente se cadastrando com dados:", data);
    console.log("Código de referência:", data.referralCode);
    console.log("Dados de convite:", inviteData);
    
    // Garantimos que o formulário incluirá os dados corretos de referência
    const formData = {
      ...data,
      // Adicionamos os dados do referenciador como propriedades extras
      // que serão processadas no backend
      referralInfo: inviteData ? {
        referrerId: inviteData.referrerId,
        referralCode: inviteData.referralCode
      } : data.referralCode ? {
        referralCode: data.referralCode
      } : undefined
    };

    console.log("Enviando dados de cadastro:", formData);
    clientRegisterMutation.mutate(formData as any);
  };
  
  const onMerchantSubmit = (data: z.infer<typeof merchantSchema>) => {
    console.log("Lojista se cadastrando com dados:", data);
    console.log("Código de referência:", data.referralCode);
    console.log("Dados de convite:", inviteData);
    
    const formData = {
      ...data,
      // Adicionamos os dados do referenciador como propriedades extras
      referralInfo: inviteData ? {
        referrerId: inviteData.referrerId,
        referralCode: inviteData.referralCode
      } : data.referralCode ? {
        referralCode: data.referralCode
      } : undefined
    };

    console.log("Enviando dados de cadastro:", formData);
    merchantRegisterMutation.mutate(formData as any);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <a href="/" className="flex items-center">
            <LogoIcon className="h-10 w-10" />
            <span className="ml-2 text-xl font-bold">Vale Cashback</span>
          </a>
          <nav className="ml-auto flex gap-4">
            <Button variant="outline" onClick={() => setLocation("/auth")}>Entrar</Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container py-10">
        <div className="mx-auto max-w-[950px]">
          <div className="grid md:grid-cols-5 gap-8">
            {/* Coluna Esquerda - Informações sobre o programa */}
            <div className="md:col-span-2">
              <div className="sticky top-24 space-y-6">
                <div className="bg-gradient-to-br from-primary/90 to-primary rounded-xl p-6 text-white shadow-lg">
                  <h2 className="text-xl font-bold mb-4">
                    {referralType === "client" 
                      ? "Programa Vale Cashback" 
                      : "Programa de Parceiros"}
                  </h2>
                  <p className="mb-4 opacity-90">
                    {referralType === "client"
                      ? "Participe do programa Vale Cashback e receba recompensas em suas compras nos estabelecimentos parceiros."
                      : "Aumente suas vendas oferecendo cashback aos seus clientes e atraindo novos consumidores para o seu negócio."}
                  </p>
                  <div className="flex items-center gap-2 mt-6">
                    <div className="p-2 bg-white/20 rounded-full">
                      <LogoIcon className="h-8 w-8 text-white" />
                    </div>
                    <span className="font-semibold">Vale Cashback</span>
                  </div>
                </div>
                
                <Card className="border shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {referralType === "client" 
                        ? "Benefícios para Clientes" 
                        : "Benefícios para Parceiros"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {referralType === "client" ? (
                        <>
                          <li className="flex items-start gap-2">
                            <div className="h-5 w-5 text-primary mt-0.5">✓</div>
                            <span>Receba até 2% de cashback em cada compra</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-5 w-5 text-primary mt-0.5">✓</div>
                            <span>Bônus de 1% em todas as compras de indicados</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-5 w-5 text-primary mt-0.5">✓</div>
                            <span>Aumenta seu limite de cashback mensal</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-5 w-5 text-primary mt-0.5">✓</div>
                            <span>Aproveite as vantagens do programa de fidelidade</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start gap-2">
                            <div className="h-5 w-5 text-blue-600 mt-0.5">✓</div>
                            <span>Aumente suas vendas com cashback</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-5 w-5 text-blue-600 mt-0.5">✓</div>
                            <span>1% indicações de bônus para começar</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-5 w-5 text-blue-600 mt-0.5">✓</div>
                            <span>Indique outros lojistas e seja recompensado</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-5 w-5 text-blue-600 mt-0.5">✓</div>
                            <span>Acompanhe vendas em tempo real</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Coluna Direita - Formulário */}
            <div className="md:col-span-3">
              <Card className="border-2 border-primary/10 shadow-lg">
                <CardHeader className="text-center border-b pb-6">
                  <CardTitle className="text-2xl font-bold">
                    {referralType === "client" 
                      ? "Cadastre-se usando código de indicação" 
                      : "Torne-se um parceiro Vale Cashback"}
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    {referrerName ? (
                      <span className="flex flex-col items-center space-y-2">
                        <strong className="text-primary font-medium">
                          Você foi convidado(a) por {referrerName}
                        </strong>
                        <span className="text-sm">
                          {referralType === "client"
                            ? `Código de indicação: ${referralCode}`
                            : `Código de parceiro: ${referralCode}`}
                        </span>
                        <div className="w-full max-w-md h-1 bg-primary/10 rounded-full mt-2">
                          <div className="h-1 bg-primary rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </span>
                    ) : (
                      <span>
                        {referralType === "client"
                          ? `Você foi convidado(a) com o código ${referralCode}. Complete seu cadastro abaixo.`
                          : `Você foi convidado(a) a ser parceiro com o código ${referralCode}. Complete seu cadastro abaixo.`}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Seletor de tipo de usuário */}
                  <div className="mb-6 flex flex-col space-y-2">
                    <span className="text-sm text-muted-foreground">Selecione um tipo de conta:</span>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        type="button"
                        variant={referralType === "client" ? "default" : "outline"} 
                        className={referralType === "client" ? "border-2 border-primary" : ""}
                        onClick={() => setReferralType("client")}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Cliente
                      </Button>
                      <Button 
                        type="button"
                        variant={referralType === "merchant" ? "default" : "outline"} 
                        className={referralType === "merchant" ? "border-2 border-primary" : ""}
                        onClick={() => setReferralType("merchant")}
                      >
                        <Store className="mr-2 h-4 w-4" />
                        Lojista
                      </Button>
                    </div>
                  </div>
                  
                  {referralType === "client" ? (
                    // Formulário para cliente
                    <Form {...clientForm}>
                      <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
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
                                  <Input type="email" placeholder="seu.email@exemplo.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={clientForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(11) 98765-4321" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={clientForm.control}
                            name="referralCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código de Indicação</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                  Código de quem te convidou
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={clientForm.control}
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
                            control={clientForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="******" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Alert className="bg-primary/5 border-primary/20">
                          <UserPlus className="h-5 w-5 text-primary" />
                          <AlertTitle className="text-primary font-semibold">Bônus de Indicação</AlertTitle>
                          <AlertDescription className="text-slate-700">
                            Ganhe <span className="font-medium text-primary">1%</span> de bônus sobre o valor das compras realizadas por amigos que você indicar. Quanto mais indicações, maiores seus ganhos no programa de fidelidade.
                          </AlertDescription>
                        </Alert>
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={clientRegisterMutation.isPending}
                        >
                          {clientRegisterMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : "Criar Conta"}
                        </Button>
                      </form>
                    </Form>
                  ) : (
                    // Formulário para lojista com campos diretos
                    <form onSubmit={merchantForm.handleSubmit(onMerchantSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Campo de nome implementado diretamente com register */}
                        <div className="space-y-2">
                          <label htmlFor="merchant-name" className="text-sm font-medium">Nome do Responsável</label>
                          <input 
                            id="merchant-name"
                            type="text" 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Nome completo" 
                            {...merchantForm.register('name')}
                            />
                          {merchantForm.formState.errors.name && (
                            <p className="text-sm font-medium text-destructive">{merchantForm.formState.errors.name.message}</p>
                          )}
                          </div>
                          
                          {/* Campo de email implementado diretamente com register */}
                          <div className="space-y-2">
                            <label htmlFor="merchant-email" className="text-sm font-medium">Email</label>
                            <input 
                              id="merchant-email"
                              type="email" 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="contato@loja.com" 
                              {...merchantForm.register('email')}
                            />
                            {merchantForm.formState.errors.email && (
                              <p className="text-sm font-medium text-destructive">{merchantForm.formState.errors.email.message}</p>
                            )}
                          </div>
                          {/* Nome da Loja */}
                          <div className="space-y-2">
                            <label htmlFor="merchant-store-name" className="text-sm font-medium">Nome da Loja</label>
                            <input 
                              id="merchant-store-name"
                              type="text" 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Nome do estabelecimento" 
                              {...merchantForm.register('storeName')}
                            />
                            {merchantForm.formState.errors.storeName && (
                              <p className="text-sm font-medium text-destructive">{merchantForm.formState.errors.storeName.message}</p>
                            )}
                          </div>
                          
                          {/* Tipo de Estabelecimento */}
                          <div className="space-y-2">
                            <label htmlFor="merchant-store-type" className="text-sm font-medium">Tipo de Estabelecimento</label>
                            <select
                              id="merchant-store-type"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...merchantForm.register('storeType')}
                            >
                              <option value="">Selecione o tipo</option>
                              {storeTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                            {merchantForm.formState.errors.storeType && (
                              <p className="text-sm font-medium text-destructive">{merchantForm.formState.errors.storeType.message}</p>
                            )}
                          </div>

                          {/* Telefone */}
                          <div className="space-y-2">
                            <label htmlFor="merchant-phone" className="text-sm font-medium">Telefone</label>
                            <input 
                              id="merchant-phone"
                              type="text" 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="(11) 98765-4321" 
                              {...merchantForm.register('phone')}
                            />
                            {merchantForm.formState.errors.phone && (
                              <p className="text-sm font-medium text-destructive">{merchantForm.formState.errors.phone.message}</p>
                            )}
                          </div>
                          
                          {/* Senha */}
                          <div className="space-y-2">
                            <label htmlFor="merchant-password" className="text-sm font-medium">Senha</label>
                            <input 
                              id="merchant-password"
                              type="password" 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="******" 
                              {...merchantForm.register('password')}
                            />
                            {merchantForm.formState.errors.password && (
                              <p className="text-sm font-medium text-destructive">{merchantForm.formState.errors.password.message}</p>
                            )}
                          </div>
                          
                          {/* Confirmar Senha */}
                          <div className="space-y-2">
                            <label htmlFor="merchant-confirm-password" className="text-sm font-medium">Confirmar Senha</label>
                            <input 
                              id="merchant-confirm-password"
                              type="password" 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="******" 
                              {...merchantForm.register('confirmPassword')}
                            />
                            {merchantForm.formState.errors.confirmPassword && (
                              <p className="text-sm font-medium text-destructive">{merchantForm.formState.errors.confirmPassword.message}</p>
                            )}
                          </div>
                          
                          {/* Código de referência - campo oculto */}
                          <input 
                            type="hidden" 
                            {...merchantForm.register('referralCode')}
                          />
                        </div>
                        
                        <Alert className="bg-blue-50 border-blue-200">
                          <Store className="h-5 w-5 text-blue-600" />
                          <AlertTitle className="text-blue-600 font-semibold">Programa de Parceria</AlertTitle>
                          <AlertDescription className="text-slate-700">
                            Ao se cadastrar como parceiro, você poderá oferecer cashback aos seus clientes e aumentar suas vendas. Receba <span className="font-medium text-blue-600">1% indicações</span> de bônus para utilizar na plataforma e atraia mais clientes para seu negócio.
                          </AlertDescription>
                        </Alert>
                        
                        <Alert variant="destructive" className="bg-red-50 border-red-200">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <AlertTitle className="text-red-600 font-semibold">Aprovação imediata</AlertTitle>
                          <AlertDescription className="text-slate-700">
                            Seu cadastro será aprovado automaticamente. Você receberá um email com instruções de acesso e poderá começar a usar a plataforma imediatamente após o cadastro.
                          </AlertDescription>
                        </Alert>
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={merchantRegisterMutation.isPending}
                        >
                          {merchantRegisterMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : "Criar Conta de Parceiro"}
                        </Button>
                      </form>
                  )}
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-6">
                  <p className="text-sm text-muted-foreground">
                    Já tem uma conta? <a href="/auth" className="text-primary hover:underline">Faça login</a>
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-8 bg-gray-50">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LogoIcon className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl">Vale Cashback</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                A plataforma de cashback que conecta clientes e lojistas, oferecendo recompensas em todas as compras.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-3">Programa</h3>
              <ul className="space-y-2">
                <li><a href="/auth" className="text-muted-foreground hover:text-primary text-sm">Entrar</a></li>
                <li><a href="/about" className="text-muted-foreground hover:text-primary text-sm">Sobre nós</a></li>
                <li><a href="/partners" className="text-muted-foreground hover:text-primary text-sm">Parceiros</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-3">Recursos</h3>
              <ul className="space-y-2">
                <li><a href="/faq" className="text-muted-foreground hover:text-primary text-sm">FAQ</a></li>
                <li><a href="/terms" className="text-muted-foreground hover:text-primary text-sm">Termos de Uso</a></li>
                <li><a href="/privacy" className="text-muted-foreground hover:text-primary text-sm">Política de Privacidade</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-3">Contato</h3>
              <ul className="space-y-2">
                <li className="text-muted-foreground text-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  +1 (555) 123-4567
                </li>
                <li className="text-muted-foreground text-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  contato@valecashback.com
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Vale Cashback. Todos os direitos reservados.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}