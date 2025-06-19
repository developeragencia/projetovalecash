import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  MessageSquare, 
  Users, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Interface para os tickets de suporte
interface SupportTicket {
  id: number;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    type: string;
  };
  messages: {
    id: number;
    content: string;
    sender: string;
    createdAt: string;
  }[];
}

export default function AdminSupport() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  
  const { toast } = useToast();

  // Consulta para buscar os tickets de suporte
  const { data, isLoading } = useQuery<{
    tickets: SupportTicket[];
    stats: {
      open: number;
      pending: number;
      resolved: number;
      closed: number;
      total: number;
    };
  }>({
    queryKey: ['/api/admin/support', { status: activeTab !== "all" ? activeTab : undefined, search: searchTerm }],
    placeholderData: {
      tickets: [
        {
          id: 1,
          subject: "Problema com pagamento",
          status: "open",
          priority: "high",
          createdAt: "2025-05-16T10:30:00Z",
          user: {
            id: 2,
            name: "Cliente Teste",
            email: "cliente@valecashback.com",
            type: "client"
          },
          messages: [
            {
              id: 1,
              content: "Estou tendo problemas para finalizar o pagamento na loja X. Quando tento pagar com o app, aparece um erro de conexão.",
              sender: "Cliente Teste",
              createdAt: "2025-05-16T10:30:00Z"
            }
          ]
        },
        {
          id: 2,
          subject: "Dúvida sobre cashback",
          status: "pending",
          priority: "medium",
          createdAt: "2025-05-15T14:45:00Z",
          user: {
            id: 3,
            name: "João Silva",
            email: "joao@example.com",
            type: "client"
          },
          messages: [
            {
              id: 2,
              content: "Não entendi como funciona o cálculo do cashback quando faço compras em lojas parceiras.",
              sender: "João Silva",
              createdAt: "2025-05-15T14:45:00Z"
            },
            {
              id: 3,
              content: "O cashback é calculado com base no valor total da compra, aplicando a porcentagem definida para cada loja. Você pode ver essa porcentagem na página da loja.",
              sender: "Suporte Vale Cashback",
              createdAt: "2025-05-15T15:30:00Z"
            },
            {
              id: 4,
              content: "Entendi, mas ainda não consegui ver onde aparece o cashback acumulado no meu perfil.",
              sender: "João Silva",
              createdAt: "2025-05-15T16:15:00Z"
            }
          ]
        },
        {
          id: 3,
          subject: "Dificuldade para cadastrar loja",
          status: "resolved",
          priority: "medium",
          createdAt: "2025-05-14T09:20:00Z",
          user: {
            id: 4,
            name: "Maria Lojista",
            email: "maria@loja.com",
            type: "merchant"
          },
          messages: [
            {
              id: 5,
              content: "Estou tentando cadastrar minha loja no sistema, mas após preencher o formulário recebo um erro.",
              sender: "Maria Lojista",
              createdAt: "2025-05-14T09:20:00Z"
            },
            {
              id: 6,
              content: "Qual é a mensagem de erro que você está recebendo? Pode enviar um print da tela?",
              sender: "Suporte Vale Cashback",
              createdAt: "2025-05-14T10:05:00Z"
            },
            {
              id: 7,
              content: "Aparece 'Erro ao validar CNPJ'. Mas tenho certeza que o CNPJ está correto.",
              sender: "Maria Lojista",
              createdAt: "2025-05-14T10:30:00Z"
            },
            {
              id: 8,
              content: "Identificamos um problema temporário na validação de CNPJ. Já foi corrigido. Por favor, tente novamente.",
              sender: "Suporte Vale Cashback",
              createdAt: "2025-05-14T11:45:00Z"
            },
            {
              id: 9,
              content: "Funcionou! Consegui cadastrar a loja. Muito obrigada pela ajuda.",
              sender: "Maria Lojista",
              createdAt: "2025-05-14T12:15:00Z"
            }
          ]
        },
        {
          id: 4,
          subject: "Problema com código QR",
          status: "closed",
          priority: "low",
          createdAt: "2025-05-12T16:30:00Z",
          user: {
            id: 5,
            name: "Pedro Cliente",
            email: "pedro@example.com",
            type: "client"
          },
          messages: [
            {
              id: 10,
              content: "Não consigo escanear o código QR em algumas lojas.",
              sender: "Pedro Cliente",
              createdAt: "2025-05-12T16:30:00Z"
            },
            {
              id: 11,
              content: "Em quais lojas você está tendo esse problema? O código QR aparece borrado ou há outra dificuldade?",
              sender: "Suporte Vale Cashback",
              createdAt: "2025-05-12T17:10:00Z"
            },
            {
              id: 12,
              content: "Na verdade acho que era um problema com a câmera do meu celular. Limpei a lente e agora está funcionando.",
              sender: "Pedro Cliente",
              createdAt: "2025-05-13T09:25:00Z"
            }
          ]
        }
      ],
      stats: {
        open: 1,
        pending: 1,
        resolved: 1,
        closed: 1,
        total: 4
      }
    }
  });

  // Filtrar tickets com base na aba ativa e termo de pesquisa
  const filteredTickets = data?.tickets.filter(ticket => {
    // Filtrar por status se não estiver na aba "all"
    if (activeTab !== "all" && ticket.status !== activeTab) {
      return false;
    }
    
    // Filtrar por termo de pesquisa
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      return (
        ticket.subject.toLowerCase().includes(term) ||
        ticket.user.name.toLowerCase().includes(term) ||
        ticket.user.email.toLowerCase().includes(term)
      );
    }
    
    return true;
  }) || [];

  // Função para enviar resposta a um ticket
  const handleSendReply = () => {
    if (!selectedTicket || replyText.trim() === "") return;
    
    // Em uma implementação real, aqui enviaríamos a resposta para a API
    toast({
      title: "Resposta enviada",
      description: "Sua resposta foi enviada com sucesso.",
    });
    
    // Simulando a adição da resposta localmente
    const updatedTicket = {
      ...selectedTicket,
      messages: [
        ...selectedTicket.messages,
        {
          id: Math.max(...selectedTicket.messages.map(m => m.id)) + 1,
          content: replyText,
          sender: "Suporte Vale Cashback",
          createdAt: new Date().toISOString()
        }
      ]
    };
    
    setSelectedTicket(updatedTicket);
    setReplyText("");
  };

  // Função para atualizar o status de um ticket
  const handleStatusChange = (status: string) => {
    if (!selectedTicket) return;
    
    // Em uma implementação real, aqui atualizaríamos o status na API
    toast({
      title: "Status atualizado",
      description: `O ticket foi marcado como ${status}.`,
    });
    
    // Simulando a atualização do status localmente
    setSelectedTicket({
      ...selectedTicket,
      status: status as "open" | "pending" | "resolved" | "closed"
    });
  };

  // Obter o ícone e a cor para o status do ticket
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Aberto</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Resolvido</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Fechado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  // Obter o ícone e a cor para a prioridade do ticket
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case "medium":
        return <Badge className="bg-orange-100 text-orange-800">Média</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">Baixa</Badge>;
      default:
        return <Badge>Desconhecida</Badge>;
    }
  };

  // Formatar data de forma segura
  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não informada";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Data inválida";
      return format(date, "dd/MM/yyyy HH:mm");
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

  return (
    <DashboardLayout title="Suporte" type="admin">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Central de Suporte</h1>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tickets..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tickets Abertos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.open || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tickets Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.pending || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tickets Resolvidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.resolved || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total de Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.total || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Tickets de Suporte</CardTitle>
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="open">Abertos</TabsTrigger>
                    <TabsTrigger value="pending">Pendentes</TabsTrigger>
                    <TabsTrigger value="resolved">Resolvidos</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="p-4 text-center">Carregando tickets...</div>
                ) : filteredTickets.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhum ticket encontrado.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                    {filteredTickets.map((ticket) => (
                      <Button
                        key={ticket.id}
                        variant="outline"
                        className={`w-full justify-start text-left p-3 h-auto ${
                          selectedTicket?.id === ticket.id ? "border-primary border-2" : ""
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between w-full">
                            <span className="font-medium truncate" style={{ maxWidth: "70%" }}>
                              {ticket.subject}
                            </span>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground w-full mt-1">
                            <span>{ticket.user.name}</span>
                            <span>{formatDate(ticket.createdAt).split(" ")[0]}</span>
                          </div>
                          <div className="flex justify-between text-xs w-full mt-1">
                            <span className="text-muted-foreground">
                              {ticket.messages.length} mensagens
                            </span>
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedTicket ? (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>{selectedTicket.subject}</CardTitle>
                      <CardDescription className="mt-1">
                        De {selectedTicket.user.name} ({selectedTicket.user.email}) - {formatDate(selectedTicket.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4 max-h-[400px] overflow-y-auto space-y-4">
                    {selectedTicket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.sender === "Suporte Vale Cashback"
                            ? "bg-primary/10 ml-4"
                            : "bg-muted mr-4"
                        }`}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{message.sender}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-4 border-t">
                  <div className="w-full flex justify-between">
                    <div className="flex items-center space-x-2">
                      <Select
                        value={selectedTicket.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Alterar status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Aberto</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                          <SelectItem value="closed">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedTicket.priority}
                        onValueChange={(value) => {
                          if (!selectedTicket) return;
                          toast({
                            title: "Prioridade atualizada",
                            description: `Prioridade do ticket alterada para ${
                              value === 'low' ? 'baixa' : 
                              value === 'medium' ? 'média' : 'alta'
                            }.`,
                          });
                          setSelectedTicket({
                            ...selectedTicket,
                            priority: value as "low" | "medium" | "high"
                          });
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Alterar prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Ticket atribuído",
                          description: "Ticket atribuído a você com sucesso.",
                        });
                      }}
                    >
                      Atribuir a mim
                    </Button>
                  </div>
                  <div className="w-full">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      className="min-h-[100px]"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <Button 
                        onClick={handleSendReply} 
                        disabled={replyText.trim() === ""}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Resposta
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <Card className="h-full flex flex-col justify-center items-center p-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum ticket selecionado</h3>
                <p className="text-center text-muted-foreground">
                  Selecione um ticket da lista para visualizar os detalhes e responder.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}