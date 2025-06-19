import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getDeviceOS, isMobileDevice } from '@/pwaHelpers';

/**
 * Botão de instalação do aplicativo que pode ser incluído em qualquer lugar da UI
 * Agora direcionando para a página de downloads
 */
export function InstallButton() {
  const [location, setLocation] = useLocation();
  
  const handleShowInstallPrompt = () => {
    console.log('Botão de instalação clicado');
    
    // Redirecionamos para a página de downloads em vez de usar os prompts nativos
    setLocation('/downloads');
  };

  return (
    <Button 
      onClick={handleShowInstallPrompt}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Download size={16} />
      Instalar App
    </Button>
  );
}