import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeDisplay } from "@/components/ui/qr-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { 
  Copy, 
  UserPlus, 
  Users, 
  Gift,
  Share2, 
  RefreshCw, 
  Award, 
  DollarSign,
  Mail,
  Phone,
  Store,
  Calendar,
  TrendingUp,
  Eye,
  CheckCircle2,
  Clock,
  Star,
  QrCode,
  Link,
  Send,
  Loader2,
  AlertCircle,
  ExternalLink,
  Target,
  Sparkles
} from "lucide-react";

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  referralsCount: number;
  totalEarned: string;
  commission: string;
  monthlyEarnings: Array<{ month: string; value: number }>;
  referrals: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    user_type: string;
    store_name?: string;
    date: string;
    status: string;
    commission: string;
  }>;
}

export default function ClientReferrals() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { toast } = useToast();

  // Buscar dados de indicações com tratamento de erro
  const { data: referralsData, isLoading, refetch, error } = useQuery({
    queryKey: ['/api/client/referrals'],
    retry: 2,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Buscar configurações de taxa
  const { data: ratesSettings } = useQuery({
    queryKey: ['/api/admin/settings/rates'],
    retry: 1
  });

  // Mutation para enviar convite
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      const response = await apiRequest("POST", "/api/client/referrals/invite", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Convite Enviado",
        description: "O convite foi enviado com sucesso!",
      });
      setEmail("");
      setName("");
      setShowInviteDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/client/referrals'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao enviar convite. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Garantir que temos dados válidos
  const data = referralsData as ReferralData | undefined;

  // Função para copiar link com fallback
  const copyReferralLink = async () => {
    try {
      const urlToCopy = data?.referralUrl || "";
      if (!urlToCopy) {
        toast({
          title: "Erro",
          description: "Link de indicação não disponível.",
          variant: "destructive",
        });
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(urlToCopy);
      } else {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = urlToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      toast({
        title: "Link Copiado",
        description: "O link de indicação foi copiado para a área de transferência!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar link.",
        variant: "destructive",
      });
    }
  };

  // Função para compartilhar no WhatsApp
  const shareOnWhatsApp = () => {
    const code = data?.referralCode || "";
    const url = data?.referralUrl || "";
    
    if (!code || !url) {
      toast({
        title: "Erro",
        description: "Dados de indicação não disponíveis.",
        variant: "destructive",
      });
      return;
    }
    
    const text = `Venha ganhar cashback comigo no Vale Cashback! Use meu código ${code} e comece a economizar. ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Função para enviar convite
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    inviteMutation.mutate({ email, name });
  };

  // Função para abrir detalhes
  const openReferralDetails = (referral: any) => {
    setSelectedReferral(referral);
    setShowDetailsDialog(true);
  };

  // Estado de carregamento
  if (isLoading) {
    return (
      <DashboardLayout title="Minhas Indicações" type="client">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <span className="ml-4 text-xl text-gray-600">Carregando suas indicações...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <DashboardLayout title="Minhas Indicações" type="client">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-800 mb-2">Erro ao Carregar Dados</h3>
              <p className="text-red-600 mb-4">Não foi possível carregar suas indicações.</p>
              <Button onClick={() => refetch()} variant="outline" className="border-red-300 text-red-700">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Minhas Indicações" type="client">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        {/* Header com animação */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Programa de Indicações
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ganhe 1% de comissão vitalícia por cada pessoa que você indicar para o Vale Cashback
          </p>
        </motion.div>

        {/* Navegação por abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="share" className="flex items-center space-x-2">
              <Share2 className="h-4 w-4" />
              <span>Compartilhar</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Meus Indicados</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba Visão Geral */}
          <TabsContent value="overview">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Total de Indicados</p>
                          <p className="text-3xl font-bold">{data?.referralsCount || 0}</p>
                          <p className="text-blue-200 text-xs mt-1">pessoas convidadas</p>
                        </div>
                        <Users className="h-10 w-10 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">Total Ganho</p>
                          <p className="text-3xl font-bold">${data?.totalEarned || "0.00"}</p>
                          <p className="text-green-200 text-xs mt-1">em comissões</p>
                        </div>
                        <DollarSign className="h-10 w-10 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">Taxa de Comissão</p>
                          <p className="text-3xl font-bold">1%</p>
                          <p className="text-purple-200 text-xs mt-1">vitalícia</p>
                        </div>
                        <Award className="h-10 w-10 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm font-medium">Indicações Ativas</p>
                          <p className="text-3xl font-bold">{data?.referrals?.filter(r => r.status === 'active').length || 0}</p>
                          <p className="text-orange-200 text-xs mt-1">gerando comissão</p>
                        </div>
                        <CheckCircle2 className="h-10 w-10 text-orange-200" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Como Funciona */}
              <Card className="shadow-xl mb-8 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <CardTitle className="flex items-center text-2xl text-indigo-800">
                    <Target className="mr-3 h-6 w-6" />
                    Como Funciona o Programa
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-3 gap-8">
                    <motion.div 
                      className="text-center"
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Share2 className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Compartilhe</h3>
                      <p className="text-gray-600">
                        Envie seu código ou link de indicação para amigos, familiares e conhecidos
                      </p>
                    </motion.div>

                    <motion.div 
                      className="text-center"
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Eles se Cadastram</h3>
                      <p className="text-gray-600">
                        Quando alguém usar seu código, você ganha uma nova indicação
                      </p>
                    </motion.div>

                    <motion.div 
                      className="text-center"
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Você Ganha</h3>
                      <p className="text-gray-600">
                        Receba 1% de comissão vitalícia sobre todas as transações da pessoa indicada
                      </p>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Aba Compartilhar */}
          <TabsContent value="share">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Código de Indicação */}
              <div className="lg:col-span-2">
                <Card className="shadow-xl h-full">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <CardTitle className="flex items-center text-2xl text-blue-800">
                      <Gift className="mr-3 h-6 w-6" />
                      Seu Código de Indicação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <motion.div 
                        className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 p-8 rounded-2xl border-2 border-blue-200 shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-5xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text tracking-wider">
                          {data?.referralCode || "CARREGANDO..."}
                        </p>
                      </motion.div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Link de Indicação
                        </Label>
                        <div className="flex space-x-3">
                          <Input 
                            value={data?.referralUrl || ""} 
                            readOnly 
                            className="flex-1 bg-gray-50 border-gray-200"
                          />
                          <Button 
                            variant="outline"
                            onClick={copyReferralLink}
                            className="px-4"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button 
                          onClick={shareOnWhatsApp}
                          className="bg-green-600 hover:bg-green-700 text-white py-3"
                        >
                          <Share2 className="mr-2 h-5 w-5" />
                          WhatsApp
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setShowInviteDialog(true)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 py-3"
                        >
                          <Mail className="mr-2 h-5 w-5" />
                          Por Email
                        </Button>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 leading-relaxed">
                          <strong>Dica:</strong> Compartilhe em redes sociais, grupos de WhatsApp, 
                          ou envie diretamente para pessoas que você acha que se interessariam 
                          pelo Vale Cashback.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* QR Code */}
              <div>
                <Card className="shadow-xl h-full">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                    <CardTitle className="flex items-center text-purple-800">
                      <QrCode className="mr-2 h-5 w-5" />
                      QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 text-center">
                    <div className="bg-white p-4 rounded-xl shadow-inner mb-4 inline-block">
                      <QRCodeDisplay 
                        value={data?.referralUrl || ""} 
                        size={180}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Deixe outras pessoas escanearem este QR code para acessar seu link de indicação
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Aba Meus Indicados */}
          <TabsContent value="referrals">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-2xl">
                      <Users className="mr-3 h-6 w-6 text-blue-600" />
                      Suas Indicações ({data?.referrals?.length || 0})
                    </CardTitle>
                    <Button variant="outline" onClick={() => refetch()}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Atualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!data?.referrals || data.referrals.length === 0 ? (
                    <div className="text-center py-16">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Users className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                        <h3 className="text-2xl font-semibold text-gray-600 mb-4">Nenhuma indicação ainda</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Comece a indicar amigos e familiares para ganhar comissões vitalícias!
                        </p>
                        <Button 
                          onClick={() => setActiveTab("share")}
                          size="lg"
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                          <UserPlus className="mr-2 h-5 w-5" />
                          Fazer Primeira Indicação
                        </Button>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.referrals.map((referral, index) => (
                        <motion.div
                          key={referral.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                              {/* Nome e Tipo */}
                              <div>
                                <div className="flex items-center space-x-3 mb-2">
                                  <p className="font-semibold text-gray-800 text-lg">{referral.name}</p>
                                  <Badge 
                                    variant={referral.user_type === 'merchant' ? 'default' : 'secondary'}
                                    className={referral.user_type === 'merchant' 
                                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                      : 'bg-purple-100 text-purple-800 border-purple-200'
                                    }
                                  >
                                    {referral.user_type === 'merchant' ? '🏪 Lojista' : '👤 Cliente'}
                                  </Badge>
                                </div>
                                {referral.store_name && (
                                  <div className="flex items-center text-gray-600 text-sm">
                                    <Store className="mr-1 h-4 w-4" />
                                    <span>{referral.store_name}</span>
                                  </div>
                                )}
                              </div>

                              {/* Contato */}
                              <div className="text-sm text-gray-600">
                                <div className="flex items-center mb-1">
                                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                                  <span>{referral.email || 'Não informado'}</span>
                                </div>
                                <div className="flex items-center">
                                  <Phone className="mr-2 h-4 w-4 text-gray-400" />
                                  <span>{referral.phone || 'Não informado'}</span>
                                </div>
                              </div>

                              {/* Data */}
                              <div className="flex items-center text-gray-600 text-sm">
                                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                <span>
                                  {new Date(referral.date).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>

                              {/* Status */}
                              <div>
                                <Badge 
                                  variant={referral.status === 'active' ? 'default' : 'secondary'}
                                  className={referral.status === 'active' 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  }
                                >
                                  {referral.status === 'active' ? (
                                    <>
                                      <CheckCircle2 className="mr-1 h-3 w-3" />
                                      Ativo
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="mr-1 h-3 w-3" />
                                      Pendente
                                    </>
                                  )}
                                </Badge>
                              </div>

                              {/* Comissão */}
                              <div className="text-right">
                                <p className="text-xl font-bold text-green-600">${referral.commission}</p>
                                <p className="text-xs text-gray-500">comissão total</p>
                              </div>
                            </div>

                            {/* Ação */}
                            <div className="ml-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openReferralDetails(referral)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Dialog de Convite */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Send className="mr-2 h-5 w-5 text-blue-600" />
                Convidar por Email
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Nome do Amigo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email do Amigo</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite o email"
                  required
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-3">
                <Button 
                  type="submit" 
                  disabled={inviteMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {inviteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Convite
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInviteDialog(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5 text-blue-600" />
                Detalhes da Indicação
              </DialogTitle>
            </DialogHeader>
            {selectedReferral && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nome</Label>
                    <p className="text-lg font-semibold text-gray-800">{selectedReferral.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedReferral.user_type === 'merchant' ? 'default' : 'secondary'}
                        className={selectedReferral.user_type === 'merchant' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                        }
                      >
                        {selectedReferral.user_type === 'merchant' ? '🏪 Lojista' : '👤 Cliente'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-gray-800">{selectedReferral.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                    <p className="text-gray-800">{selectedReferral.phone || 'Não informado'}</p>
                  </div>
                  {selectedReferral.store_name && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Loja</Label>
                      <p className="text-gray-800 flex items-center">
                        <Store className="mr-2 h-4 w-4 text-gray-500" />
                        {selectedReferral.store_name}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Data de Cadastro</Label>
                    <p className="text-gray-800">
                      {new Date(selectedReferral.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedReferral.status === 'active' ? 'default' : 'secondary'}
                        className={selectedReferral.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {selectedReferral.status === 'active' ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            Pendente
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-800 mb-1">Comissão Total Gerada</h4>
                      <p className="text-3xl font-bold text-green-600">${selectedReferral.commission}</p>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-green-700 mt-3">
                    Você recebe 1% sobre todas as transações realizadas por esta indicação. 
                    Esta comissão é vitalícia!
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}