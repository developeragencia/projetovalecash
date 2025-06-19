import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  HelpCircle, 
  Info, 
  FileQuestion, 
  MessageSquare, 
  Send, 
  PhoneCall, 
  Mail, 
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema para o formulário de contato
const contactFormSchema = z.object({
  subject: z.string().min(5, { message: "Assunto deve ter pelo menos 5 caracteres" }),
  category: z.string().min(1, { message: "Selecione uma categoria" }),
  priority: z.string().min(1, { message: "Selecione uma prioridade" }),
  message: z.string().min(20, { message: "Mensagem deve ter pelo menos 20 caracteres" }),
  attachment: z.any().optional(),
});

// FAQs para lojistas
const merchantFaqs = [
  {
    question: "Como funciona o sistema de cashback?",
    answer: "O sistema de cashback é uma forma de fidelização onde os clientes recebem de volta uma porcentagem do valor gasto em suas compras. Por padrão, a taxa de cashback é de 2% sobre o valor da compra, mas você pode oferecer um bônus adicional através das configurações da sua loja. O valor do cashback é creditado automaticamente na carteira digital do cliente, que pode utilizá-lo em compras futuras em qualquer estabelecimento parceiro."
  },
  {
    question: "Como recebo os pagamentos das vendas?",
    answer: "Os pagamentos das vendas são processados automaticamente e transferidos para sua conta bancária cadastrada. Se você utiliza os meios de pagamento integrados (cartão de crédito, débito ou PIX), o valor é transferido em até 2 dias úteis, já descontada a taxa de serviço. Para pagamentos em dinheiro ou cashback, o sistema apenas registra a venda para fins de controle e distribuição de cashback, mas o valor já foi recebido diretamente por você no momento da venda."
  },
  {
    question: "Como funciona o programa de indicações para lojistas?",
    answer: "Ao indicar outros estabelecimentos para participar da plataforma, você recebe comissões contínuas sobre as vendas realizadas por eles. Você ganha 0,5% sobre todas as vendas processadas pela loja indicada, além de um bônus fixo mensal de $ 50 por loja ativa que você indicou. Compartilhe seu código de indicação ou link personalizado com outros lojistas, e quando eles se cadastrarem usando seu código, serão automaticamente vinculados à sua indicação."
  },
  {
    question: "Como configurar taxas de cashback personalizadas?",
    answer: "Você pode configurar uma taxa adicional de cashback (bônus) nas configurações da sua loja, em 'Pagamentos'. O sistema sempre aplica o cashback padrão de 2%, mas você pode adicionar um bônus de até 10% para aumentar a atratividade da sua loja. Você também pode definir um valor mínimo de compra para que o cliente tenha direito ao cashback."
  },
  {
    question: "Como resolver problemas com pagamentos?",
    answer: "Se ocorrer algum problema com pagamentos, verifique primeiro se as informações bancárias estão corretas nas configurações da sua loja. Se tudo estiver correto, entre em contato com nosso suporte através da aba 'Contato' informando o ID da transação que apresentou problema, e nossa equipe irá ajudá-lo a resolver a situação o mais rápido possível."
  },
  {
    question: "É possível estornar uma venda?",
    answer: "Sim, é possível estornar uma venda dentro de 7 dias após o registro. Para isso, vá até 'Histórico de Transações', encontre a venda que deseja estornar, clique em 'Ver detalhes' e depois em 'Estornar Venda'. O valor do cashback será automaticamente revertido da carteira do cliente, desde que ele tenha saldo suficiente. Caso contrário, o sistema irá gerar um saldo negativo para compensação futura."
  },
  {
    question: "Como gerar relatórios personalizados?",
    answer: "Na seção 'Relatórios', você pode personalizar e gerar diversos tipos de relatórios para análise de desempenho da sua loja. Utilize os filtros de período, tipo de pagamento e produtos para criar relatórios específicos. Todos os relatórios podem ser exportados em formato CSV para análise em ferramentas externas."
  },
];

