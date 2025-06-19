import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QRCodeDisplay } from "@/components/ui/qr-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Copy, UserPlus, Users, Percent, Share2, RefreshCw, Award, Gift, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useAuth } from "@/hooks/use-auth";
import { SystemInfo } from "@/components/ui/system-info";
import { motion } from "framer-motion";

export default function ClientReferrals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Query para buscar informações sobre indicações do usuário
  const { data: referralsData, isLoading: isReferralsLoading, error: referralsError, refetch } = useQuery({
    queryKey: ['/api/client/referrals'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/client/referrals");
      return await response.json();
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    enabled: !!user
  });
  
  // Exibir erro no console para diagnóstico
  if (referralsError) {
    console.error("Erro ao buscar dados de referência:", referralsError);
  }
  
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
          title: t('common.success'),
          description: t('referrals.linkCopied'),
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast({
        title: t('common.error'),
        description: t('referrals.copyError'),
        variant: "destructive",
      });
    }
  };
  
  // Função para compartilhar no WhatsApp
  const shareOnWhatsApp = () => {
    const text = `${t('referrals.shareMessage', { code: referralsData?.referralCode || 'ABC123' })} ${referralsData?.referralUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  // Mutation para enviar convite por email
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      const res = await apiRequest("POST", "/api/client/referrals/invite", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('referrals.inviteSent'),
        variant: "default",
      });
      setEmail("");
      setName("");
      queryClient.invalidateQueries({ queryKey: ['/api/client/referrals'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('referrals.inviteError'),
        variant: "destructive",
      });
    }
  });
  
  // Estado para o formulário de convite
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  
  // Função para enviar convite
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast({
        title: t('common.error'),
        description: t('referrals.requiredFields'),
        variant: "destructive",
      });
      return;
    }
    
    inviteMutation.mutate({ email, name });
  };
  
  // Colunas para a tabela de indicados
  const referralsColumns = [
    { header: t('common.name'), accessorKey: "name" },
    { 
      header: t('common.type'), 
      accessorKey: "user_type",
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex items-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.user_type === "merchant" 
                ? "bg-blue-100 text-blue-800" 
                : "bg-purple-100 text-purple-800"
            }`}>
              {item.user_type === "merchant" ? 'Lojista' : 'Cliente'}
            </span>
          </div>
        );
      }
    },
    { 
      header: t('common.contact'), 
      accessorKey: "email",
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex flex-col text-xs">
            <span>{item.email || t('common.emailNotProvided')}</span>
            <span className="text-muted-foreground">{item.phone || t('common.phoneNotProvided')}</span>
          </div>
        );
      }
    },
    { 
      header: t('merchant.storeName'), 
      accessorKey: "store_name",
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex items-center">
            {item.user_type === "merchant" ? (
              <span>{item.store_name || t('merchant.noStoreName')}</span>
            ) : (
              <span className="text-muted-foreground text-xs">N/A</span>
            )}
          </div>
        );
      }
    },
    { 
      header: "Total Gasto", 
      accessorKey: "total_spent",
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex items-center">
            <span className="font-medium text-blue-600">$ {parseFloat(item.total_spent || '0').toFixed(2)}</span>
          </div>
        );
      }
    },
    { 
      header: "Transações", 
      accessorKey: "total_transactions",
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex items-center">
            <span className="px-2 py-1 rounded bg-gray-100 text-xs font-medium">
              {item.total_transactions || 0}
            </span>
          </div>
        );
      }
    },
    { header: t('common.date'), accessorKey: "date" },
    { 
      header: t('common.status'), 
      accessorKey: "status",
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex items-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.status === "approved" 
                ? "bg-green-100 text-green-800" 
                : "bg-yellow-100 text-yellow-800"
            }`}>
              {item.status === "approved" ? "Aprovado" : "Pendente"}
            </span>
          </div>
        );
      }
    },
    { 
      header: "Comissão Ganha", 
      accessorKey: "commission",
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex items-center">
            <span className={`font-medium ${parseFloat(item.commission || '0') > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              $ {parseFloat(item.commission || '0').toFixed(2)}
            </span>
          </div>
        );
      }
    },
  ];

  // Conteúdo condicional baseado no tipo de usuário e erros
  if (user?.type !== "client") {
    return (
      <DashboardLayout title={t('navigation.referrals')} type="client">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t('common.restrictedAccess')}</CardTitle>
            <CardDescription>
              {t('referrals.clientOnly')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{t('referrals.permissionDenied')}</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (referralsError) {
    return (
      <DashboardLayout title={t('common.Referrals')} type="client">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t('common.loadingError')}</CardTitle>
            <CardDescription>
              {t('referrals.loadingError')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{t('common.reloadMessage')}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.reloadPage')}
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Conteúdo principal para usuários clientes
  return (
    <DashboardLayout title={t('common.Referrals')} type="client">
      <div className="flex flex-col space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <Users className="h-4 w-4 mr-2" />
              {t('referrals.overview')}
            </TabsTrigger>
            <TabsTrigger value="invite">
              <UserPlus className="h-4 w-4 mr-2" />
              {t('referrals.inviteFriends')}
            </TabsTrigger>
            <TabsTrigger value="list">
              <Percent className="h-4 w-4 mr-2" />
              {t('referrals.myReferrals')}
            </TabsTrigger>
          </TabsList>
          
          {/* Aba de Visão Geral */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="overflow-hidden border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardTitle className="flex items-center text-xl font-bold text-primary">
                      <Award className="h-5 w-5 mr-2 text-primary" />
                      {t('referrals.yourReferralCode')}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {t('referrals.shareCodeDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center pt-6">
                    <div className="flex flex-col items-center space-y-6">
                      <motion.div 
                        className="text-4xl font-bold px-8 py-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/20 text-primary shadow-inner"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          duration: 0.5,
                          type: "spring",
                          stiffness: 260,
                          damping: 20 
                        }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {referralsData?.referralCode || "..."}
                      </motion.div>
                      <div className="flex flex-wrap gap-3">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={copyReferralLink}
                            className="flex items-center shadow-sm transition-all border-primary/30 hover:border-primary hover:bg-primary/5"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            {t('referrals.copyLink')}
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={shareOnWhatsApp}
                            className="flex items-center shadow-sm text-green-600 border-green-600 hover:bg-green-50 transition-all"
                          >
                            <WhatsAppIcon className="h-4 w-4 mr-2" />
                            {t('common.share')}
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start space-y-2 bg-gradient-to-r from-primary/5 to-primary/10 mt-4 rounded-b-lg border-t border-primary/10">
                    <p className="text-sm">
                      {t('referrals.commissionRate')}: <span className="font-medium text-primary">1%</span> {t('referrals.perReferral')}
                    </p>
                    <p className="text-sm">
                      {t('referrals.shareCodeExplanation')}
                    </p>
                  </CardFooter>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="overflow-hidden border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                    <CardTitle className="flex items-center text-xl font-bold text-blue-600">
                      <Gift className="h-5 w-5 mr-2 text-blue-600" />
                      {t('referrals.earningsStats')}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {t('referrals.trackEarnings')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div 
                        className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg shadow-sm"
                        whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
                      >
                        <span className="text-4xl font-bold text-blue-600">{referralsData?.referralsCount || 0}</span>
                        <span className="text-sm mt-1">Total Indicações</span>
                      </motion.div>
                      <motion.div 
                        className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-green-50 to-green-100 rounded-lg shadow-sm"
                        whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
                      >
                        <span className="text-4xl font-bold text-green-600">{referralsData?.approvedReferrals || 0}</span>
                        <span className="text-sm mt-1">Aprovadas</span>
                      </motion.div>
                      <motion.div 
                        className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-lg shadow-sm"
                        whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
                      >
                        <span className="text-4xl font-bold text-yellow-600">{referralsData?.pendingReferrals || 0}</span>
                        <span className="text-sm mt-1">Pendentes</span>
                      </motion.div>
                      <motion.div 
                        className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-purple-50 to-purple-100 rounded-lg shadow-sm"
                        whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
                      >
                        <span className="text-4xl font-bold text-purple-600">$ {parseFloat(referralsData?.totalEarned || "0").toFixed(2)}</span>
                        <span className="text-sm mt-1">Total Ganho</span>
                      </motion.div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start space-y-2 bg-gradient-to-r from-blue-50 to-blue-100 mt-4 rounded-b-lg border-t border-blue-100">
                    <p className="text-sm text-blue-600">
                      {t('referrals.howItWorks')}
                    </p>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
          
          {/* Aba de Convidar Amigos */}
          <TabsContent value="invite">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden border-primary/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    {t('referrals.inviteFriends')}
                  </CardTitle>
                  <CardDescription>
                    {t('referrals.inviteDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="friend-name">{t('common.name')}</Label>
                      <Input 
                        id="friend-name" 
                        placeholder={t('common.enterName')} 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="friend-email">{t('common.email')}</Label>
                      <Input 
                        id="friend-email" 
                        type="email" 
                        placeholder={t('common.enterEmail')} 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                          {t('common.sending')}
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4 mr-2" />
                          {t('referrals.sendInvitation')}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-2 bg-gradient-to-r from-primary/5 to-primary/10 pt-4 rounded-b-lg border-t border-primary/10">
                  <div className="flex items-center w-full">
                    <div className="flex-1 border-t border-border" />
                    <span className="px-2 text-xs text-muted-foreground">{t('common.or')}</span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                  <div className="w-full space-y-3">
                    <p className="text-sm">{t('referrals.alternateShareMethods')}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={copyReferralLink}
                          className="flex items-center"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {t('referrals.copyLink')}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={shareOnWhatsApp}
                          className="flex items-center text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <WhatsAppIcon className="h-4 w-4 mr-2" />
                          {t('common.shareViaWhatsApp')}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Aba de Meus Indicados */}
          <TabsContent value="list">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden border-primary/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="flex items-center">
                    <Percent className="h-5 w-5 mr-2" />
                    {t('referrals.myReferrals')}
                  </CardTitle>
                  <CardDescription>
                    {t('referrals.trackReferrals')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {isReferralsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary/70" />
                    </div>
                  ) : referralsData?.referrals && referralsData.referrals.length > 0 ? (
                    <div className="rounded-md border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Loja</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Gasto</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transações</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comissão Ganha</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {referralsData.referrals.map((referral: any, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {referral.name}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    referral.user_type === "merchant" 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-purple-100 text-purple-800"
                                  }`}>
                                    {referral.user_type === "merchant" ? 'Lojista' : 'Cliente'}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex flex-col">
                                    <span>{referral.email || 'Não informado'}</span>
                                    <span className="text-xs text-gray-400">{referral.phone || 'Não informado'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {referral.user_type === "merchant" ? (
                                    <span>{referral.store_name || 'Sem nome'}</span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">N/A</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                  $ {parseFloat(referral.total_spent || '0').toFixed(2)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="px-2 py-1 rounded bg-gray-100 text-xs font-medium">
                                    {referral.total_transactions || 0}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {referral.date}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    referral.status === "approved" 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}>
                                    {referral.status === "approved" ? "Aprovado" : "Pendente"}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                  <span className={`${parseFloat(referral.commission || '0') > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                    $ {parseFloat(referral.commission || '0').toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">{t('referrals.noReferralsYet')}</h3>
                      <p className="text-muted-foreground mb-6">{t('referrals.startInviting')}</p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("invite")}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('referrals.inviteNow')}
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-2 bg-gradient-to-r from-primary/5 to-primary/10 pt-4 rounded-b-lg border-t border-primary/10">
                  {referralsData?.referrals && referralsData.referrals.length > 0 && (
                    <Alert className="bg-transparent border-primary/20">
                      <Award className="h-4 w-4" />
                      <AlertTitle>{t('referrals.rewardsTitle')}</AlertTitle>
                      <AlertDescription>
                        {t('referrals.rewardsDescription')}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
        
        <SystemInfo className="mt-6" />
      </div>
    </DashboardLayout>
  );
}