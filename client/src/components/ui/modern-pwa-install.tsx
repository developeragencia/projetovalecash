import React, { useState, useEffect } from 'react';
import { isMobileDevice, getDeviceOS, isAppInstalled } from '@/pwaHelpers';
import { 
  Download, X, Smartphone, ChevronRight, 
  Chrome, Check, Share2, ArrowDownToLine, 
  Info, AlertCircle, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";
import '../../styles/pwa-install.css';

// Variável global para armazenar o evento de instalação
let deferredPrompt: any = null;

// Disponibilizar a referência para uso global
(window as any).deferredPromptGlobal = deferredPrompt;

export function ModernPWAInstall() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [deviceOS, setDeviceOS] = useState<string | null>(null);
  const [installable, setInstallable] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [installInProgress, setInstallInProgress] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    // Detecta o sistema operacional
    const os = getDeviceOS();
    setDeviceOS(os);
    console.log('ModernPWAInstall: Sistema operacional detectado:', os);

    // Verificar se o app já está instalado
    const appInstalled = isAppInstalled();

    if (appInstalled) {
      console.log('ModernPWAInstall: App já está instalado como PWA');
      return; // Não mostra o prompt se já estiver instalado
    }

    // Captura o evento beforeinstallprompt para Chrome/Android
    const handleBeforeInstallPrompt = (e: any) => {
      // Previne que o Chrome mostre o prompt nativo
      e.preventDefault();
      // Armazena o evento para uso posterior
      console.log('ModernPWAInstall: BeforeInstallPrompt capturado!', e);
      deferredPrompt = e;
      // Define a variável global para o evento
      (window as any).deferredPromptGlobal = deferredPrompt;
      setInstallable(true);
      
      // Mostra o banner automaticamente após 3 segundos
      setTimeout(() => {
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Detecta quando o app é instalado
    const handleAppInstalled = () => {
      console.log('ModernPWAInstall: App instalado com sucesso!');
      setShowPrompt(false);
      setShowDialog(false);
      deferredPrompt = null;
      toast({
        title: "Aplicativo instalado!",
        description: "Vale Cashback foi adicionado à sua tela inicial.",
      });
    };

    // Adiciona um listener para mostrar o banner por interação do usuário
    const handleUserInteraction = () => {
      if (!showPrompt && !isAppInstalled && !dismissed) {
        const isUserSession = localStorage.getItem('user-session-started');
        if (isUserSession) {
          console.log('ModernPWAInstall: Permitindo instalação após interação do usuário');
          // Não mostra automaticamente, mas define que o usuário já interagiu
          localStorage.setItem('user-interaction-detected', 'true');
          // Remove o listener após detectar interação
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
        if (!dismissed && !isAppInstalled && !showPrompt) {
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
  }, [dismissed, showPrompt, toast]);

  // Expõe a função para o window para poder ser chamada de qualquer lugar
  useEffect(() => {
    (window as any).showModernInstallBanner = forceShowInstallBanner;
    
    // Remove a página de download do aplicativo antigo
    const cleanupDownloadPages = () => {
      try {
        // Remove links para páginas antigas de download no menu
        const downloadLinks = document.querySelectorAll('a[href="/downloads"]');
        downloadLinks.forEach(link => {
          const parentElement = link.parentElement;
          if (parentElement) {
            parentElement.style.display = 'none';
          }
        });
      } catch (e) {
        console.error('Erro ao limpar páginas de download:', e);
      }
    };

    // Executa a limpeza após o DOM estar carregado
    if (document.readyState === 'complete') {
      cleanupDownloadPages();
    } else {
      window.addEventListener('load', cleanupDownloadPages);
      return () => window.removeEventListener('load', cleanupDownloadPages);
    }
  }, []);

  // Função para instalar o aplicativo diretamente (Chrome/Android)
  const handleNativeInstall = async () => {
    console.log('Tentando instalar app PWA nativamente...');
    setInstallInProgress(true);
    
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
          toast({
            title: "Instalação em andamento",
            description: "O Vale Cashback está sendo adicionado à sua tela inicial.",
          });
        } else {
          toast({
            title: "Instalação cancelada",
            description: "Você pode instalar o app a qualquer momento pelo menu.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Erro no prompt de instalação:', error);
        toast({
          title: "Erro na instalação",
          description: "Houve um problema ao instalar o aplicativo. Tente novamente.",
          variant: "destructive",
        });
      }
      
      // Limpa a referência ao prompt - só pode ser usado uma vez
      deferredPrompt = null;
    } else {
      // Se não temos o prompt nativo, abrimos o diálogo com instruções
      setShowDialog(true);
    }
    
    setInstallInProgress(false);
  };

  // Força a instalação através de um botão em outro lugar da UI
  const forceShowInstallBanner = () => {
    setShowPrompt(true);
    setDismissed(false);
  };
  
  // Função para fechar o banner
  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Armazena a preferência do usuário
    localStorage.setItem('pwa-install-dismissed', 'true');
  };
  
  // Função que abre o diálogo de instruções
  const handleShowInstructions = () => {
    setShowDialog(true);
    setShowPrompt(false);
  };

  // Função para compartilhar o site (útil para iOS)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vale Cashback',
          text: 'Instale o Vale Cashback para gerenciar suas finanças de forma fácil e rápida!',
          url: window.location.href,
        });
        
        toast({
          title: "Link compartilhado!",
          description: "Use a opção 'Adicionar à Tela Inicial' para instalar o app.",
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback para browsers que não suportam Web Share API
      handleShowInstructions();
    }
  };

  // Se foi dispensado pelo usuário ou já está instalado, não mostra nada
  if (dismissed || isAppInstalled()) return null;
  
  // Se não tem nada para mostrar (nem o prompt nem o diálogo), não mostra nada
  if (!showPrompt && !showDialog) return null;
  
  const isIOS = deviceOS === 'ios';
  const isAndroid = deviceOS === 'android';
  const defaultTab = isIOS ? 'ios' : (isAndroid ? 'android' : 'desktop');

  // Componente de banner de instalação
  const InstallBanner = () => (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-40 pwa-install-banner">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center pwa-icon-pulse">
              <Download className="h-6 w-6" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold">Instale o Vale Cashback</h3>
              <p className="text-sm text-muted-foreground">
                Acesse mais rápido, offline e com melhor experiência.
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDismiss}
            className="h-8 w-8 -mt-1 -mr-1 pwa-close-btn"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex space-x-2 mt-3">
          {isIOS ? (
            <>
              <Button 
                variant="outline" 
                className="flex-1 pwa-install-btn"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              <Button 
                className="flex-1 pwa-install-btn"
                onClick={handleShowInstructions}
              >
                <Plus className="h-4 w-4 mr-2" />
                Instalar
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="flex-1 pwa-install-btn"
                onClick={handleShowInstructions}
              >
                <Info className="h-4 w-4 mr-2" />
                Como instalar
              </Button>
              <Button 
                className="flex-1 pwa-install-btn"
                onClick={handleNativeInstall}
                disabled={installInProgress}
              >
                {installInProgress ? (
                  <div className="pwa-install-progress mr-2 w-4"></div>
                ) : (
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                )}
                Instalar App
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Diálogo de instruções de instalação
  const installationDialog = (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Instale o Vale Cashback no seu dispositivo
          </DialogTitle>
          <DialogDescription>
            Siga as instruções abaixo para instalar o aplicativo e aproveitar todos os recursos.
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
          
          <TabsContent value="ios" className="pt-4 pwa-page-transition">
            <div className="space-y-4">
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start pwa-instructions-step rounded-lg p-2">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <h4 className="text-sm font-medium">Abra o site no Safari</h4>
                  <p className="text-sm text-muted-foreground mt-1">O Vale Cashback só pode ser instalado usando o navegador Safari no iOS.</p>
                  <div className="mt-1 p-2 bg-muted rounded-md">
                    <small className="text-xs text-muted-foreground">Se você está usando outro navegador, copie o link e abra no Safari</small>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start pwa-instructions-step rounded-lg p-2">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <h4 className="text-sm font-medium">Toque no botão de compartilhamento</h4>
                  <p className="text-sm text-muted-foreground mt-1">Toque no ícone de compartilhamento <span className="inline-block border rounded-md px-2 py-1">&#x2BAD;</span> na parte inferior (iPhone) ou superior (iPad) do navegador.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start pwa-instructions-step rounded-lg p-2">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <h4 className="text-sm font-medium">Adicione à tela de início</h4>
                  <p className="text-sm text-muted-foreground mt-1">Role para baixo e toque em "Adicionar à Tela de Início" e confirme tocando em "Adicionar".</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start pwa-instructions-step rounded-lg p-2">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">4</div>
                <div>
                  <h4 className="text-sm font-medium">Abra o aplicativo</h4>
                  <p className="text-sm text-muted-foreground mt-1">Toque no ícone do Vale Cashback na sua tela de início para abrir o aplicativo.</p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button 
                  className="w-full pwa-install-btn"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar para instalar
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="android" className="pt-4 pwa-page-transition">
            <div className="space-y-4">
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start pwa-instructions-step rounded-lg p-2">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <h4 className="text-sm font-medium">Abra o site no Chrome</h4>
                  <p className="text-sm text-muted-foreground mt-1">Para melhor experiência, use o Google Chrome para instalar o Vale Cashback.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start pwa-instructions-step rounded-lg p-2">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <h4 className="text-sm font-medium">Toque no menu</h4>
                  <p className="text-sm text-muted-foreground mt-1">Toque no menu (três pontos) no canto superior direito do Chrome.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start pwa-instructions-step rounded-lg p-2">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <h4 className="text-sm font-medium">Instale o aplicativo</h4>
                  <p className="text-sm text-muted-foreground mt-1">Selecione "Instalar aplicativo" ou "Adicionar à tela inicial" e confirme a instalação.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start pwa-instructions-step rounded-lg p-2">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">4</div>
                <div>
                  <h4 className="text-sm font-medium">Abra o aplicativo</h4>
                  <p className="text-sm text-muted-foreground mt-1">Toque no ícone do Vale Cashback na sua tela inicial para abrir o aplicativo.</p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button 
                  className="w-full pwa-install-btn"
                  onClick={handleNativeInstall}
                  disabled={installInProgress}
                >
                  {installInProgress ? (
                    <div className="pwa-install-progress mr-2 w-4"></div>
                  ) : (
                    <ArrowDownToLine className="h-4 w-4 mr-2" />
                  )}
                  Instalar o Vale Cashback
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="desktop" className="pt-4 pwa-page-transition">
            <div className="space-y-4">
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start pwa-instructions-step rounded-lg p-2">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <h4 className="text-sm font-medium">Localize o ícone de instalação</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    No Chrome, Edge ou Opera, procure o ícone de instalação <span className="inline-block border rounded-md px-1">+</span> na barra de endereço.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start pwa-instructions-step rounded-lg p-2">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <h4 className="text-sm font-medium">Clique para instalar</h4>
                  <p className="text-sm text-muted-foreground mt-1">Clique no ícone e selecione "Instalar" na janela que aparecer.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-[32px_1fr] gap-3 items-start pwa-instructions-step rounded-lg p-2">
                <div className="bg-primary text-primary-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <h4 className="text-sm font-medium">Confirme a instalação</h4>
                  <p className="text-sm text-muted-foreground mt-1">Clique em "Instalar" no diálogo de confirmação que aparecer.</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button 
                  className="w-full pwa-install-btn"
                  onClick={handleNativeInstall}
                  disabled={installInProgress}
                >
                  {installInProgress ? (
                    <div className="pwa-install-progress mr-2 w-4"></div>
                  ) : (
                    <ArrowDownToLine className="h-4 w-4 mr-2" />
                  )}
                  Instalar o Vale Cashback
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setShowDialog(false)} 
            className="mb-2 sm:mb-0"
          >
            Fechar
          </Button>
          <p className="text-xs text-muted-foreground">
            Instale para receber notificações e usar sem internet!
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {showPrompt && <InstallBanner />}
      {showDialog && installationDialog}
    </>
  );
}

// Botão moderno para instalação do aplicativo que pode ser incluído em qualquer lugar da UI
export function ModernInstallButton() {
  const [deviceOS, setDeviceOS] = useState<string | null>(null);
  const [installable, setInstallable] = useState(true);
  const [installInProgress, setInstallInProgress] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Detecta o sistema operacional
    const os = getDeviceOS();
    setDeviceOS(os);
    
    // Verificar se o app já está instalado
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
    
    if (isAppInstalled) {
      setInstallable(false);
    }
  }, []);

  // Se já estiver instalado, não mostra o botão
  if (!installable || window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  const handleShowInstallPrompt = () => {
    // Use a função global definida no componente principal
    if (typeof (window as any).showModernInstallBanner === 'function') {
      (window as any).showModernInstallBanner();
    } else {
      toast({
        title: "Instalação disponível",
        description: "Você pode instalar o Vale Cashback para acesso rápido e offline.",
      });
    }
  };

  return (
    <Button 
      onClick={handleShowInstallPrompt}
      variant="outline"
      className="flex items-center gap-2 pwa-install-btn"
      disabled={installInProgress}
    >
      {installInProgress ? (
        <div className="pwa-install-progress mr-2 w-4"></div>
      ) : (
        <Download size={16} />
      )}
      Instalar App
    </Button>
  );
}