// Dados mockados de tickets de suporte
const supportTickets = [
  {
    id: "T-1234",
    subject: "Dúvida sobre pagamentos",
    category: "payment",
    priority: "medium",
    status: "answered",
    created: "01/07/2023 10:22",
    lastUpdate: "01/07/2023 11:45",
    messages: [
      {
        from: "user",
        message: "Não estou conseguindo configurar minha conta bancária para receber os pagamentos. O sistema mostra um erro quando tento salvar.",
        date: "01/07/2023 10:22"
      },
      {
        from: "support",
        message: "Olá! Para configurar sua conta bancária, certifique-se de incluir o dígito verificador no número da conta. Caso o erro persista, por favor, envie um print do erro para que possamos analisar melhor.",
        date: "01/07/2023 11:45",
        agent: "Maria Suporte"
      }
    ]
  },
  {
    id: "T-1198",
    subject: "Erro ao registrar venda",
    category: "system",
    priority: "high",
    status: "pending",
    created: "28/06/2023 15:30",
    lastUpdate: "28/06/2023 15:30",
    messages: [
      {
        from: "user",
        message: "Estou tentando registrar uma venda para o cliente João Silva, mas o sistema está mostrando um erro de 'Cliente não encontrado', mesmo eu conseguindo visualizar o cliente na lista.",
        date: "28/06/2023 15:30"
      }
    ]
  },
  {
    id: "T-1002",
    subject: "Solicitação de novas funcionalidades",
    category: "suggestion",
    priority: "low",
    status: "closed",
    created: "15/06/2023 09:18",
    lastUpdate: "18/06/2023 14:05",
    messages: [
      {
        from: "user",
        message: "Gostaria de sugerir a inclusão de uma funcionalidade para enviar mensagens diretas para os clientes através do aplicativo, facilitando a comunicação sobre promoções e ofertas.",
        date: "15/06/2023 09:18"
      },
      {
        from: "support",
        message: "Agradecemos sua sugestão! Ela foi registrada em nosso sistema e será analisada por nossa equipe de produto. Estamos sempre buscando melhorar a plataforma com base no feedback dos nossos parceiros.",
        date: "15/06/2023 11:23",
        agent: "Carlos Suporte"
      },
      {
        from: "user",
        message: "Obrigado pelo retorno! Estou ansioso para ver novas funcionalidades no futuro.",
        date: "15/06/2023 13:45"
      },
      {
        from: "support",
        message: "Ficamos felizes com seu entusiasmo! Encerramos este ticket, mas sinta-se à vontade para abrir um novo caso tenha outras sugestões ou dúvidas.",
        date: "18/06/2023 14:05",
        agent: "Carlos Suporte"
      }
    ]
  }
];

// Componente de Mensagem para exibir mensagens na conversa
interface MessageProps {
  message: {
    from: "user" | "support";
    message: string;
    date: string;
    agent?: string;
  };
}

