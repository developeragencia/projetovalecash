import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2, Camera, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { isMobile } from '@/lib/utils';

interface QrScannerProps {
  onScan: (result: string | null) => void;
  onError?: (error: Error) => void;
  style?: React.CSSProperties;
  className?: string;
}

export function QrScanner({ onScan, onError, style, className }: QrScannerProps) {
  // Estado do scanner
  const [status, setStatus] = useState<'waiting' | 'scanning' | 'error'>('waiting');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Referências para controle do scanner
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);
  const scannerContainerId = useRef(`qr-reader-${Date.now()}`);
  const isMountedRef = useRef(true);

  // Configuração simplificada do scanner para melhor compatibilidade
  const qrConfig = {
    fps: 10,
    qrbox: { width: 220, height: 220 },
    aspectRatio: 1.0,
    disableFlip: false,
  };

  // Função para inicializar o scanner com abordagem simplificada
  const initScanner = async () => {
    try {
      // Evitar inicialização se o componente já foi desmontado
      if (!isMountedRef.current || !scannerDivRef.current) return;
      
      // Limpar o contêiner antes de criar novo elemento
      scannerDivRef.current.innerHTML = '';
      
      // Criar elemento para o scanner
      const scannerElement = document.createElement('div');
      scannerElement.id = scannerContainerId.current;
      scannerElement.style.width = '100%';
      scannerElement.style.height = '100%';
      scannerDivRef.current.appendChild(scannerElement);
      
      // Criar instância do scanner
      const html5QrCode = new Html5Qrcode(scannerContainerId.current);
      scannerRef.current = html5QrCode;
      
      // Definir configuração da câmera (para dispositivos móveis usar câmera traseira)
      const cameraConfig = isMobile() 
        ? { facingMode: "environment" } 
        : { facingMode: "user" };
      
      console.log("Iniciando scanner com configuração:", 
        isMobile() ? "câmera traseira (ambiente móvel)" : "câmera padrão (ambiente desktop)");
      
      // Iniciar scanner com configuração simplificada
      await html5QrCode.start(
        cameraConfig,
        qrConfig,
        (decodedText) => {
          if (isMountedRef.current) {
            // Quando um QR code for encontrado, chamar callback
            console.log("QR Code detectado:", decodedText);
            onScan(decodedText);
          }
        },
        // Ignorar mensagens de erro normais durante o scanning
        () => {}
      );
      
      setStatus('scanning');
      console.log("Scanner iniciado com sucesso");
      
    } catch (error) {
      console.error("Erro ao inicializar scanner:", error);
      
      if (isMountedRef.current) {
        setStatus('error');
        setErrorMessage(
          "Não foi possível acessar a câmera. Verifique se você concedeu permissão de câmera ao navegador."
        );
        
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  };

  // Função para parar o scanner com segurança
  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {
          console.log("Scanner já estava parado ou ocorreu erro ao parar");
        });
        scannerRef.current = null;
      }
    } catch (error) {
      console.error("Erro ao parar scanner:", error);
    }
  };

  // Função para reiniciar o scanner após erro
  const restartScanner = async () => {
    setStatus('waiting');
    setErrorMessage('');
    
    try {
      await stopScanner();
      // Pequeno atraso para garantir que tudo seja limpo corretamente
      setTimeout(() => {
        if (isMountedRef.current) {
          initScanner();
        }
      }, 500);
    } catch (error) {
      console.error("Erro ao reiniciar scanner:", error);
    }
  };

  // Inicializar scanner quando o componente for montado
  useEffect(() => {
    isMountedRef.current = true;
    
    // Iniciar scanner com pequeno atraso para evitar problemas de renderização
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        initScanner();
      }
    }, 500);
    
    // Cleanup ao desmontar
    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
      stopScanner();
    };
  }, []);

  return (
    <div 
      className={`qr-scanner-wrapper relative ${className || ''}`}
      style={{
        overflow: 'hidden',
        borderRadius: '0.5rem',
        width: '100%',
        ...style
      }}
    >
      {/* Contêiner do scanner */}
      <div 
        ref={scannerDivRef}
        data-testid="qr-reader"
        style={{ 
          width: '100%', 
          height: '300px',
          background: '#000',
          position: 'relative'
        }} 
      />
      
      {/* Status: Carregando */}
      {status === 'waiting' && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-foreground">Iniciando câmera...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Permita o acesso à câmera quando solicitado
            </p>
          </div>
        </div>
      )}
      
      {/* Status: Erro */}
      {status === 'error' && (
        <div className="absolute inset-0 bg-background/90 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <AlertCircle className="h-10 w-10 mx-auto mb-4 text-destructive" />
            <h3 className="font-medium text-lg mb-2">Erro ao acessar câmera</h3>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <Button onClick={restartScanner} className="mx-auto" variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      )}
      
      {/* Informação durante escaneamento */}
      {status === 'scanning' && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="bg-background/70 p-2 rounded-full backdrop-blur-sm">
            <Camera className="h-5 w-5 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}