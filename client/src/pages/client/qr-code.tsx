import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrScanner } from "@/components/ui/qr-scanner-fixed";
import { Loader2, Check, X, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ClientQRCode() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scannerKey, setScannerKey] = useState(Date.now()); // Chave única para forçar remontagem do scanner

  // Mutation para processar o pagamento
  const processPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Iniciando o processamento do pagamento:", data);
      try {
        const res = await apiRequest("POST", "/api/client/process-payment", data);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Erro ao processar pagamento");
        }
        const jsonResponse = await res.json();
        console.log("Resposta do processamento:", jsonResponse);
        return jsonResponse;
      } catch (error) {
        console.error("Erro no processamento:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Pagamento realizado com sucesso",
        description: `Você pagou ${formatCurrency(data.amount)} para ${data.merchant_name}`,
      });
      
      // Invalidar consultas que possam depender do novo saldo
      queryClient.invalidateQueries({ queryKey: ["/api/client/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/transactions"] });
      
      // Resetar estado
      setPaymentData(null);
      setScanning(true);
      
      // Redirecionar para a página de transações após alguns segundos
      setTimeout(() => {
        navigate("/client/transactions");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Verificar QR Code
  const verifyQrCode = async (code: string) => {
    if (!code) return;
    
    try {
      setLoading(true);
      const response = await apiRequest("GET", `/api/client/verify-qr/${code}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "QR Code inválido ou expirado");
      }
      
      const data = await response.json();
      setPaymentData(data);
      setScanning(false);
      
      toast({
        title: "QR Code válido",
        description: `Código de ${data.merchant_name} - ${formatCurrency(data.amount)}`,
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao ler QR Code",
        description: error.message || "QR Code inválido ou expirado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Lidar com o QR Code escaneado
  const handleScan = (data: string | null) => {
    if (data) {
      console.log("QR Code detectado:", data);
      
      try {
        // Verificar se é um JSON válido
        const parsedData = JSON.parse(data);
        
        // Verificar se tem o formato esperado (formato gerado pelo lojista)
        if (parsedData.id && parsedData.type === "payment_request") {
          console.log("Verificando QR code com ID:", parsedData.id);
          verifyQrCode(parsedData.id);
        } else {
          // Formato alternativo (tentar outros campos)
          if (parsedData.code) {
            console.log("Verificando QR code com código alternativo:", parsedData.code);
            verifyQrCode(parsedData.code);
          } else {
            toast({
              title: "QR Code inválido",
              description: "Este QR Code não contém um código de pagamento válido.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.log("Não é um JSON válido, tentando como código direto:", data);
        // Se não for um JSON válido, tentar usar como código direto
        verifyQrCode(data);
      }
    }
  };

  // Lidar com erro de escaneamento
  const handleError = (error: Error) => {
    console.error("Erro ao escanear:", error);
    toast({
      title: "Erro ao escanear QR Code",
      description: "Houve um problema ao acessar a câmera. Tente usar o código manual.",
      variant: "destructive",
    });
  };

  // Processar o pagamento
  const processPayment = (paymentType: string) => {
    if (!paymentData || !paymentData.qr_code_id) {
      toast({
        title: "Dados de pagamento inválidos",
        description: "Não foi possível processar o pagamento. Tente escanear novamente.",
        variant: "destructive",
      });
      return;
    }
    
    // Mostrar loading antes de iniciar o processamento
    setLoading(true);
    
    // Converter valores para números explicitamente e garantir precisão
    const amount = parseFloat(paymentData.amount?.toString() || "0");
    
    // Garantir que o valor é um número válido
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor do pagamento é inválido ou não foi informado. Tente escanear novamente.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    // Arredondar para 2 casas decimais para garantir consistência
    const roundedAmount = Math.round(amount * 100) / 100;
    
    console.log("Enviando dados para processamento:", {
      qr_code_id: paymentData.qr_code_id,
      payment_type: paymentType,
      valorOriginal: amount,
      valorArredondado: roundedAmount
    });
    
    // Enviar os dados necessários para processamento
    // Incluindo o tipo de pagamento e dados para o servidor identificar o QR code
    processPaymentMutation.mutate({
      qr_code_id: paymentData.qr_code_id,
      payment_data: paymentData,
      payment_type: paymentType
    }, {
      onError: (error: any) => {
        console.error("Erro ao processar pagamento:", error);
        setLoading(false);
        
        // Verificar se o erro é de saldo insuficiente
        const errorMessage = error.message || "";
        
        if (errorMessage.includes("Saldo insuficiente")) {
          toast({
            title: "Saldo insuficiente",
            description: "Você não tem saldo suficiente na carteira para realizar este pagamento.",
            variant: "destructive",
          });
        } else if (errorMessage.includes("Bônus insuficiente")) {
          toast({
            title: "Bônus insuficiente",
            description: "Você não tem bônus suficiente para realizar este pagamento.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao processar pagamento",
            description: errorMessage || "Ocorreu um erro ao processar o pagamento. Tente novamente.",
            variant: "destructive",
          });
        }
      }
    });
  };

  // Verificar código inserido manualmente
  const checkManualCode = () => {
    if (!manualCode.trim()) {
      toast({
        title: "Código vazio",
        description: "Por favor, insira um código de pagamento válido.",
        variant: "destructive",
      });
      return;
    }
    
    verifyQrCode(manualCode.trim());
  };

  // Cancelar o pagamento
  const cancelPayment = () => {
    setPaymentData(null);
    setScanning(true);
    setManualCode("");
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Função para reiniciar o scanner (usado em caso de erro)
  const resetScanner = () => {
    setScannerKey(Date.now());
  };
  
  // Renderizar o scanner de QR Code ou o resultado
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-lg">Carregando...</p>
        </div>
      );
    }

    if (scanning) {
      return (
        <div className="flex flex-col space-y-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Escaneie o QR Code</CardTitle>
              <CardDescription>
                Aponte a câmera para o QR Code gerado pelo lojista
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-square relative overflow-hidden rounded-md mb-4">
                {/* Usar key para forçar recriação do componente quando houver erro */}
                <QrScanner
                  key={scannerKey}
                  onScan={handleScan}
                  onError={(err) => {
                    handleError(err);
                    // Em caso de erro grave, reiniciar o scanner após 1 segundo
                    setTimeout(resetScanner, 1000);
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Ou insira o código manualmente</CardTitle>
              <CardDescription>
                Se tiver problemas com a câmera, insira o código fornecido pelo lojista
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="code">Código de pagamento</Label>
                  <Input
                    id="code"
                    placeholder="Digite o código aqui"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={checkManualCode} className="w-full">
                Verificar código
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    // Mostrar informações do pagamento
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Confirmar pagamento</CardTitle>
          <CardDescription>
            Detalhes do pagamento a ser realizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Cabeçalho com informações do lojista */}
            <div className="bg-muted/30 rounded-lg p-3 mb-2">
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground mb-1 sm:mb-0">Lojista:</span>
                <span className="font-semibold text-primary">{paymentData?.merchant_name || "Lojista"}</span>
              </div>
            </div>
            
            {/* Valor destacado */}
            <div className="bg-primary/10 rounded-lg p-4 text-center mb-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">Valor a pagar:</span>
                <span className="font-bold text-2xl text-primary">{formatCurrency(paymentData?.amount || 0)}</span>
              </div>
            </div>
            
            {/* Descrição */}
            <div className="bg-muted/30 rounded-lg p-3 mb-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground mb-1">Descrição:</span>
                <span className="text-sm break-words">{paymentData?.description || "Pagamento via Vale Cashback"}</span>
              </div>
            </div>
            
            {/* Opções de pagamento */}
            <div className="border-t pt-4 mt-4">
              <p className="text-center font-medium mb-3">
                Escolha a forma de pagamento:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="w-full py-3" 
                  variant="default"
                  onClick={() => processPayment("wallet")}
                  disabled={processPaymentMutation.isPending}
                >
                  {processPaymentMutation.isPending ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Wallet className="h-5 w-5 mr-2" />
                  )}
                  Pagar com Saldo
                </Button>
                <Button 
                  className="w-full py-3" 
                  variant="outline"
                  onClick={() => processPayment("bonus")}
                  disabled={processPaymentMutation.isPending}
                >
                  {processPaymentMutation.isPending ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5 mr-2" />
                  )}
                  Pagar com Bônus
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="destructive" 
            onClick={cancelPayment}
            disabled={processPaymentMutation.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Pagar com QR Code</h1>
      {renderContent()}
    </div>
  );
}