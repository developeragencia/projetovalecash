import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Definir schema com mensagens traduzidas
function getClientFormSchema(t: any) {
  return z.object({
    name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
    email: z.string().email({ message: "Email inválido" }),
    phone: z.string().optional().refine((val) => !val || val.length >= 10, {
      message: "Telefone deve ter pelo menos 10 dígitos"
    }),
    invitationCode: z.string().optional(),
    securityQuestion: z.string().min(1, { message: "Selecione uma pergunta de segurança" }),
    securityAnswer: z.string().min(2, { message: "Forneça uma resposta de segurança" }),
    password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
    confirmPassword: z.string().min(6, { message: "Confirmação deve ter pelo menos 6 caracteres" }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });
}

// Definir schema do lojista com mensagens traduzidas
function getMerchantFormSchema(t: any) {
  return z.object({
    name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
    email: z.string().email({ message: "Email inválido" }),
    phone: z.string().optional().refine((val) => !val || val.length >= 10, {
      message: "Telefone deve ter pelo menos 10 dígitos"
    }),
    storeName: z.string().min(3, { message: "Nome da loja deve ter pelo menos 3 caracteres" }),
    category: z.string().min(1, { message: "Selecione uma categoria" }),
    companyLogo: z.any().optional(),
    invitationCode: z.string().optional(),
    securityQuestion: z.string().min(1, { message: "Selecione uma pergunta de segurança" }),
    securityAnswer: z.string().min(2, { message: "Forneça uma resposta de segurança" }),
    password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
    confirmPassword: z.string().min(6, { message: "Confirmação deve ter pelo menos 6 caracteres" }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });
}

// Uso posterior para os tipos
type ClientFormValues = z.infer<ReturnType<typeof getClientFormSchema>>;
type MerchantFormValues = z.infer<ReturnType<typeof getMerchantFormSchema>>;

export default function Register() {
  const [type, setType] = useState<"client" | "merchant">("client");
  const { register, loading } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Estados para validação em tempo real
  const [emailStatus, setEmailStatus] = useState<'checking' | 'available' | 'taken' | 'idle'>('idle');
  const [phoneStatus, setPhoneStatus] = useState<'checking' | 'available' | 'taken' | 'idle'>('idle');
  const [emailTimeout, setEmailTimeout] = useState<NodeJS.Timeout | null>(null);
  const [phoneTimeout, setPhoneTimeout] = useState<NodeJS.Timeout | null>(null);

  // Função para verificar se email já existe
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailStatus('idle');
      return;
    }
    
    setEmailStatus('checking');
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmailStatus(data.exists ? 'taken' : 'available');
      }
    } catch (error) {
      setEmailStatus('idle');
    }
  }, []);

  // Função para verificar se telefone já existe
  const checkPhoneAvailability = useCallback(async (phone: string) => {
    if (!phone || phone.trim().length < 10) {
      setPhoneStatus('idle');
      return;
    }
    
    setPhoneStatus('checking');
    try {
      const response = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPhoneStatus(data.exists ? 'taken' : 'available');
      } else {
        setPhoneStatus('idle');
      }
    } catch (error) {
      console.error('Erro ao verificar telefone:', error);
      setPhoneStatus('idle');
    }
  }, []);

  // Criar os esquemas de validação usando a função de tradução
  const clientFormSchema = getClientFormSchema(t);
  const merchantFormSchema = getMerchantFormSchema(t);
  
  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      invitationCode: "",
      securityQuestion: "",
      securityAnswer: "",
      password: "",
      confirmPassword: "",
    },
  });

  const merchantForm = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      storeName: "",
      category: "",
      companyLogo: "",
      invitationCode: "",
      securityQuestion: "",
      securityAnswer: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onClientSubmit = async (values: ClientFormValues) => {
    try {
      await register({
        ...values,
        type: "client",
      });
    } catch (error) {
      console.error("Register error:", error);
    }
  };

  const onMerchantSubmit = async (values: MerchantFormValues) => {
    try {
      await register({
        ...values,
        type: "merchant",
      });
    } catch (error) {
      console.error("Register error:", error);
    }
  };

  return (
    <AuthLayout title={t('auth.registerTitle')} description={t('auth.registerDescription')}>
      <Tabs defaultValue="client" onValueChange={(value) => setType(value as "client" | "merchant")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="client">{t('auth.client')}</TabsTrigger>
          <TabsTrigger value="merchant">{t('auth.merchant')}</TabsTrigger>
        </TabsList>

        <TabsContent value="client">
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
              <FormField
                control={clientForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.fullName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} disabled={loading} />
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
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="email" 
                          placeholder="" 
                          {...field} 
                          disabled={loading}
                          onChange={(e) => {
                            field.onChange(e);
                            // Limpar timeout anterior
                            if (emailTimeout) clearTimeout(emailTimeout);
                            // Verificar após 1 segundo
                            const timeout = setTimeout(() => {
                              checkEmailAvailability(e.target.value);
                            }, 1000);
                            setEmailTimeout(timeout);
                          }}
                        />
                        {emailStatus === 'checking' && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {emailStatus === 'taken' && (
                          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                        )}
                        {emailStatus === 'available' && (
                          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </FormControl>
                    {emailStatus === 'taken' && (
                      <p className="text-sm text-red-500 mt-1">Este email já está em uso</p>
                    )}
                    {emailStatus === 'available' && (
                      <p className="text-sm text-green-500 mt-1">Email disponível</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />



              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={clientForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="" 
                            {...field} 
                            disabled={loading}
                            onChange={(e) => {
                              field.onChange(e);
                              // Limpar timeout anterior
                              if (phoneTimeout) clearTimeout(phoneTimeout);
                              // Verificar após 1 segundo
                              const timeout = setTimeout(() => {
                                checkPhoneAvailability(e.target.value);
                              }, 1000);
                              setPhoneTimeout(timeout);
                            }}
                          />
                          {phoneStatus === 'checking' && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                          )}
                          {phoneStatus === 'taken' && (
                            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                          )}
                          {phoneStatus === 'available' && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </FormControl>
                      {phoneStatus === 'taken' && (
                        <p className="text-sm text-red-500 mt-1">Este telefone já está em uso</p>
                      )}
                      {phoneStatus === 'available' && (
                        <p className="text-sm text-green-500 mt-1">Telefone disponível</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="invitationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Convite</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={clientForm.control}
                name="securityQuestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pergunta de Segurança</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                        disabled={loading}
                      >
                        <option value="">Selecione uma pergunta</option>
                        <option value="Qual o nome do seu primeiro animal de estimação?">Qual o nome do seu primeiro animal de estimação?</option>
                        <option value="Qual o nome da cidade onde você nasceu?">Qual o nome da cidade onde você nasceu?</option>
                        <option value="Qual o nome do seu melhor amigo de infância?">Qual o nome do seu melhor amigo de infância?</option>
                        <option value="Qual era o nome da sua primeira escola?">Qual era o nome da sua primeira escola?</option>
                        <option value="Qual o modelo do seu primeiro carro?">Qual o modelo do seu primeiro carro?</option>
                        <option value="Qual o nome de solteira da sua mãe?">Qual o nome de solteira da sua mãe?</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={clientForm.control}
                name="securityAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resposta de Segurança</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} disabled={loading} />
                    </FormControl>
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
                      <Input type="password" placeholder="" {...field} disabled={loading} />
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
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="merchant">
          <Form {...merchantForm}>
            <form onSubmit={merchantForm.handleSubmit(onMerchantSubmit)} className="space-y-4">
              <FormField
                control={merchantForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={merchantForm.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da loja</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={merchantForm.control}
                name="companyLogo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-bold text-accent">Logo da Empresa</FormLabel>
                    <div className="border-2 border-dashed border-accent rounded-md p-4 bg-accent/5">
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          className="bg-white cursor-pointer" 
                          onChange={(e) => {
                            // Em uma implementação real, aqui faríamos upload da imagem
                            // e atualizaríamos o campo com a URL da imagem
                            const file = e.target.files?.[0];
                            if (file) {
                              // Simular valor para o campo (normalmente seria URL da imagem)
                              field.onChange(file.name);
                            }
                          }} 
                          disabled={loading} 
                        />
                      </FormControl>
                      <FormDescription className="mt-2 text-center">
                        Selecione o arquivo de imagem do logotipo da sua empresa
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={merchantForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="email" 
                            placeholder="" 
                            {...field} 
                            disabled={loading}
                            onChange={(e) => {
                              field.onChange(e);
                              // Limpar timeout anterior
                              if (emailTimeout) clearTimeout(emailTimeout);
                              // Verificar após 1 segundo
                              const timeout = setTimeout(() => {
                                checkEmailAvailability(e.target.value);
                              }, 1000);
                              setEmailTimeout(timeout);
                            }}
                          />
                          {emailStatus === 'checking' && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                          )}
                          {emailStatus === 'taken' && (
                            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                          )}
                          {emailStatus === 'available' && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </FormControl>
                      {emailStatus === 'taken' && (
                        <p className="text-sm text-red-500 mt-1">Este email já está em uso</p>
                      )}
                      {emailStatus === 'available' && (
                        <p className="text-sm text-green-500 mt-1">Email disponível</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={merchantForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="" 
                            {...field} 
                            disabled={loading}
                            onChange={(e) => {
                              field.onChange(e);
                              // Limpar timeout anterior
                              if (phoneTimeout) clearTimeout(phoneTimeout);
                              // Verificar após 1 segundo
                              const timeout = setTimeout(() => {
                                checkPhoneAvailability(e.target.value);
                              }, 1000);
                              setPhoneTimeout(timeout);
                            }}
                          />
                          {phoneStatus === 'checking' && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                          )}
                          {phoneStatus === 'taken' && (
                            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                          )}
                          {phoneStatus === 'available' && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </FormControl>
                      {phoneStatus === 'taken' && (
                        <p className="text-sm text-red-500 mt-1">Este telefone já está em uso</p>
                      )}
                      {phoneStatus === 'available' && (
                        <p className="text-sm text-green-500 mt-1">Telefone disponível</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>





              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={merchantForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          disabled={loading}
                        >
                          <option value="">Selecione uma categoria</option>
                          <option value="restaurant">Restaurante</option>
                          <option value="market">Supermercado</option>
                          <option value="pharmacy">Farmácia</option>
                          <option value="clothing">Vestuário</option>
                          <option value="gas_station">Posto de Combustível</option>
                          <option value="other">Outros</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <div className="grid grid-cols-2 gap-4">

                <FormField
                  control={merchantForm.control}
                  name="invitationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Convite</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={merchantForm.control}
                name="securityQuestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pergunta de Segurança</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                        disabled={loading}
                      >
                        <option value="">Selecione uma pergunta</option>
                        <option value="Qual o nome do seu primeiro animal de estimação?">Qual o nome do seu primeiro animal de estimação?</option>
                        <option value="Qual o nome da cidade onde você nasceu?">Qual o nome da cidade onde você nasceu?</option>
                        <option value="Qual o nome do seu melhor amigo de infância?">Qual o nome do seu melhor amigo de infância?</option>
                        <option value="Qual era o nome da sua primeira escola?">Qual era o nome da sua primeira escola?</option>
                        <option value="Qual o modelo do seu primeiro carro?">Qual o modelo do seu primeiro carro?</option>
                        <option value="Qual o nome de solteira da sua mãe?">Qual o nome de solteira da sua mãe?</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={merchantForm.control}
                name="securityAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resposta de Segurança</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={merchantForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="" {...field} disabled={loading} />
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
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" variant="default" className="w-full bg-accent" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      <div className="mt-4 text-center">
        <p className="text-sm">
          Já tem uma conta?{" "}
          <Link href="/auth/login" className="text-secondary font-medium hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
