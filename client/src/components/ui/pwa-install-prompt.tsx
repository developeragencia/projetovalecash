import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { isMobileDevice, getDeviceOS } from '@/pwaHelpers';
import { Download, X, Smartphone, ChevronRight, Chrome } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Variável global para armazenar o evento de instalação
let deferredPrompt: any = null;
// Variável para forçar instalação em navegadores que não emitem beforeinstallprompt
let forceInstallable = true;

// Disponibiliza a referência para uso global (necessário para iOS e alguns browsers Android)
(window as any).deferredPromptGlobal = deferredPrompt;

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installable, setInstallable] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [deviceOS, setDeviceOS] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    console.log('PWAInstallPrompt: Inicializando componente');
    // Reseta status no localStorage para garantir que sempre funcione
    localStorage.removeItem('pwa-install-dismissed');
    
    // Define como instalável por padrão 
    forceInstallable = true;
    setInstallable(true);
    
    // Detecta o sistema operacional
    const os = getDeviceOS();
    setDeviceOS(os);
    console.log('PWAInstallPrompt: Sistema operacional detectado:', os);
    
    // Verificar se o app já está instalado
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
    
    if (isAppInstalled) {
      console.log('PWAInstallPrompt: App já está instalado como PWA, não exibindo prompt');
      return; // Não mostra o prompt se já estiver instalado
    }

    // Obtém o valor de showPromptForced do localStorage ou URL
    const params = new URLSearchParams(window.location.search);
    const forceShowPrompt = params.get('showInstall') === 'true' || 
                            localStorage.getItem('force-pwa-install') === 'true';
    
    if (forceShowPrompt) {
      console.log('PWAInstallPrompt: Exibição forçada do prompt');
      setShowPrompt(true);
      // Limpa o parâmetro da URL sem recarregar a página
      if (params.get('showInstall') === 'true') {
        params.delete('showInstall');
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
      }
    } else {
      // Depois de 2 segundos, mostra o banner de instalação (para dar tempo de carregar a página)
      console.log('PWAInstallPrompt: Agendando exibição do prompt em 2 segundos');
      const timer = setTimeout(() => {
        console.log('PWAInstallPrompt: Exibindo prompt após timeout');
        setShowPrompt(true);
      }, 2000);
    }
    
    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Previne que o Chrome mostre o prompt nativo
      e.preventDefault();
      // Armazena o evento para uso posterior
      console.log('PWAInstallPrompt: BeforeInstallPrompt capturado!', e);
      deferredPrompt = e;
      // Define a variável global para o evento
      (window as any).deferredPromptGlobal = deferredPrompt;
      setInstallable(true);
      
      // Sempre mostra o banner quando o evento é capturado
      setShowPrompt(true);
    };
    
    // Detecta quando o app é instalado
    const handleAppInstalled = () => {
      console.log('PWAInstallPrompt: App instalado com sucesso!');
      setShowPrompt(false);
      setShowDialog(false);
      deferredPrompt = null;
    };
    
    // Adiciona um listener para mostrar o banner por interação do usuário
    const handleUserInteraction = () => {
      if (!showPrompt && !isAppInstalled && !dismissed) {
        const isUserSession = localStorage.getItem('user-session-started');
        if (isUserSession) {
          console.log('PWAInstallPrompt: Exibindo prompt após interação do usuário');
          setShowPrompt(true);
          // Remove o listener após mostrar o banner
          document.removeEventListener('click', handleUserInteraction);
        } else {
          localStorage.setItem('user-session-started', 'true');
        }
      }
    };
    
    // Registra os event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('click', handleUserInteraction);
    
    // Força mostrar o banner após 5 segundos se o usuário estiver logado
    const isLoggedIn = document.cookie.includes('connect.sid');
    if (isLoggedIn) {
      const timerForced = setTimeout(() => {
        if (!showPrompt && !dismissed && !isAppInstalled) {
          console.log('PWAInstallPrompt: Forçando exibição do prompt após 5s para usuário logado');
          setShowPrompt(true);
        }
      }, 5000);
      
      return () => {
        clearTimeout(timerForced);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        document.removeEventListener('click', handleUserInteraction);
      };
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, [showPrompt, dismissed]);
  
  // Função para instalar o aplicativo diretamente (Chrome/Android)
  const handleNativeInstall = async () => {
    console.log('Tentando instalar app PWA nativamente...');
    
    if (deferredPrompt) {
      try {
        // Mostra o prompt de instalação nativo
        deferredPrompt.prompt();
        
        // Espera pela resposta do usuário
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
        
        // Se o usuário aceitou, esconde tudo
        if (outcome === 'accepted') {
          setShowPrompt(false);
          setShowDialog(false);
        }
      } catch (error) {
        console.error('Erro no prompt de instalação:', error);
      }
      
      // Limpa a referência ao prompt - só pode ser usado uma vez
      deferredPrompt = null;
    } else {
      // Se não temos o prompt nativo, abrimos o diálogo com instruções
      setShowDialog(true);
    }
  };
  
  // Força a instalação através de um botão em outro lugar da UI
  const forceShowInstallBanner = () => {
    setShowPrompt(true);
    setDismissed(false);
  };
  
  // Expõe a função para o window para poder ser chamada de qualquer lugar
  useEffect(() => {
    (window as any).showInstallBanner = forceShowInstallBanner;
  }, []);
  
  // Função para fechar o banner
  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
  };
  
  // Função que abre o diálogo de instruções
  const handleShowInstructions = () => {
    setShowDialog(true);
    setShowPrompt(false);
  };
  
  // Se foi dispensado pelo usuário, não mostra nada
  if (dismissed) return null;
  
  // Se não tem nada para mostrar (nem o prompt nem o diálogo), não mostra nada  
  if (!showPrompt && !showDialog) return null;
  
  const isIOS = deviceOS === 'ios';
  const isAndroid = deviceOS === 'android';
  const defaultTab = isIOS ? 'ios' : (isAndroid ? 'android' : 'desktop');
  
  // Componente de diálogo com instruções detalhadas
  const InstallDialog = () => (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Instale o Vale Cashback no seu dispositivo
          </DialogTitle>
          <DialogDescription>
            Siga as instruções abaixo para instalar o aplicativo no seu dispositivo.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ios" className="flex items-center gap-1">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.4 1.4C13.4 1.4 12.7 3.2 10.7 3.2C8.6 3.2 6.7 1.4 4.6 1.4C2.5 1.4 0 3.2 0 7.3C0 11.3 4.4 17.7 7.8 17.7C9.7 17.7 10.6 16.3 12.8 16.3C14.9 16.3 15.7 17.7 17.7 17.7C20.6 17.7 24 12.7 24 7.3C23.9 3.2 21.6 1.4 16.4 1.4Z" fill="currentColor"/>
                <path d="M14.4 0C13.8 0.9 13.5 2 13.5 3.2C13.5 5.5 14.5 7.5 16.1 8.5C16.6 7.6 17 6.5 17 5.2C17 2.9 15.9 0.9 14.4 0Z" fill="currentColor"/>
              </svg>
              iOS
            </TabsTrigger>
            <TabsTrigger value="android" className="flex items-center gap-1">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5051 7.46332V16.0916C17.5051 16.6139 17.0834 17.0355 16.5611 17.0355H15.9508V20.1866C15.9508 21.1888 15.1392 22.0004 14.137 22.0004C13.1348 22.0004 12.3232 21.1888 12.3232 20.1866V17.0355H11.6763V20.1866C11.6763 21.1888 10.8647 22.0004 9.86248 22.0004C8.86029 22.0004 8.04868 21.1888 8.04868 20.1866V17.0355H7.43844C6.9161 17.0355 6.49448 16.6139 6.49448 16.0916V7.46332H17.5051ZM3.94752 7.46332C4.94971 7.46332 5.76133 8.27493 5.76133 9.27712V14.2778C5.76133 15.28 4.94971 16.0916 3.94752 16.0916C2.94533 16.0916 2.13372 15.28 2.13372 14.2778V9.27712C2.13372 8.27493 2.94533 7.46332 3.94752 7.46332ZM20.0521 7.46332C21.0543 7.46332 21.8659 8.27493 21.8659 9.27712V14.2778C21.8659 15.28 21.0543 16.0916 20.0521 16.0916C19.0499 16.0916 18.2383 15.28 18.2383 14.2778V9.27712C18.2383 8.27493 19.0499 7.46332 20.0521 7.46332ZM15.2316 2.06026L16.6212 0.67067C16.8134 0.47845 16.8134 0.167814 16.6212 -0.0244027C16.429 -0.21662 16.1183 -0.21662 15.9261 -0.0244027L14.3774 1.52423C13.6309 1.17866 12.8316 0.986877 11.9995 0.986877C11.1679 0.986877 10.3685 1.17866 9.62201 1.52423L8.07331 -0.0244027C7.88109 -0.21662 7.57046 -0.21662 7.37824 -0.0244027C7.18602 0.167814 7.18602 0.47845 7.37824 0.67067L8.76783 2.06026C7.35429 3.11171 6.44138 4.79525 6.44138 6.67903C6.44138 6.74057 6.44285 6.8016 6.44529 6.86212H17.5542C17.5566 6.8016 17.5581 6.74057 17.5581 6.67903C17.5581 4.79525 16.6452 3.11171 15.2316 2.06026ZM9.86248 4.25424C9.50757 4.25424 9.21983 3.9665 9.21983 3.61159C9.21983 3.25668 9.50757 2.96895 9.86248 2.96895C10.2174 2.96895 10.5051 3.25668 10.5051 3.61159C10.5051 3.9665 10.2174 4.25424 9.86248 4.25424ZM14.137 4.25424C13.7821 4.25424 13.4944 3.9665 13.4944 3.61159C13.4944 3.25668 13.7821 2.96895 14.137 2.96895C14.4919 2.96895 14.7797 3.25668 14.7797 3.61159C14.7797 3.9665 14.4919 4.25424 14.137 4.25424Z" fill="currentColor"/>
              </svg>
              Android
            </TabsTrigger>
            <TabsTrigger value="desktop">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 8H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Desktop
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ios" className="pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <h4 className="text-sm font-medium">Abra o site no Safari</h4>
                  <p className="text-sm text-muted-foreground mt-1">O Vale Cashback só pode ser instalado usando o navegador Safari no iOS.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <h4 className="text-sm font-medium">Toque no botão de compartilhamento</h4>
                  <p className="text-sm text-muted-foreground mt-1">Toque no ícone de compartilhamento <span className="inline-block border rounded-md px-2 py-1">&#x2BAD;</span> na parte inferior (iPhone) ou superior (iPad) do navegador.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <h4 className="text-sm font-medium">Adicione à tela de início</h4>
                  <p className="text-sm text-muted-foreground mt-1">Role para baixo e toque em "Adicionar à Tela de Início" e confirme tocando em "Adicionar".</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">4</div>
                <div>
                  <h4 className="text-sm font-medium">Abra o aplicativo</h4>
                  <p className="text-sm text-muted-foreground mt-1">Toque no ícone do Vale Cashback na sua tela de início para abrir o aplicativo.</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="android" className="pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <h4 className="text-sm font-medium">Abra o site no Chrome</h4>
                  <p className="text-sm text-muted-foreground mt-1">Para melhor experiência, use o Google Chrome para instalar o Vale Cashback.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <h4 className="text-sm font-medium">Toque no menu</h4>
                  <p className="text-sm text-muted-foreground mt-1">Toque no menu (três pontos) no canto superior direito do Chrome.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <h4 className="text-sm font-medium">Instale o aplicativo</h4>
                  <p className="text-sm text-muted-foreground mt-1">Selecione "Instalar aplicativo" ou "Adicionar à tela inicial" e confirme a instalação.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">4</div>
                <div>
                  <h4 className="text-sm font-medium">Abra o aplicativo</h4>
                  <p className="text-sm text-muted-foreground mt-1">Abra o Vale Cashback a partir do ícone na sua tela inicial.</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => window.location.href = `/?install=true&t=${Date.now()}`}
              className="w-full mt-4 flex items-center justify-center gap-2"
              variant="default"
            >
              <Chrome size={16} />
              Tentar instalação automática
            </Button>
          </TabsContent>
          
          <TabsContent value="desktop" className="pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <h4 className="text-sm font-medium">Procure o ícone de instalação</h4>
                  <p className="text-sm text-muted-foreground mt-1">Procure pelo ícone de instalação na barra de endereço (geralmente à direita).</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <h4 className="text-sm font-medium">Instale o aplicativo</h4>
                  <p className="text-sm text-muted-foreground mt-1">Clique no ícone e selecione "Instalar" ou "Adicionar" para confirmar a instalação.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <h4 className="text-sm font-medium">Alternativa pelo menu</h4>
                  <p className="text-sm text-muted-foreground mt-1">Se não encontrar o ícone, vá ao menu do navegador e procure por "Instalar aplicativo" ou "Adicionar à tela inicial".</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex sm:justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Fechar
          </Button>
          {(isAndroid || !isIOS) && deferredPrompt && (
            <Button onClick={handleNativeInstall} className="flex items-center gap-2">
              <Download size={16} />
              Instalar agora
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  // Banner de instalação compacto
  return (
    <>
      {showPrompt && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 rounded-full p-2">
                <Smartphone className="text-primary h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Instale o Vale Cashback</h4>
                <p className="text-xs text-muted-foreground">Use mesmo sem internet</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShowInstructions}
                className="hidden sm:flex items-center gap-1"
              >
                Como instalar
                <ChevronRight size={14} />
              </Button>
              
              <Button 
                onClick={deferredPrompt ? handleNativeInstall : handleShowInstructions}
                size="sm"
                className="flex items-center gap-1"
              >
                <Download size={14} />
                Instalar
              </Button>
              
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleDismiss}
                className="h-8 w-8 rounded-full"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <InstallDialog />
    </>
  );
}