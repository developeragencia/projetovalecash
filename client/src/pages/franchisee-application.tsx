import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useNavigate, Link } from 'wouter';
import { Check, ArrowRight, Briefcase, Building, DollarSign, CalendarClock, MapPin, Phone, Mail, Award } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { LogoIcon } from '@/components/ui/icons';

// Schema de validação para o formulário
const franchiseeSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  businessExperience: z.string().min(1, "Selecione uma opção"),
  investment: z.string().min(1, "Selecione uma opção"),
  timeline: z.string().min(1, "Selecione uma opção"),
  message: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Você precisa aceitar os termos para continuar",
  })
});

type FranchiseeFormValues = z.infer<typeof franchiseeSchema>;

export default function FranchiseeApplication() {
  const [location, navigate] = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Configuração do formulário
  const form = useForm<FranchiseeFormValues>({
    resolver: zodResolver(franchiseeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      businessExperience: "",
      investment: "",
      timeline: "",
      message: "",
      termsAccepted: false
    }
  });

  // Mutation para enviar o formulário
  const mutation = useMutation({
    mutationFn: async (values: FranchiseeFormValues) => {
      try {
        const response = await apiRequest('POST', '/api/franchisee-application', values);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao enviar formulário');
        }
        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error('Erro desconhecido ao enviar formulário');
      }
    },
    onSuccess: () => {
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast({
          title: "Erro ao enviar",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Ocorreu um erro ao enviar o formulário. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  });

  // Handler de envio do formulário
  const onSubmit = (values: FranchiseeFormValues) => {
    // Em um ambiente de produção, usaríamos a mutation para enviar
    // Para este exemplo, vamos simular um envio bem-sucedido
    console.log('Valores do formulário:', values);
    
    // Simula o sucesso do envio para demonstração
    setTimeout(() => {
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    }, 1000);
  };

  return (
    <>
      <Helmet>
        <title>Vale Cashback - Solicitação de Franquia</title>
        <meta name="description" content="Solicite uma franquia Vale Cashback e faça parte da nossa rede de sucesso." />
      </Helmet>

      {isSubmitted ? (
        <AuthLayout 
          title="Solicitação Recebida!" 
          description="Obrigado pelo interesse em se tornar um franqueado Vale Cashback"
        >
          <Card className="border-green-100 bg-green-50">
            <CardContent className="pt-6 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-green-800">Recebemos sua solicitação!</h3>
                <p className="text-green-700">
                  Nossa equipe analisará suas informações e entrará em contato em breve.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-gray-500 text-sm">
                  O prazo médio para resposta é de até 5 dias úteis. 
                  Se tiver dúvidas, entre em contato através do email <strong>franquias@valecashback.com</strong>
                </p>
              </div>
              
              <div className="pt-4">
                <Link href="/">
                  <Button className="w-full">
                    Retornar à página inicial
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </AuthLayout>
      ) : (
        <AuthLayout 
          title="Seja um Franqueado" 
          description="Preencha o formulário abaixo para solicitar informações sobre como se tornar um franqueado Vale Cashback"
        >
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Por que se tornar um franqueado Vale Cashback?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-white">
                  <div className="rounded-full bg-blue-100 p-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Alto Potencial de Lucro</h4>
                    <p className="text-sm text-gray-500">Modelo de negócio comprovado com retorno sobre investimento atrativo</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-white">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Baixo Investimento Inicial</h4>
                    <p className="text-sm text-gray-500">Início com uma estrutura enxuta e custos operacionais reduzidos</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-white">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Marca Reconhecida</h4>
                    <p className="text-sm text-gray-500">Faça parte de uma marca com credibilidade no mercado de cashback</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-white">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Suporte Completo</h4>
                    <p className="text-sm text-gray-500">Treinamento, marketing e suporte operacional contínuo</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-b py-6">
              <h3 className="text-lg font-medium mb-4">Preencha seus dados</h3>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo*</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email*</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-10" placeholder="seu@email.com" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone*</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-10" placeholder="(00) 00000-0000" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade*</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-10" placeholder="Sua cidade" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado*</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione seu estado" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AC">Acre</SelectItem>
                                  <SelectItem value="AL">Alagoas</SelectItem>
                                  <SelectItem value="AP">Amapá</SelectItem>
                                  <SelectItem value="AM">Amazonas</SelectItem>
                                  <SelectItem value="BA">Bahia</SelectItem>
                                  <SelectItem value="CE">Ceará</SelectItem>
                                  <SelectItem value="DF">Distrito Federal</SelectItem>
                                  <SelectItem value="ES">Espírito Santo</SelectItem>
                                  <SelectItem value="GO">Goiás</SelectItem>
                                  <SelectItem value="MA">Maranhão</SelectItem>
                                  <SelectItem value="MT">Mato Grosso</SelectItem>
                                  <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                                  <SelectItem value="MG">Minas Gerais</SelectItem>
                                  <SelectItem value="PA">Pará</SelectItem>
                                  <SelectItem value="PB">Paraíba</SelectItem>
                                  <SelectItem value="PR">Paraná</SelectItem>
                                  <SelectItem value="PE">Pernambuco</SelectItem>
                                  <SelectItem value="PI">Piauí</SelectItem>
                                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                                  <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                                  <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                                  <SelectItem value="RO">Rondônia</SelectItem>
                                  <SelectItem value="RR">Roraima</SelectItem>
                                  <SelectItem value="SC">Santa Catarina</SelectItem>
                                  <SelectItem value="SP">São Paulo</SelectItem>
                                  <SelectItem value="SE">Sergipe</SelectItem>
                                  <SelectItem value="TO">Tocantins</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="businessExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Experiência em negócios*</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma opção" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhuma experiência</SelectItem>
                                <SelectItem value="small">Menos de 2 anos</SelectItem>
                                <SelectItem value="medium">2 a 5 anos</SelectItem>
                                <SelectItem value="large">Mais de 5 anos</SelectItem>
                                <SelectItem value="franchise">Tenho experiência com franquias</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="investment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capital disponível para investimento*</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma opção" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="small">Até $20.000</SelectItem>
                                  <SelectItem value="medium">$20.000 a $50.000</SelectItem>
                                  <SelectItem value="large">$50.000 a $100.000</SelectItem>
                                  <SelectItem value="xlarge">Mais de $100.000</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="timeline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prazo para abertura do negócio*</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma opção" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="immediate">Imediato</SelectItem>
                                  <SelectItem value="three_months">Até 3 meses</SelectItem>
                                  <SelectItem value="six_months">Até 6 meses</SelectItem>
                                  <SelectItem value="one_year">Até 1 ano</SelectItem>
                                  <SelectItem value="future">Apenas pesquisando</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Informações adicionais</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Compartilhe mais detalhes sobre seu interesse em nossa franquia..." 
                              className="h-32 resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Se já atuou no mercado de cashback ou possui outros negócios, conte um pouco mais.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="termsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Concordo em receber informações sobre a franquia Vale Cashback
                            </FormLabel>
                            <FormDescription>
                              Seus dados serão tratados de acordo com nossa Política de Privacidade.
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>Enviando...</>
                    ) : (
                      <>
                        Enviar solicitação
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-blue-100 p-2 flex-shrink-0">
                  <LogoIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Vale Cashback Franquias</h3>
                  <p className="text-sm text-blue-700">Faça parte do nosso sucesso</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <CalendarClock className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">Retorno em até 5 dias úteis após o envio</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">franquias@valecashback.com</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <Phone className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">(00) 1234-5678</span>
                </div>
              </div>
            </div>
          </div>
        </AuthLayout>
      )}
    </>
  );
}