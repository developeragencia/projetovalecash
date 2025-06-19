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
  const [cameras, setCameras] = useState<{id: string, label: string}[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  
  // Referências
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const scannerContainerId = useRef(`qr-container-${Date.now()}`);
  
  // Configurações do scanner
  const qrConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1,
  };
  
  // Função para limpar recursos do scanner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        // Tentar parar o scanner independentemente do estado
        await scannerRef.current.stop().catch(err => {
          console.log('Scanner já estava parado ou ocorreu erro:', err);
        });
        console.log('Scanner stopped successfully');
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
  };
  
  // Função para criar o elemento do scanner
  const createScannerElement = () => {
    if (!scannerDivRef.current) return null;
    
    // Limpar qualquer conteúdo anterior
    scannerDivRef.current.innerHTML = '';
    
    // Criar novo elemento para o scanner
    const newElement = document.createElement('div');
    newElement.id = scannerContainerId.current;
    newElement.style.width = '100%';
    newElement.style.height = '100%';
    
    // Adicionar ao contêiner
    scannerDivRef.current.appendChild(newElement);
    
    return newElement;
  };
  
  // Função para iniciar o processo de escaneamento
  const startScanner = async (cameraId?: string) => {
    try {
      // Limpar scanner anterior
      await stopScanner();
      
      // Verificar se o componente ainda está montado
      if (!isMountedRef.current) return;
      
      // Criar elemento do scanner se necessário
      const element = createScannerElement();
      if (!element) {
        throw new Error('Não foi possível criar elemento do scanner');
      }
      
      // Criar nova instância do scanner
      const scanner = new Html5Qrcode(scannerContainerId.current);
      scannerRef.current = scanner;
      
      setStatus('scanning');
      
      // Configurar camera
      const cameraConfig = cameraId 
        ? { deviceId: { exact: cameraId } } 
        : { facingMode: 'environment' };
        
      // Iniciar scanner
      await scanner.start(
        cameraConfig,
        qrConfig,
        (decodedText) => {
          if (isMountedRef.current) {
            console.log('QR Code detectado:', decodedText);
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          // Este callback é para mensagens de erro não críticas
          console.log('Scanner message:', errorMessage);
        }
      );
      
      console.log('Scanner iniciado com sucesso');
    } catch (error) {
      if (!isMountedRef.current) return;
      
      console.error('Erro ao iniciar scanner:', error);
      setStatus('error');
      setErrorMessage('Erro ao acessar a câmera. Verifique as permissões do navegador.');
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };
  
  // Função para buscar e configurar câmeras disponíveis
  const setupCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!isMountedRef.current) return;
      
      if (devices && devices.length > 0) {
        setCameras(devices);
        
        // Tentar identificar câmera traseira para dispositivos móveis
        if (isMobile()) {
          console.log('Dispositivo móvel detectado, procurando câmera traseira');
          
          // Tentar encontrar câmera traseira por nome
          const rearCamera = devices.find(camera => {
            const label = camera.label.toLowerCase();
            return label.includes('back') || 
                  label.includes('rear') || 
                  label.includes('environment') || 
                  label.includes('traseira');
          });
          
          // Se encontrar câmera traseira ou houver mais de uma câmera, usar a última (geralmente traseira)
          if (rearCamera) {
            console.log('Câmera traseira encontrada:', rearCamera.label);
            setSelectedCamera(rearCamera.id);
            startScanner(rearCamera.id);
          } else if (devices.length > 1) {
            console.log('Múltiplas câmeras encontradas, usando a última');
            setSelectedCamera(devices[devices.length - 1].id);
            startScanner(devices[devices.length - 1].id);
          } else {
            console.log('Usando câmera única disponível');
            setSelectedCamera(devices[0].id);
            startScanner(devices[0].id);
          }
        } else {
          // Para desktop, usar primeira câmera disponível
          console.log('Desktop detectado, usando primeira câmera');
          setSelectedCamera(devices[0].id);
          startScanner(devices[0].id);
        }
      } else {
        // Nenhuma câmera encontrada, tentar com facingMode
        console.log('Nenhuma câmera listável encontrada, tentando com facingMode');
        startScanner();
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      
      console.error('Erro ao configurar câmeras:', error);
      setStatus('error');
      setErrorMessage('Não foi possível acessar as câmeras do dispositivo');
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };
  
  // Função para alternar câmera
  const switchCamera = (cameraId: string) => {
    if (cameraId === selectedCamera) return;
    
    setSelectedCamera(cameraId);
    startScanner(cameraId);
  };
  
  // Função para reiniciar scanner após erro
  const restartScanner = () => {
    setStatus('waiting');
    setErrorMessage('');
    setupCameras();
  };
  
  // Inicializar scanner ao montar componente
  useEffect(() => {
    isMountedRef.current = true;
    setupCameras();
    
    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, []);
  
  // Renderização condicional com base no status
  return (
    <div className={`qr-scanner-wrapper relative ${className || ''}`}
      style={{
        overflow: 'hidden',
        borderRadius: '0.5rem',
        width: '100%',
        ...style
      }}>
      
      {/* Área do scanner */}
      <div 
        ref={scannerDivRef}
        style={{ 
          width: '100%', 
          height: '300px',
          background: '#000'
        }} 
      />
      
      {/* Overlay de status */}
      {status === 'waiting' && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p>Inicializando câmera...</p>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="absolute inset-0 bg-background/90 flex items-center justify-center p-4">
          <div className="text-center max-w-xs">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <p className="mb-4">{errorMessage}</p>
            <Button onClick={restartScanner}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      )}
      
      {/* Seletor de câmera */}
      {status === 'scanning' && cameras.length > 1 && (
        <div className="absolute top-2 right-2 z-10">
          <select
            className="p-1 text-xs rounded-md bg-background/80 border"
            value={selectedCamera}
            onChange={(e) => switchCamera(e.target.value)}
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Câmera ${camera.id.slice(0, 4)}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}