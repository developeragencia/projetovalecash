import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Loader2, Copy, Download, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Esquema de validação do formulário de pagamento
const paymentFormSchema = z.object({
  amount: z.string()
    .min(1, "Valor é obrigatório")
    .regex(/^\d+(\.\d{1,2})?$/, "Formato inválido. Use 0.00")
    .refine(
      (val) => parseFloat(val) >= 5,
      { message: "O valor mínimo para pagamentos é de $5" }
    ),
  description: z.string().max(100, "Descrição muito longa").optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function MerchantPaymentQR() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{
    status: string;
    used_at?: string;
    client_name?: string;
    transaction?: any;
    success?: boolean;
  } | null>(null);

  // Configuração do formulário
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      description: "",
    },
  });

  // Query para verificar status do QR Code
  const checkQRStatusQuery = useQuery({
    queryKey: ['/api/merchant/payment-qr', qrCodeData?.qr_code_id],
    queryFn: async () => {
      if (!qrCodeData || !qrCodeData.qr_code_id) return null;
      
      // Não definir como verificando se o pagamento já foi aprovado
      if (!paymentStatus || paymentStatus.status !== 'used') {
        setCheckingStatus(true);
      }
      
      try {
        const res = await fetch(`/api/merchant/payment-qr/${qrCodeData.qr_code_id}`);
        if (!res.ok) {
          throw new Error("Erro ao verificar status do QR Code");
        }
        
        const data = await res.json();
        const newPaymentStatus = {
          status: data.status,
          used_at: data.used_at,
          client_name: data.transaction?.client_name,
          transaction: data.transaction,
          success: data.status === 'used'
        };
        
        setPaymentStatus(newPaymentStatus);
        
        // Se o pagamento foi processado com sucesso, desabilitar a verificação
        if (data.status === 'used') {
          setCheckingStatus(false);
        }
        
        return data;
      } catch (error) {
        console.error("Erro ao verificar status:", error);
        return null;
      } finally {
        // Só desativa o indicador de checagem se não for um pagamento aprovado
        if (!paymentStatus || paymentStatus.status !== 'used') {
          setCheckingStatus(false);
        }
      }
    },
    enabled: !!qrCodeData?.qr_code_id && (!paymentStatus || paymentStatus.status !== 'used'),
    refetchInterval: (qrCodeData && (!paymentStatus || paymentStatus.status !== 'used')) ? 5000 : false, // Para de verificar quando o pagamento é aprovado
  });

  // Mutation para gerar QR Code
  const generateQRMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const res = await apiRequest("POST", "/api/merchant/generate-payment", data);
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("QR code dados recebidos do servidor:", data);
      
      if (data.success && data.qr_code && data.payment_data) {
        // Criar estrutura de dados para o QR code
        const qrData = {
          qr_code_id: data.qr_code.code,
          amount: data.payment_data.amount,
          description: data.payment_data.description,
          merchant_name: data.payment_data.merchant_name,
          expires_at: data.expires_at,
          qr_string: JSON.stringify(data.payment_data)
        };
        
        setQrCodeData(qrData);
        setExpiryDate(new Date(data.expires_at));
        setPaymentStatus(null); // Reset payment status
        
        toast({
          title: "QR Code gerado com sucesso",
          description: `Valor: $${data.payment_data.amount} - ${data.payment_data.description}`,
        });
      } else {
        throw new Error("Formato de resposta inválido do servidor");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar QR Code",
        description: error.message || "Não foi possível gerar o código de pagamento.",
        variant: "destructive",
      });
    },
  });

  // Função para copiar o código para a área de transferência
  const copyQRCode = () => {
    if (!qrCodeData) return;
    
    try {
      navigator.clipboard.writeText(qrCodeData.qr_code_id);
      toast({
        title: "Código copiado",
        description: "O código foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código.",
        variant: "destructive",
      });
    }
  };

  // Função para baixar o QR Code como imagem SVG de forma segura
  const downloadQRCode = () => {
    if (!qrCodeData) return;
    
    try {
      // Implementação mais segura que funciona em diferentes navegadores
      // Criar um novo elemento SVG temporário
      const svg = document.querySelector('.qrcode-wrapper svg');
      if (!svg) {
        console.error('QR Code SVG não encontrado');
        throw new Error('QR Code não encontrado');
      }
      
      // Clonar o SVG para evitar problemas de referência
      const svgClone = svg.cloneNode(true) as SVGElement;
      
      // Garantir que o SVG tem os atributos necessários
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgClone.setAttribute('width', '200');
      svgClone.setAttribute('height', '200');
      
      // Converter para string e criar blob
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Criar link para download
      const downloadLink = document.createElement('a');
      downloadLink.setAttribute('href', svgUrl);
      downloadLink.setAttribute('download', `pagamento-${qrCodeData.qr_code_id}.svg`);
      downloadLink.style.display = 'none';
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
      }, 100);
      
      toast({
        title: "Download iniciado",
        description: "O QR Code está sendo baixado.",
      });
    } catch (error) {
      console.error('Erro ao baixar QR Code:', error);
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o QR Code. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para limpar e gerar um novo QR Code
  const resetQRCode = () => {
    setQrCodeData(null);
    setExpiryDate(null);
    form.reset();
  };

  // Envio do formulário
  const onSubmit = (values: PaymentFormValues) => {
    generateQRMutation.mutate(values);
  };

  // Formatar o tempo restante em minutos e segundos
  const formatTimeRemaining = () => {
    if (!expiryDate) return "";
    
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expirado";
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMins}m ${diffSecs}s`;
  };

  // Atualizar o contador a cada segundo
  React.useEffect(() => {
    if (!expiryDate) return;
    
    const intervalId = setInterval(() => {
      const now = new Date();
      if (now >= expiryDate) {
        setQrCodeData(null);
        setExpiryDate(null);
        clearInterval(intervalId);
        toast({
          title: "QR Code expirado",
          description: "O código de pagamento expirou. Gere um novo código.",
          variant: "destructive",
        });
      } else {
        // Forçar atualização do componente
        setExpiryDate(new Date(expiryDate.getTime()));
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [expiryDate, toast]);

  return (
    <DashboardLayout title="Gerar QR Code" type="merchant">
      <div className="container mx-auto p-4 max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Gerar QR Code de Pagamento</h1>
        
        {!qrCodeData ? (
          <Card>
            <CardHeader>
              <CardTitle>Novo Pagamento</CardTitle>
              <CardDescription>
                Informe o valor para gerar um QR Code que seus clientes podem escanear
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (em $)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0.00" 
                            {...field} 
                            inputMode="decimal"
                          />
                        </FormControl>
                        <FormDescription>
                          Informe o valor sem símbolo de moeda, exemplo: 25.50
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Descrição da venda" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Uma breve descrição para identificar esta transação
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={generateQRMutation.isPending}
                  >
                    {generateQRMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      "Gerar QR Code"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>QR Code de Pagamento</CardTitle>
              <CardDescription>
                Peça para o cliente escanear o código abaixo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4">
                {/* Status do Pagamento */}
                {paymentStatus && paymentStatus.status === "used" ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-800">Pagamento recebido!</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Pagamento de {formatCurrency(qrCodeData.amount)} processado com sucesso.
                      {paymentStatus.client_name && (
                        <p className="mt-1">Cliente: {paymentStatus.client_name}</p>
                      )}
                      {paymentStatus.used_at && (
                        <p className="mt-1">Data: {formatDate(paymentStatus.used_at)}</p>
                      )}
                      {paymentStatus.transaction && (
                        <>
                          <p className="mt-1">
                            <strong>Método:</strong> {paymentStatus.transaction.payment_method === 'bonus' 
                              ? 'Pagamento com Bônus' 
                              : 'Pagamento com Saldo'}
                          </p>
                          <p className="text-xs mt-2">ID da transação: {paymentStatus.transaction.id}</p>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    {/* Usar wrapper para evitar problemas com o QRCodeSVG */}
                    <div className="qrcode-wrapper">
                      <QRCodeSVG
                        id="payment-qr-code"
                        value={qrCodeData.qr_code_id}
                        size={200}
                        level="H" // Alta correção de erro
                        includeMargin={true}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                      />
                    </div>
                  </div>
                )}
                
                {/* Status da consulta - só mostrar se o pagamento não estiver confirmado */}
                {checkingStatus && (!paymentStatus || (paymentStatus && paymentStatus.status !== 'used')) && (
                  <div className="flex items-center justify-center text-sm text-orange-700">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando status do pagamento...
                  </div>
                )}
                
                <div className="w-full">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Valor:</span>
                    <span className="text-lg font-bold">{formatCurrency(qrCodeData.amount)}</span>
                  </div>
                  
                  {qrCodeData.description && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Descrição:</span>
                      <span className="text-sm">{qrCodeData.description}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Código:</span>
                    <span className="text-sm font-mono">{qrCodeData.qr_code_id}</span>
                  </div>
                  
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Status:</span>
                    <span className="text-sm">
                      {paymentStatus?.status === "used" ? (
                        <Badge variant="success" className="border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" /> Pago
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" /> Aguardando pagamento
                        </Badge>
                      )}
                    </span>
                  </div>
                  
                  {paymentStatus?.status !== "used" && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Expira em:</span>
                      <span className="text-sm font-mono">{formatTimeRemaining()}</span>
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                {paymentStatus?.status !== "used" && (
                  <div className="flex space-x-2 w-full">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={copyQRCode}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar código
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={downloadQRCode}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar QR
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              {paymentStatus?.status === "used" ? (
                <div className="w-full space-y-2">
                  <Button 
                    variant="default" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => window.location.href = "/merchant/transactions"}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ver Transações
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={resetQRCode}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Gerar Novo QR Code
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={resetQRCode}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Gerar Novo QR Code
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}