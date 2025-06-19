import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQRCode } from "@/hooks/use-qr-code";
import { 
  Camera, 
  CameraOff, 
  Info, 
  AlertCircle, 
  Check, 
  X, 
  QrCode,
  RefreshCw,
  User,
  Clock,
  CreditCard,
  BadgePercent,
  Mail
} from "lucide-react";

// Simulação de um serviço de scanner QR
// Em um cenário real, usaríamos uma biblioteca como react-qr-reader
// ou integração com a câmera nativa
function useQrScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<boolean>(false);
  
  const startScanner = () => {
    setError(null);
    
    // Simular verificação de permissões de câmera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setPermission(true);
          setScanning(true);
        })
        .catch((err) => {
          setError("Permissão de câmera negada. Por favor, conceda acesso à câmera para escanear QR codes.");
          setScanning(false);
        });
    } else {
      setError("Seu navegador não suporta acesso à câmera. Tente usar outro navegador.");
      setScanning(false);
    }
  };
  
  const stopScanner = () => {
    setScanning(false);
  };
  
  return {
    scanning,
    error,
    permission,
    startScanner,
    stopScanner
  };
}

interface QrScannerProps {
  onScan: (data: string) => void;
  scanning: boolean;
}

function QrScanner({ onScan, scanning }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fakeScanActive, setFakeScanActive] = useState(false);
  
  // Simulação de escanear um QR code após alguns segundos
  useEffect(() => {
    if (scanning) {
      setFakeScanActive(true);
      const timer = setTimeout(() => {
        // Simular detecção de QR code com dados de cliente
        const mockQrData = JSON.stringify({
          type: "customer",
          id: 123,
          name: "Maria Silva",
          email: "maria@example.com",
          wallet_id: "WALLET123"
        });
        onScan(mockQrData);
        setFakeScanActive(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [scanning, onScan]);
  
  return (
    <div className="relative">
      {/* Preview da câmera (simulado) */}
      <div 
        className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center overflow-hidden"
        style={{ minHeight: "300px" }}
      >
        {scanning ? (
          fakeScanActive ? (
            <div className="relative w-full h-full">
              {/* Isso seria um vídeo real em uma implementação completa */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900"></div>
              
              {/* Sobreposição de scan */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-64 h-64 border-2 border-white/50 rounded-lg"></div>
                  <div className="absolute top-0 left-0 w-64 h-64">
                    <div className="w-16 h-2 bg-green-500 absolute top-0 left-0 animate-[scanline_2s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              </div>
              
              {/* Texto de ajuda */}
              <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                <p>Posicione o QR code dentro da área</p>
              </div>
            </div>
          ) : (
            <div className="text-white flex flex-col items-center">
              <Camera className="h-12 w-12 mb-2 opacity-50" />
              <p>Câmera inicializando...</p>
            </div>
          )
        ) : (
          <div className="text-white flex flex-col items-center">
            <CameraOff className="h-12 w-12 mb-2 opacity-50" />
            <p>Câmera desativada</p>
          </div>
        )}
      </div>
      
      {/* Barra de scanner (efeito animado) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanline {
          0% {
            top: 0;
          }
          50% {
            top: calc(100% - 8px);
          }
          100% {
            top: 0;
          }
        }
      `}} />
    </div>
  );
}

// Componente para entrada manual de código QR
interface ManualEntryProps {
  onSubmit: (code: string) => void;
  isProcessing: boolean;
}

function ManualEntry({ onSubmit, isProcessing }: ManualEntryProps) {
  const [code, setCode] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmit(code);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="qr-code">Código QR</Label>
        <Input
          id="qr-code"
          placeholder="Digite o código QR manualmente"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isProcessing}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!code.trim() || isProcessing}
      >
        {isProcessing ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <QrCode className="h-4 w-4 mr-2" />
            Processar Código
          </>
        )}
      </Button>
    </form>
  );
}

// Componente para exibir resultados do scan
interface ScanResultProps {
  result: any;
  onReset: () => void;
  onProceed: () => void;
  isProcessing: boolean;
}

function ScanResult({ result, onReset, onProceed, isProcessing }: ScanResultProps) {
  if (!result) return null;
  
  const isCustomer = result.type === "customer";
  const isPayment = result.type === "payment";
  
  return (
    <div className="space-y-4">
      <div className="flex items-center mb-2">
        <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
          <Check className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-medium text-lg">QR Code Válido</h3>
          <p className="text-sm text-muted-foreground">
            {isCustomer 
              ? "Cliente identificado com sucesso!" 
              : isPayment 
                ? "Pagamento identificado com sucesso!"
                : "Código processado com sucesso!"}
          </p>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {isCustomer && (
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-5 w-5 text-primary mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{result.name}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-primary mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{result.email}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-primary mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Carteira</p>
                  <p>{result.wallet_id}</p>
                </div>
              </div>
            </div>
          )}
          
          {isPayment && (
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-5 w-5 text-primary mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{result.customer_name}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-primary mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium">R$ {result.amount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-primary mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p>{result.date}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <BadgePercent className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Cashback</p>
                  <p className="text-green-600">R$ {result.cashback.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex space-x-3">
        <Button 
          variant="outline" 
          onClick={onReset} 
          className="flex-1"
          disabled={isProcessing}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        
        <Button 
          onClick={onProceed} 
          className="flex-1"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {isCustomer ? "Registrar Venda" : isPayment ? "Confirmar Pagamento" : "Continuar"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Componente principal do scanner
export default function MerchantScanner() {
  const [activeTab, setActiveTab] = useState("camera");
  const [scanResult, setScanResult] = useState<any>(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  const { toast } = useToast();
  
  const { scanning, error, permission, startScanner, stopScanner } = useQrScanner();
  
  // Utilizando o hook useQRCode para processar QR codes
  const { processQrCode } = useQRCode({
    onSuccess: (data) => {
      setScanResult(data);
      stopScanner();
      toast({
        title: "QR Code processado",
        description: "Código QR verificado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar QR Code",
        description: error.message || "O código QR não pôde ser processado. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  const processQrMutation = useMutation({
    mutationFn: (qrData: string) => {
      // Agora encaminhamos para nosso hook useQRCode que faz a chamada API real
      return processQrCode(qrData);
    },
    onError: () => {
      toast({
        title: "Erro ao processar QR Code",
        description: "O código QR não pôde ser processado. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  const handleScan = (data: string) => {
    if (data) {
      processQrMutation.mutate(data);
    }
  };
  
  const handleManualEntry = (code: string) => {
    processQrMutation.mutate(code);
  };
  
  const handleReset = () => {
    setScanResult(null);
    setProcessingComplete(false);
    
    if (activeTab === "camera") {
      startScanner();
    }
  };
  
  const handleProceed = () => {
    // Simular processamento
    setProcessingComplete(true);
    
    // Dependendo do tipo de QR escaneado, tomamos ações diferentes
    if (scanResult.type === "customer") {
      // Redirecionar para página de vendas com o cliente pré-selecionado
      setTimeout(() => {
        window.location.href = `/merchant/sales?customer=${scanResult.id}`;
      }, 1500);
    } else if (scanResult.type === "payment") {
      // Registrar confirmação de pagamento
      setTimeout(() => {
        toast({
          title: "Pagamento confirmado",
          description: `Pagamento de R$ ${scanResult.amount.toFixed(2)} confirmado com sucesso.`,
        });
        handleReset();
      }, 1500);
    } else {
      // Código genérico
      setTimeout(() => {
        toast({
          title: "Código processado",
          description: "O código QR foi processado com sucesso.",
        });
        handleReset();
      }, 1500);
    }
  };
  
  // Iniciar scanner ao carregar ou trocar para aba da câmera
  useEffect(() => {
    if (activeTab === "camera" && !scanResult) {
      startScanner();
    } else if (activeTab !== "camera" || scanResult) {
      stopScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [activeTab, scanResult]);
  
  return (
    <DashboardLayout title="Scanner QR Code" type="merchant">
      <Card>
        <CardHeader>
          <CardTitle>Scanner QR Code Vale Cashback</CardTitle>
          <CardDescription>
            Escaneie códigos QR para identificar clientes ou confirmar pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scanResult ? (
            <ScanResult 
              result={scanResult} 
              onReset={handleReset} 
              onProceed={handleProceed}
              isProcessing={processingComplete}
            />
          ) : (
            <div>
              <Tabs defaultValue="camera" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="camera">
                    <Camera className="h-4 w-4 mr-2" />
                    Câmera
                  </TabsTrigger>
                  <TabsTrigger value="manual">
                    <QrCode className="h-4 w-4 mr-2" />
                    Entrada Manual
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="camera">
                  {error ? (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 mb-4">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Alerta de Câmera</h4>
                          <p className="text-sm text-yellow-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <QrScanner onScan={handleScan} scanning={scanning} />
                  )}
                  
                  {!error && permission && !scanning && (
                    <div className="mt-4 flex justify-center">
                      <Button onClick={startScanner}>
                        <Camera className="h-4 w-4 mr-2" />
                        Ativar Câmera
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="manual">
                  <ManualEntry 
                    onSubmit={handleManualEntry}
                    isProcessing={processQrMutation.isPending}
                  />
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 border-t pt-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Como usar o Scanner QR</h4>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <span className="mr-2">1.</span>
                        <span>Para identificar um cliente, peça que ele mostre o código QR do aplicativo Vale Cashback.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">2.</span>
                        <span>Para confirmar um pagamento em cashback, escaneie o QR de pagamento gerado pelo cliente.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">3.</span>
                        <span>Se a câmera não funcionar, utilize a aba "Entrada Manual" para digitar o código.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}