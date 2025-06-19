import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Download } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/hooks/use-translation";

// Configurações globais do sistema
const SYSTEM_SETTINGS = {
  cashbackRate: 0.02, // 2% - Cashback para o cliente
  referralRate: 0.01, // 1% - Bônus para quem indicou
  merchantCommission: 0.02, // 2% - Comissão do lojista
  platformFee: 0.05, // 5% - Taxa da plataforma
  minWithdrawal: 20, // $ 20.00 - Valor mínimo para saque
  withdrawalFee: 0.05, // 5% - Taxa sobre saques
};

// Formatação de valores monetários
const formatCurrency = (value: string | number) => {
  if (value === "" || value === null || value === undefined) return "$0.00";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numValue);
};

// Função auxiliar para garantir que um valor é um número válido
const ensureNumber = (value: any): number => {
  if (value === undefined || value === null) return 0;
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
};

// Componente de formulário de solicitação de saque
const WithdrawalRequestForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    amount: "",
    full_name: user?.name || "",
    store_name: "",
    phone: "",
    email: user?.email || "",
    bank_name: "",
    agency: "",
    account: "",
    payment_method: "bank",
  });

  // Interface para tipagem da carteira
  interface WalletData {
    currentBalance: number;
    pendingAmount: number;
    pendingCount: number;
    availableBalance: number;
  }
  
  // Consultar dados da carteira do lojista
  const { data: walletData, isLoading: isLoadingWallet } = useQuery<{success: boolean, walletData: WalletData}>({
    queryKey: ['/api/merchant/wallet'],
    refetchOnWindowFocus: false,
    staleTime: 30000,
    retry: 1,
  });

  // Dados da carteira
  const wallet: WalletData = (walletData && walletData.walletData) ? walletData.walletData : {
    currentBalance: 0,
    pendingAmount: 0,
    pendingCount: 0,
    availableBalance: 0
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Tratamento especial para o campo de valor para permitir apenas números e ponto
    if (name === "amount") {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, payment_method: value });
  };
  
  const withdrawalMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/merchant/withdrawal-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de saque foi enviada com sucesso e será processada em breve.",
        variant: "default",
      });
      
      // Limpar formulário
      setFormData({
        amount: "",
        full_name: user?.name || "",
        store_name: "",
        phone: "",
        email: user?.email || "",
        bank_name: "",
        agency: "",
        account: "",
        payment_method: "bank",
      });
      
      // Atualizar a lista de solicitações e o saldo disponível
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/wallet"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message || (error.data && error.data.message) || "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido para o saque.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se o valor solicitado é maior que o saldo disponível
    const requestAmount = parseFloat(formData.amount);
    if (requestAmount > wallet.availableBalance) {
      toast({
        title: "Saldo insuficiente",
        description: `Você não possui saldo suficiente para esta solicitação. Saldo disponível: ${formatCurrency(wallet.availableBalance)}`,
        variant: "destructive",
      });
      return;
    }
    
    // Valor mínimo para saque
    if (requestAmount < SYSTEM_SETTINGS.minWithdrawal) {
      toast({
        title: "Valor mínimo não atingido",
        description: `O valor mínimo para saque é de $${SYSTEM_SETTINGS.minWithdrawal.toFixed(2)}.`,
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.full_name || !formData.store_name || !formData.phone || !formData.email || 
        !formData.bank_name || !formData.agency || !formData.account) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    withdrawalMutation.mutate(formData);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('withdrawal.requestWithdrawal')}</CardTitle>
        <CardDescription>
          {t('withdrawal.minimumAmount')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mostrar informações do saldo */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex flex-col p-4 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">{t('withdrawal.currentBalance')}</span>
            <span className="text-2xl font-semibold">
              {isLoadingWallet ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                formatCurrency(ensureNumber(wallet.currentBalance))
              )}
            </span>
          </div>
          
          <div className="flex flex-col p-4 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">{t('withdrawal.availableBalance')}</span>
            <span className="text-2xl font-semibold text-primary">
              {isLoadingWallet ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                formatCurrency(ensureNumber(wallet.availableBalance))
              )}
            </span>
          </div>
          
          <div className="flex flex-col p-4 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">{t('withdrawal.pendingAmount')}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {isLoadingWallet ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  formatCurrency(ensureNumber(wallet.pendingAmount))
                )}
              </span>
              {ensureNumber(wallet.pendingCount) > 0 && (
                <Badge variant="outline" className="ml-2">
                  {ensureNumber(wallet.pendingCount)} {ensureNumber(wallet.pendingCount) === 1 ? 'solicitação' : 'solicitações'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Saque ($)*</Label>
              <Input
                id="amount"
                name="amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                required
              />
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <div className="mt-2 text-sm rounded-md border border-border p-2">
                  <div className="flex justify-between">
                    <span>Valor Bruto:</span>
                    <span className="font-medium">{formatCurrency(formData.amount)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Taxa (5%):</span>
                    <span>-{formatCurrency(parseFloat(formData.amount) * 0.05)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-medium mt-1 pt-1 border-t">
                    <span>Valor Líquido:</span>
                    <span>{formatCurrency(parseFloat(formData.amount) * 0.95)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pagamento*</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={handleSelectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Transferência Bancária</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo*</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Nome completo do titular da conta"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="store_name">Nome da Loja*</Label>
              <Input
                id="store_name"
                name="store_name"
                placeholder="Nome da sua loja"
                value={formData.store_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone para Contato*</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email para Contato*</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bank_name">Nome do Banco*</Label>
              <Input
                id="bank_name"
                name="bank_name"
                placeholder="Nome do banco"
                value={formData.bank_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agency">Número da conta*</Label>
              <Input
                id="agency"
                name="agency"
                placeholder="Número da conta"
                value={formData.agency}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="account">Conta*</Label>
              <Input
                id="account"
                name="account"
                placeholder="Número da conta"
                value={formData.account}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={withdrawalMutation.isPending}
          >
            {withdrawalMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Solicitar Saque"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col text-xs text-muted-foreground space-y-1">
        <p>
          * Todas as solicitações serão processadas em até 24 horas úteis.
        </p>
        <p>
          * O valor mínimo para saque é de ${SYSTEM_SETTINGS.minWithdrawal.toFixed(2)}.
        </p>
        <p>
          * Uma taxa de {SYSTEM_SETTINGS.withdrawalFee * 100}% é aplicada a todas as solicitações de saque. Por exemplo, para um saque de $100,00, você receberá ${(100 * (1 - SYSTEM_SETTINGS.withdrawalFee)).toFixed(2)}.
        </p>
        {formData.amount && parseFloat(formData.amount) > 0 && (
          <p className="mt-2 text-sm font-medium text-primary">
            Valor solicitado: ${parseFloat(formData.amount).toFixed(2)} → Valor líquido: ${(parseFloat(formData.amount) * (1 - SYSTEM_SETTINGS.withdrawalFee)).toFixed(2)} (após taxa de {SYSTEM_SETTINGS.withdrawalFee * 100}%)
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

// Componente de histórico de saques
const WithdrawalHistory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/merchant/withdrawal-requests"],
    queryFn: async () => {
      const res = await fetch("/api/merchant/withdrawal-requests");
      if (!res.ok) {
        throw new Error("Erro ao carregar histórico de saques");
      }
      return res.json();
    }
  });
  
  // Mutation para cancelar solicitação de saque
  const cancelWithdrawalMutation = useMutation({
    mutationFn: async (withdrawalId: number) => {
      const res = await apiRequest("DELETE", `/api/merchant/withdrawal-requests/${withdrawalId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao cancelar solicitação");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação cancelada",
        description: "A solicitação de saque foi cancelada com sucesso e o valor foi retornado para sua carteira.",
        variant: "default",
      });
      
      // Atualizar a lista de solicitações e o saldo disponível
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/wallet"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message || "Ocorreu um erro ao cancelar a solicitação. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Função para confirmar e cancelar uma solicitação
  const handleCancelWithdrawal = (withdrawalId: number) => {
    if (confirm("Tem certeza que deseja cancelar esta solicitação de saque? O valor será retornado para sua carteira.")) {
      cancelWithdrawalMutation.mutate(withdrawalId);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Erro ao carregar histórico de saques</p>
        <Button 
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }
  
  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };
  
  // Badge de status
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Recusado</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelado</Badge>;
      case "pending":
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico de Saques</CardTitle>
        <CardDescription>
          Aqui você pode acompanhar todas as suas solicitações de saque.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data?.withdrawals?.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Valor Bruto</TableHead>
                <TableHead>Taxa (5%)</TableHead>
                <TableHead>Valor Líquido</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(data.withdrawals) ? data.withdrawals : []).map((withdrawal: any) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>{formatDate(withdrawal.created_at)}</TableCell>
                  <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                  <TableCell className="text-destructive">
                    {withdrawal.fee_amount 
                      ? formatCurrency(withdrawal.fee_amount) 
                      : formatCurrency(parseFloat(withdrawal.amount) * SYSTEM_SETTINGS.withdrawalFee)
                    }
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {withdrawal.net_amount 
                      ? formatCurrency(withdrawal.net_amount) 
                      : formatCurrency(parseFloat(withdrawal.amount) * (1 - SYSTEM_SETTINGS.withdrawalFee))
                    }
                  </TableCell>
                  <TableCell>
                    {withdrawal.payment_method === "bank" ? "Transferência" : "Zelle"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={withdrawal.status} />
                      {withdrawal.status === "completed" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {withdrawal.status === "rejected" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {withdrawal.status === "cancelled" && (
                        <XCircle className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {withdrawal.status === "pending" && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleCancelWithdrawal(withdrawal.id)}
                        disabled={cancelWithdrawalMutation.isPending}
                      >
                        {cancelWithdrawalMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Cancelar"
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Você ainda não realizou nenhuma solicitação de saque.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Página principal
export default function MerchantWithdrawals() {
  // Adicionar hook de tradução
  const { t } = useTranslation();
  
  return (
    <DashboardLayout 
      title="withdrawal.requestWithdrawal"
      type="merchant">
      <div className="flex flex-col space-y-8 p-4 md:p-8">
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('withdrawal.requestWithdrawal')}</h2>
          <p className="text-muted-foreground">
            {t('withdrawal.withdrawalHistory')}
          </p>
        </div>
        
        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">{t('withdrawal.newRequest')}</TabsTrigger>
            <TabsTrigger value="history">{t('withdrawal.history')}</TabsTrigger>
          </TabsList>
          <TabsContent value="request" className="mt-6">
            <WithdrawalRequestForm />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <WithdrawalHistory />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}