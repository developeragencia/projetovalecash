import React, { useEffect, useState } from 'react';
import { getDeviceOS, isMobileDevice } from '@/pwaHelpers';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { Link } from 'wouter';
import { LogoIcon } from '@/components/ui/icons';

export function MobileAppInstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [hasClosedBanner, setHasClosedBanner] = useState(false);
  const deviceOS = getDeviceOS();
  const isMobile = isMobileDevice();
  
  // Determina se deve mostrar o banner com base no dispositivo e histórico de interação
  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('app_banner_closed');
    const timeLastClosed = localStorage.getItem('app_banner_closed_time');
    const now = new Date().getTime();
    
    // Se está em um celular e não fechou o banner nas últimas 24 horas ou nunca viu
    if (isMobile && (
      !hasSeenPrompt || 
      (timeLastClosed && now - parseInt(timeLastClosed) > 24 * 60 * 60 * 1000)
    )) {
      // Atrasa a exibição do banner em 2 segundos para não aparecer imediatamente
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile]);
  
  const closeBanner = () => {
    setShowBanner(false);
    setHasClosedBanner(true);
    localStorage.setItem('app_banner_closed', 'true');
    localStorage.setItem('app_banner_closed_time', new Date().getTime().toString());
  };
  
  // Não renderiza nada se não for dispositivo móvel ou se o banner estiver fechado
  if (!isMobile || !showBanner || hasClosedBanner) {
    return null;
  }
  
  // Determina a mensagem apropriada com base no sistema operacional
  const getMessage = () => {
    if (deviceOS === 'android') {
      return {
        title: 'Baixe o app para Android',
        description: 'Melhor experiência, mais rápido e sem anúncios!'
      };
    } else if (deviceOS === 'ios') {
      return {
        title: 'Baixe o app para iPhone',
        description: 'Melhor experiência no seu iPhone, sem anúncios!'
      };
    } else {
      return {
        title: 'Baixe nosso aplicativo',
        description: 'Melhor experiência em seu dispositivo!'
      };
    }
  };
  
  const message = getMessage();
  
  // Define a URL para download direto com base no sistema operacional
  const getDirectDownloadUrl = () => {
    // Usamos a URL da página de downloads para todos os dispositivos
    // O link direto foi atualizado para garantir que o usuário possa acessar informações completas
    return '/downloads';
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary text-white p-4 z-50 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-center space-x-3">
          <div className="rounded-full bg-white p-2 w-12 h-12 flex items-center justify-center">
            <LogoIcon className="w-10 h-10 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg">{message.title}</h3>
            <p className="text-sm text-white opacity-85">{message.description}</p>
          </div>
        </div>
        
        <button 
          onClick={closeBanner} 
          className="text-white hover:text-blue-200"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <Link href="/downloads" className="flex-1">
          <Button 
            className="w-full bg-white text-primary hover:bg-blue-50 font-bold"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Agora
          </Button>
        </Link>
        
        {deviceOS === 'android' && (
          <a 
            href="https://play.google.com/store/apps/details?id=com.valecashback.app" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button 
              variant="outline" 
              className="w-full border-white text-white hover:bg-blue-700"
            >
              Play Store
            </Button>
          </a>
        )}
        
        {deviceOS === 'ios' && (
          <a 
            href="https://apps.apple.com/app/vale-cashback/id123456789" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button 
              variant="outline" 
              className="w-full border-white text-white hover:bg-blue-700"
            >
              App Store
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}