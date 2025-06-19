import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QRCodeDisplay } from "@/components/ui/qr-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Copy, Store, UserPlus, DollarSign, Share2, RefreshCw, BarChart4, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useAuth } from "@/hooks/use-auth";
import { SystemInfo } from "@/components/ui/system-info";
import { BarChartComponent } from "@/components/ui/charts";

export default function MerchantReferrals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Query para buscar informações sobre indicações do lojista
  const { data: referralsData, isLoading: isReferralsLoading } = useQuery({
    queryKey: ['/api/merchant/referrals'],
    select: (data) => {
      if (data && data.referrals && Array.isArray(data.referrals)) {
        // Remover duplicatas baseado no ID do usuário referido (referred_id)
        // usando um Map para garantir que cada usuário apareça apenas uma vez
        const uniqueReferralsMap = new Map();
        data.referrals.forEach(ref => {
          if (!uniqueReferralsMap.has(ref.id)) {
            uniqueReferralsMap.set(ref.id, ref);
          }
        });
        
        // Converter o Map de volta para array
        const uniqueReferrals = Array.from(uniqueReferralsMap.values());
        
        // Retornar os dados com as referências deduplificadas
        return {
          ...data,
          referrals: uniqueReferrals
        };
      }
      return data;
    },
    placeholderData: {
      referralCode: user?.invitation_code || "LJ123",
      referralUrl: `https://valecashback.com/parceiro/${user?.invitation_code || "LJ123"}`,
      referralsCount: 0,
      approvedStores: 0,
      pendingStores: 0,
      totalEarned: "0.00",
      commission: "1.0", // Taxa de comissão - será substituída pelos dados do banco
      monthlyEarnings: [
        { month: "Jan", value: 0 },
        { month: "Fev", value: 0 },
        { month: "Mar", value: 0 },
        { month: "Abr", value: 0 },
        { month: "Mai", value: 0 },
        { month: "Jun", value: 0 },
        { month: "Jul", value: 120 },
        { month: "Ago", value: 0 },
        { month: "Set", value: 0 },
        { month: "Out", value: 0 },
        { month: "Nov", value: 0 },
        { month: "Dez", value: 0 }
      ],
      referrals: []
    }
  });
  
  // Query para buscar informações sobre as taxas do sistema
  const { data: ratesSettings } = useQuery({
    queryKey: ['/api/admin/settings/rates'],
  });
  
  // Função para copiar o link de indicação
  const copyReferralLink = async () => {
    try {
      // Use a API de clipboard mais recente que funciona melhor em navegadores modernos
      if (referralsData?.referralUrl) {
        // Adiciona texto temporário à página para contornar problemas de permissão
        const textArea = document.createElement('textarea');
        textArea.value = referralsData.referralUrl;
        textArea.style.position = 'fixed';  // Fora da tela
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // Tenta o método moderno e depois o método de fallback
        try {
          await navigator.clipboard.writeText(referralsData.referralUrl);
        } catch (err) {
          // Fallback para o método de execCommand que funciona em mais navegadores
          document.execCommand('copy');
        }
        
        // Remove o elemento temporário
        document.body.removeChild(textArea);
        
        toast({
          title: "Link copiado!",
          description: "O link de indicação foi copiado para a área de transferência.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente ou copie manualmente.",
        variant: "destructive",
      });
    }
  };
  
  // Função para compartilhar no WhatsApp
  const shareOnWhatsApp = () => {
    const text = `Olá! Seja um parceiro do Vale Cashback. Use meu código de indicação ${referralsData?.referralCode} para se cadastrar: ${referralsData?.referralUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  // Mutation para enviar convite por email
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; storeName: string }) => {
      const res = await apiRequest("POST", "/api/merchant/referrals/invite", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Convite enviado!",
        description: "O convite foi enviado com sucesso para o lojista informado.",
        variant: "default",
      });
      setEmail("");
      setName("");
      setStoreName("");
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/referrals'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Ocorreu um erro ao enviar o convite. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Estado para o formulário de convite
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  
  // Função para enviar convite
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !storeName) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    inviteMutation.mutate({ email, name, storeName });
  };
  
  // Colunas para a tabela de indicados
  const referralsColumns = [
    { header: "Nome", accessorKey: "name" },
    { 
      header: "Tipo", 
      accessorKey: "user_type",
      cell: (row: any) => (
        <div className="flex items-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.user_type === "merchant" 
              ? "bg-blue-100 text-blue-800" 
              : "bg-purple-100 text-purple-800"
          }`}>
            {row.user_type === "merchant" ? "Lojista" : "Cliente"}
          </span>
        </div>
      )
    },
    { 
      header: "Contato", 
      accessorKey: "email",
      cell: (row: any) => (
        <div className="flex flex-col text-xs">
          <span>{row.email || "Email não informado"}</span>
          <span className="text-muted-foreground">{row.phone || "Telefone não informado"}</span>
        </div>
      )
    },
    { 
      header: "Estabelecimento", 
      accessorKey: "store_name",
      cell: (row: any) => (
        <div className="flex items-center">
          {row.user_type === "merchant" ? (
            <span>{row.store_name || "Loja sem nome"}</span>
          ) : (
            <span className="text-muted-foreground text-xs">N/A</span>
          )}
        </div>
      )
    },
    { header: "Data", accessorKey: "date" },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (row: any) => (
        <div className="flex items-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === "active" 
              ? "bg-green-100 text-green-800" 
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {row.status === "active" ? "Ativo" : "Pendente"}
          </span>
        </div>
      )
    },
    { 
      header: "Comissão", 
      accessorKey: "commission",
      cell: (row: any) => (
        <div className="flex items-center">
          <span className="font-medium">R$ {row.commission}</span>
        </div>
      )
    },
  ];
  
  return (
    <DashboardLayout title="Programa de Indicação para Parceiros" type="merchant">
      <div className="flex flex-col space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <Store className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="invite">
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Lojistas
            </TabsTrigger>
            <TabsTrigger value="earnings">
              <BarChart4 className="h-4 w-4 mr-2" />
              Ganhos
            </TabsTrigger>
            <TabsTrigger value="list">
              <Users className="h-4 w-4 mr-2" />
              Parceiros Indicados
            </TabsTrigger>
          </TabsList>
          
          {/* Aba de Visão Geral */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Seu Código de Indicação</CardTitle>
                  <CardDescription>
                    Indique novos lojistas e ganhe comissões por cada venda realizada
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-4xl font-bold border-2 border-primary px-8 py-4 rounded-lg text-primary">
                      {referralsData?.referralCode || "..."}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={copyReferralLink}
                        className="flex items-center"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={shareOnWhatsApp}
                        className="flex items-center text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <WhatsAppIcon className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Taxa de comissão: <span className="font-medium">1%</span> por indicação
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Aumente sua rede de parceiros indicando outros lojistas para o Vale Cashback. Você ganhará uma comissão de 1% sobre as vendas dos lojistas indicados.
                  </p>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                  <CardDescription>
                    Acompanhe seus parceiros e ganhos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <span className="text-3xl font-bold">{referralsData?.referralsCount || 0}</span>
                      <span className="text-sm text-muted-foreground">Total de Parceiros</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <span className="text-3xl font-bold">{referralsData?.approvedStores || 0}</span>
                      <span className="text-sm text-muted-foreground">Parceiros Ativos</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-primary/10 rounded-lg col-span-2">
                      <span className="text-3xl font-bold text-primary">R$ {referralsData?.totalEarned || "0,00"}</span>
                      <span className="text-sm text-muted-foreground">Total Ganho</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Alert variant="default" className="w-full">
                    <Store className="h-4 w-4" />
                    <AlertTitle>Comissão recorrente</AlertTitle>
                    <AlertDescription>
                      Você recebe comissão sobre todas as vendas que seus parceiros indicados realizarem!
                    </AlertDescription>
                  </Alert>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Aba de Convidar Lojistas */}
          <TabsContent value="invite">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Convidar Parceiro</CardTitle>
                  <CardDescription>
                    Envie um convite diretamente para novos lojistas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Responsável</Label>
                      <Input 
                        id="name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Digite o nome do responsável" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Nome da Loja</Label>
                      <Input 
                        id="storeName" 
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Digite o nome da loja" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="Digite o e-mail para contato" 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={inviteMutation.isPending}
                    >
                      {inviteMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Enviar Convite
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Compartilhar Convite</CardTitle>
                  <CardDescription>
                    Compartilhe seu link de indicação com outros lojistas
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="py-4">
                    <QRCodeDisplay 
                      value={referralsData?.referralUrl || ""}
                      title="Escaneie para se cadastrar"
                      description="Aponte a câmera do celular para o QR Code"
                      downloadable
                      shareable
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button 
                      onClick={copyReferralLink}
                      className="flex items-center"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={shareOnWhatsApp}
                      className="flex items-center text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <WhatsAppIcon className="h-4 w-4 mr-2" />
                      Compartilhar no WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Outras Redes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Aba de Ganhos */}
          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>Ganhos Mensais</CardTitle>
                <CardDescription>
                  Acompanhe suas comissões de indicação ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {isReferralsLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <BarChartComponent
                      title="Comissões de Indicação (R$)"
                      data={referralsData?.monthlyEarnings || []}
                      bars={[
                        { dataKey: "value", name: "Valor (R$)", fill: "#0ea5e9" }
                      ]}
                      xAxisDataKey="month"
                      grid
                      height={350}
                    />
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Total ganho com indicações: <span className="font-semibold">R$ {referralsData?.totalEarned || "0,00"}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("list")} 
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Aba de Parceiros Indicados */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Parceiros</CardTitle>
                <CardDescription>
                  Detalhes de todos os lojistas indicados por você
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isReferralsLoading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : referralsData?.referrals?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <Store className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum parceiro indicado</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      Indique outros lojistas para o Vale Cashback e ganhe comissões sobre as vendas deles!
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab("invite")}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Convidar Parceiros
                    </Button>
                  </div>
                ) : (
                  <DataTable 
                    data={referralsData?.referrals || []}
                    columns={referralsColumns}
                    searchable
                    onSearch={() => {}}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <SystemInfo className="mt-6" />
      </div>
    </DashboardLayout>
  );
}