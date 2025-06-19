import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallButton: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOSDevice, setIsIOSDevice] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Verificar se é um dispositivo iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSDevice(isIOS);

    // Verificar se o app já está instalado
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone;
    setIsInstalled(isInStandaloneMode);

    // Capturar evento de instalação para Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    }
  };

  const handleIOSInstall = () => {
    alert('Para instalar:\n1. Toque no ícone de compartilhamento ↑\n2. Role e toque em "Adicionar à Tela de Início"\n3. Confirme tocando em "Adicionar"');
  };

  if (isInstalled) {
    return null; // Não mostrar botão se já estiver instalado
  }

  return (
    <>
      {installPrompt && (
        <Button 
          onClick={handleInstallClick}
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
        >
          <Download size={18} />
          Instalar App
        </Button>
      )}

      {isIOSDevice && !installPrompt && (
        <Button 
          onClick={handleIOSInstall}
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
        >
          <Smartphone size={18} />
          Como Instalar
        </Button>
      )}
    </>
  );
};

export default PWAInstallButton;