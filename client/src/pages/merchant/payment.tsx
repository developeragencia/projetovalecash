import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  XCircle,
  ArrowLeft, 
  Download,
  Receipt,
  QrCode,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function MerchantPaymentDetail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams();
  const paymentId = params.id;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Obtém os detalhes do pagamento
  const { data: payment, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/merchant/payment', paymentId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/merchant/payment/${paymentId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error("Não foi possível carregar os detalhes do pagamento");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Erro ao carregar detalhes do pagamento:", error);
        throw error;
      }
    },
    enabled: !!paymentId,
    refetchInterval: 5000, // Atualiza a cada 5 segundos enquanto a página estiver aberta
  });

  // Função para atualizar os dados manualmente
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Atualizado",
        description: "Dados do pagamento atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Função para voltar à página anterior
  const handleGoBack = () => {
    setLocation("/merchant/dashboard");
  };

  // Função para enviar recibo por e-mail
  const handleSendReceipt = () => {
    toast({
      title: "Recibo enviado",
      description: "O recibo foi enviado ao cliente por e-mail.",
    });
  };

  // Renderiza o status do pagamento
  const renderStatus = (status: string) => {
    switch(status) {
      case "completed":
      case "success":
      case "approved":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-4 h-4 mr-1" /> Aprovado
          </Badge>
        );
      case "pending":
      case "waiting":
        return (
          <Badge className="bg-orange-500 text-white">
            <Clock className="w-4 h-4 mr-1" /> Pendente
          </Badge>
        );
      case "failed":
      case "declined":
      case "error":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="w-4 h-4 mr-1" /> Recusado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white">
            <AlertCircle className="w-4 h-4 mr-1" /> Desconhecido
          </Badge>
        );
    }
  };

  // Renderiza o método de pagamento
  const renderPaymentMethod = (method: string) => {
    switch(method) {
      case "cash":
        return "Dinheiro";
      case "credit_card":
        return "Cartão de Crédito";
      case "debit_card":
        return "Cartão de Débito";
      case "wallet":
        return "Carteira Digital";
      case "bonus":
        return "Bônus/Cashback";
      default:
        return method || "Desconhecido";
    }
  };

  return (
    <DashboardLayout title="Detalhes do Pagamento" type="merchant">
      <div className="container max-w-3xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button onClick={handleGoBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold ml-4">Detalhes do Pagamento</h1>
          <Button onClick={handleRefresh} variant="ghost" size="sm" className="ml-auto" disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {isLoading ? (
          <Card className="w-full p-8">
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2">Carregando detalhes do pagamento...</span>
            </div>
          </Card>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os detalhes do pagamento. Tente novamente.
            </AlertDescription>
          </Alert>
        ) : !payment ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Pagamento não encontrado</AlertTitle>
            <AlertDescription>
              Não encontramos os detalhes deste pagamento. Ele pode ter sido removido ou o ID está incorreto.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Alerta de status */}
            {payment.status === "completed" || payment.status === "success" || payment.status === "approved" ? (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800">Pagamento aprovado</AlertTitle>
                <AlertDescription className="text-green-700">
                  Este pagamento foi processado com sucesso.
                </AlertDescription>
              </Alert>
            ) : payment.status === "pending" || payment.status === "waiting" ? (
              <Alert className="mb-6 bg-orange-50 border-orange-200">
                <Clock className="h-5 w-5 text-orange-600" />
                <AlertTitle className="text-orange-800">Pagamento pendente</AlertTitle>
                <AlertDescription className="text-orange-700">
                  Este pagamento ainda está sendo processado.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mb-6 bg-red-50 border-red-200" variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertTitle>Pagamento não aprovado</AlertTitle>
                <AlertDescription>
                  Este pagamento foi recusado ou ocorreu um erro no processamento.
                </AlertDescription>
              </Alert>
            )}

            {/* Detalhes do pagamento */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Informações da Transação</CardTitle>
                <CardDescription>
                  Detalhes completos desta transação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">ID da Transação</p>
                      <p className="text-lg font-medium">{payment.id || paymentId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Valor</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <div className="mt-1">{renderStatus(payment.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Método de Pagamento</p>
                      <p className="text-lg">{renderPaymentMethod(payment.payment_method || payment.paymentMethod)}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data/Hora</p>
                      <p className="text-lg">{formatDate(payment.created_at || payment.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Cliente</p>
                      <p className="text-lg">{payment.client_name || payment.customer || "Cliente não identificado"}</p>
                    </div>
                    {payment.cashback && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cashback Gerado</p>
                        <p className="text-lg text-primary">{formatCurrency(payment.cashback)}</p>
                      </div>
                    )}
                    {payment.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Descrição</p>
                        <p className="text-lg">{payment.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Button variant="outline" onClick={handleSendReceipt}>
                    <Receipt className="w-4 h-4 mr-2" /> Enviar Recibo
                  </Button>
                  <Button onClick={() => setLocation("/merchant/payment-qr")}>
                    <QrCode className="w-4 h-4 mr-2" /> Gerar Novo QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Itens da transação (se houver) */}
            {payment.items && payment.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Itens da Compra</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-2 text-left font-medium">Produto</th>
                          <th className="px-4 py-2 text-right font-medium">Qtd</th>
                          <th className="px-4 py-2 text-right font-medium">Preço</th>
                          <th className="px-4 py-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payment.items.map((item: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-3">{item.name || item.product_name}</td>
                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-4 py-3 text-right font-medium">Total</td>
                          <td className="px-4 py-3 text-right font-bold">{formatCurrency(payment.amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}