function Message({ message }: MessageProps) {
  const isFromUser = message.from === "user";
  
  return (
    <div className={`flex ${isFromUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-3/4 ${isFromUser ? "bg-primary text-white" : "bg-muted"} rounded-lg p-3`}>
        <div className="flex items-center mb-1">
          {!isFromUser && (
            <Avatar className="h-6 w-6 mr-2">
              <AvatarFallback className="bg-secondary text-white text-xs">
                {message.agent?.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          )}
          <span className={`text-xs ${isFromUser ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            {isFromUser ? "Você" : message.agent} • {message.date}
          </span>
        </div>
        <p className="text-sm whitespace-pre-line">{message.message}</p>
      </div>
    </div>
  );
}

// Status do ticket
interface TicketStatusProps {
  status: "pending" | "answered" | "closed";
}

function TicketStatus({ status }: TicketStatusProps) {
  switch (status) {
    case "pending":
      return (
        <div className="flex items-center text-yellow-600">
          <Clock className="h-4 w-4 mr-1" />
          <span>Aguardando resposta</span>
        </div>
      );
    case "answered":
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          <span>Respondido</span>
        </div>
      );
    case "closed":
      return (
        <div className="flex items-center text-gray-600">
          <XCircle className="h-4 w-4 mr-1" />
          <span>Encerrado</span>
        </div>
      );
    default:
      return null;
  }
}

export default function MerchantSupport() {
  const [activeTab, setActiveTab] = useState("contact");
  const [selectedTicket, setSelectedTicket] = useState<typeof supportTickets[0] | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const { toast } = useToast();
  
  // Formulário de contato
  const contactForm = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      subject: "",
      category: "",
      priority: "medium",
      message: "",
    },
  });
  
  // Mutation para enviar o formulário de contato
  const sendContactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof contactFormSchema>) => {
      // Simular envio para a API
      return new Promise((resolve) => setTimeout(resolve, 1500));
    },
    onSuccess: () => {
      toast({
        title: "Mensagem enviada com sucesso",
        description: "Nossa equipe responderá o mais breve possível.",
      });
      contactForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Ocorreu um erro ao enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation para enviar resposta a um ticket
  const sendReplyMutation = useMutation({
    mutationFn: async (data: { ticketId: string; message: string }) => {
      // Simular envio para a API
      return new Promise((resolve) => setTimeout(resolve, 1500));
    },
    onSuccess: () => {
      toast({
        title: "Resposta enviada com sucesso",
        description: "Sua resposta foi adicionada ao ticket.",
      });
      setReplyMessage("");
      
      // Simular atualização do ticket
      if (selectedTicket) {
        const now = new Date().toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        
        setSelectedTicket({
          ...selectedTicket,
          lastUpdate: now,
          messages: [
            ...selectedTicket.messages,
            {
              from: "user",
              message: replyMessage,
              date: now,
            }
          ],
          status: "pending",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro ao enviar resposta",
        description: "Ocorreu um erro ao enviar sua resposta. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Enviar formulário de contato
  const onContactSubmit = (data: z.infer<typeof contactFormSchema>) => {
    sendContactMutation.mutate(data);
  };
  
  // Enviar resposta a um ticket
  const handleSendReply = () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    
    if (selectedTicket.status === "closed") {
      toast({
        title: "Ticket encerrado",
        description: "Este ticket está encerrado. Por favor, abra um novo ticket para continuar a conversa.",
        variant: "destructive",
      });
      return;
    }
    
    sendReplyMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyMessage,
    });
  };
  
  return (
    <DashboardLayout title="Central de Suporte" type="merchant">
      <Tabs defaultValue="contact" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="contact">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contato
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <FileText className="h-4 w-4 mr-2" />
            Meus Tickets
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="h-4 w-4 mr-2" />
            Perguntas Frequentes
          </TabsTrigger>
        </TabsList>
        
        {/* Aba de Contato */}
        <TabsContent value="contact">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Enviar Mensagem</CardTitle>
                  <CardDescription>
                    Preencha o formulário abaixo para entrar em contato com nosso suporte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...contactForm}>
                    <form id="contact-form" onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
                      <FormField
                        control={contactForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assunto</FormLabel>
                            <FormControl>
                              <Input placeholder="Descreva brevemente o assunto" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={contactForm.control}
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
                                  <SelectItem value="payment">Pagamentos</SelectItem>
                                  <SelectItem value="cashback">Cashback</SelectItem>
                                  <SelectItem value="account">Conta</SelectItem>
                                  <SelectItem value="system">Sistema</SelectItem>
                                  <SelectItem value="suggestion">Sugestão</SelectItem>
                                  <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={contactForm.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prioridade</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a prioridade" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Baixa</SelectItem>
                                  <SelectItem value="medium">Média</SelectItem>
                                  <SelectItem value="high">Alta</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={contactForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mensagem</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descreva detalhadamente sua dúvida ou problema"
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={contactForm.control}
                        name="attachment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Anexo (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    field.onChange(e.target.files[0]);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Tamanho máximo: 5MB. Formatos aceitos: JPG, PNG, PDF.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    form="contact-form"
                    disabled={sendContactMutation.isPending}
                    className="ml-auto"
                  >
                    {sendContactMutation.isPending ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <PhoneCall className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Telefone</h4>
                      <p className="text-sm text-muted-foreground">(11) 3456-7890</p>
                      <p className="text-sm text-muted-foreground">Segunda a Sexta, 9h às 18h</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Email</h4>
                      <p className="text-sm text-muted-foreground">suporte@valecashback.com</p>
                      <p className="text-sm text-muted-foreground">Resposta em até 24h</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center mb-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      <h4 className="font-medium">Suporte Prioritário</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Problemas urgentes ou críticos que afetem as operações da sua loja?
                    </p>
                    <Button variant="outline" className="w-full">
                      (11) 3456-7899
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Aba de Tickets */}
        <TabsContent value="tickets">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Tickets</CardTitle>
                  <CardDescription>Seus tickets de suporte recentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {supportTickets.map((ticket) => (
                      <Button
                        key={ticket.id}
                        variant="outline"
                        className={`w-full justify-start p-3 h-auto ${
                          selectedTicket?.id === ticket.id ? "border-primary" : ""
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex flex-col items-start text-left w-full">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold">{ticket.subject}</span>
                            <span className="text-xs bg-muted rounded px-2 py-0.5">
                              {ticket.id}
                            </span>
                          </div>
                          <div className="flex items-center justify-between w-full mt-1">
                            <span className="text-xs text-muted-foreground">
                              {ticket.created}
                            </span>
                            <div className="text-xs">
                              {ticket.status === "pending" && (
                                <span className="text-yellow-600">Pendente</span>
                              )}
                              {ticket.status === "answered" && (
                                <span className="text-green-600">Respondido</span>
                              )}
                              {ticket.status === "closed" && (
                                <span className="text-gray-600">Encerrado</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                    
                    {supportTickets.length === 0 && (
                      <div className="text-center py-8">
                        <FileQuestion className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <h4 className="text-muted-foreground font-medium">Nenhum ticket encontrado</h4>
                        <p className="text-sm text-muted-foreground">
                          Seus tickets de suporte aparecerão aqui.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab("contact")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Novo Ticket
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              {selectedTicket ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedTicket.subject}</CardTitle>
                        <CardDescription>
                          Ticket #{selectedTicket.id} • Criado em {selectedTicket.created}
                        </CardDescription>
                      </div>
                      <TicketStatus status={selectedTicket.status as any} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Categoria:</span>{" "}
                          <span className="font-medium">
                            {
                              {
                                "payment": "Pagamentos",
                                "cashback": "Cashback",
                                "account": "Conta",
                                "system": "Sistema",
                                "suggestion": "Sugestão",
                                "other": "Outro"
                              }[selectedTicket.category] || selectedTicket.category
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prioridade:</span>{" "}
                          <span className="font-medium">
                            {
                              {
                                "low": "Baixa",
                                "medium": "Média",
                                "high": "Alta"
                              }[selectedTicket.priority] || selectedTicket.priority
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-3">Conversa</h4>
                        
                        <div className="max-h-[400px] overflow-y-auto p-2">
                          {selectedTicket.messages.map((message, index) => (
                            <Message key={index} message={message} />
                          ))}
                        </div>
                      </div>
                      
                      {selectedTicket.status !== "closed" && (
                        <div>
                          <div className="flex items-center">
                            <Textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Escreva sua resposta..."
                              className="min-h-[100px] resize-none"
                            />
                          </div>
                          <div className="flex justify-end mt-2">
                            <Button
                              onClick={handleSendReply}
                              disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                            >
                              {sendReplyMutation.isPending ? (
                                "Enviando..."
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="font-medium text-xl mb-1">Nenhum ticket selecionado</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      Selecione um ticket da lista à esquerda para visualizar os detalhes ou crie um novo ticket.
                    </p>
                    <Button onClick={() => setActiveTab("contact")}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Criar Novo Ticket
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Aba de Perguntas Frequentes */}
        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Perguntas Frequentes</CardTitle>
              <CardDescription>
                Respostas para as dúvidas mais comuns dos lojistas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {merchantFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center">
                        <Info className="h-4 w-4 mr-2 text-primary" />
                        {faq.question}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              <div className="mt-6 border-t pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Não encontrou o que estava procurando? Entre em contato com nosso suporte.
                  </p>
                  <Button onClick={() => setActiveTab("contact")}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contatar Suporte
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}