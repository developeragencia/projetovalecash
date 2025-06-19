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

// Formatação de valores monetários
const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return "$0.00";
  }
  
  let numValue: number;
  
  if (typeof value === "string") {
    // Remover possíveis caracteres de moeda e espaços antes de converter
    const cleanValue = value.replace(/[$,\s]/g, '');
    numValue = parseFloat(cleanValue);
  } else {
    numValue = value;
  }
  
  if (isNaN(numValue)) {
    return "$0.00";
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numValue);
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
  const { data: walletData, isLoading: isLoadingWallet } = useQuery<WalletData>({
    queryKey: ['/api/merchant/wallet'],
    refetchOnWindowFocus: false,
    staleTime: 30000,
    retry: 1,
  });

  // Dados da carteira
  const wallet: WalletData = walletData || {
    currentBalance: 0,
    pendingAmount: 0,
    pendingCount: 0,
    availableBalance: 0
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      payment_method: value
    }));
  };
  
  // Mutação para enviar solicitação de saque
  const { mutate: requestWithdrawal, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/merchant/withdrawal-requests", data);
      return await response.json();
    },
    onSuccess: () => {
      setFormData(prev => ({
        ...prev,
        amount: "",
        bank_name: "",
        agency: "",
        account: "",
      }));
      
      toast({
        title: t('withdrawal.success'),
        description: t('common.operationPerformedSuccessfully'),
      });
      
      // Invalidar cache para atualizar dados da carteira
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/wallet"] });
    },
    onError: (error: any) => {
      toast({
        title: t('withdrawal.error'),
        description: error.message || (error.data && error.data.message) || t('common.requestProcessError'),
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: t('common.invalidAmount'),
        description: t('common.pleaseEnterValidAmount'),
        variant: "destructive",
      });
      return;
    }
    
    if (parseFloat(formData.amount) > wallet.availableBalance) {
      toast({
        title: t('common.insufficientFunds'),
        description: t('common.amountExceedsAvailableBalance'),
        variant: "destructive",
      });
      return;
    }
    
    if (parseFloat(formData.amount) < 1) {
      toast({
        title: t('common.invalidAmount'),
        description: t('withdrawal.minimumAmount'),
        variant: "destructive",
      });
      return;
    }
    
    if (formData.payment_method === "bank" && (!formData.bank_name || !formData.account)) {
      toast({
        title: t('common.missingInformation'),
        description: t('common.fillRequiredFields'),
        variant: "destructive",
      });
      return;
    }
    
    requestWithdrawal(formData);
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
                formatCurrency(wallet.currentBalance)
              )}
            </span>
          </div>
          
          <div className="flex flex-col p-4 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">{t('withdrawal.availableBalance')}</span>
            <span className="text-2xl font-semibold text-primary">
              {isLoadingWallet ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                formatCurrency(wallet.availableBalance)
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
                  formatCurrency(wallet.pendingAmount)
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                ({wallet.pendingCount || 0} {wallet.pendingCount === 1 ? t('common.request') : t('common.requests')})
              </span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="amount">{t('withdrawal.withdrawalAmount')}</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="payment_method">{t('withdrawal.withdrawalMethod')}</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={handleSelectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.selectOption')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">{t('withdrawal.bankTransfer')}</SelectItem>
                  <SelectItem value="zelle">{t('withdrawal.zelle')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.payment_method === "bank" && (
              <>
                <div className="space-y-4">
                  <Label htmlFor="bank_name">{t('withdrawal.bankName')}</Label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    placeholder={t('withdrawal.bankName')}
                    value={formData.bank_name}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Label htmlFor="agency">{t('withdrawal.routingNumber')}</Label>
                    <Input
                      id="agency"
                      name="agency"
                      placeholder={t('withdrawal.routingNumber')}
                      value={formData.agency}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="account">{t('withdrawal.accountNumber')}</Label>
                    <Input
                      id="account"
                      name="account"
                      placeholder={t('withdrawal.accountNumber')}
                      value={formData.account}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}
            
            {formData.payment_method === "zelle" && (
              <div className="space-y-4">
                <Label htmlFor="account">{t('withdrawal.zelleEmail')}</Label>
                <Input
                  id="account"
                  name="account"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.account}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isPending || isLoadingWallet || parseFloat(formData.amount || "0") <= 0}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                t('withdrawal.requestWithdrawal')
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Componente para exibir o histórico de solicitações
const WithdrawalHistory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  // Definir interface para tipagem do histórico de saques
  interface WithdrawalRequest {
    id: number;
    user_id: number;
    amount: number;
    payment_method: string;
    bank_name?: string;
    account: string;
    status: string;
    created_at: string;
    updated_at: string;
  }

  // Consultar histórico de saques
  const { data, isLoading } = useQuery<{ withdrawals: WithdrawalRequest[] }>({
    queryKey: ['/api/merchant/withdrawal-requests'],
    refetchOnWindowFocus: false,
  });
  
  // Extrair o histórico de saques com segurança
  const withdrawalHistory = data?.withdrawals || [];
  
  // Mutação para cancelar uma solicitação de saque
  const { mutate: cancelWithdrawal, isPending: isCancelling } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/merchant/withdrawal-requests/${id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('common.requestError'));
      }
      
      return id;
    },
    onSuccess: () => {
      toast({
        title: t('withdrawal.cancelSuccess'),
      });
      
      // Invalidar cache para atualizar histórico e dados da carteira
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/wallet"] });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Função para confirmar e executar o cancelamento
  const handleCancelWithdrawal = (id: number) => {
    if (window.confirm(t('withdrawal.cancelConfirmation'))) {
      cancelWithdrawal(id);
    }
  };
  
  // Função para determinar cor da badge pelo status
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'approved':
        return 'bg-green-200 text-green-800';
      case 'rejected':
        return 'bg-red-200 text-red-800';
      case 'cancelled':
        return 'bg-slate-200 text-slate-800';
      default:
        return 'bg-slate-200 text-slate-800';
    }
  };

  // Função para traduzir status
  const getStatusTranslation = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return t('common.pending');
      case 'approved':
        return t('common.approved');
      case 'rejected':
        return t('common.rejected');
      case 'cancelled':
        return t('common.cancelled');
      default:
        return status;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('withdrawal.withdrawalHistory')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : withdrawalHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common.noRecordsFound')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('withdrawal.requestDate')}</TableHead>
                  <TableHead>{t('withdrawal.amount')}</TableHead>
                  <TableHead>{t('withdrawal.withdrawalMethod')}</TableHead>
                  <TableHead>{t('withdrawal.status')}</TableHead>
                  <TableHead className="text-right">{t('withdrawal.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalHistory.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {format(new Date(request.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(request.amount)}
                    </TableCell>
                    <TableCell>
                      {request.payment_method === 'bank' 
                        ? t('withdrawal.bankTransfer') 
                        : t('withdrawal.zelle')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusTranslation(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelWithdrawal(request.id)}
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t('common.cancel')
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Página principal
export default function MerchantWithdrawals() {
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