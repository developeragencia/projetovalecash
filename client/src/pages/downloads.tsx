import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Download, Smartphone, Laptop, Apple, 
  ChevronRight, FileDown, HelpCircle, Globe 
} from 'lucide-react';
import { isMobileDevice, getDeviceOS } from '@/pwaHelpers';
import { DownloadButton } from '@/components/download-button';

export default function DownloadsPage() {
  const deviceOS = getDeviceOS();
  const isMobile = isMobileDevice();
  
  // Define qual aba deve estar selecionada por padrão com base no dispositivo do usuário
  let defaultTab = 'android';
  
  if (deviceOS === 'ios') defaultTab = 'ios';
  else if (deviceOS === 'android') defaultTab = 'android';
  else if (deviceOS === 'windows') defaultTab = 'windows';
  else if (deviceOS === 'mac') defaultTab = 'mac';
  
  // Registra a visualização da página
  useEffect(() => {
    console.log('Página de downloads visualizada em:', deviceOS);
  }, [deviceOS]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Baixar Vale Cashback | Aplicativo de Cashback</title>
        <meta name="description" content="Baixe o aplicativo Vale Cashback para Android, iOS, Windows ou Mac e tenha acesso ao seu cashback e transferências a qualquer momento." />
      </Helmet>
      
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft size={16} />
            Voltar
          </Button>
        </Link>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Baixe o Vale Cashback</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Instale o aplicativo Vale Cashback em seu dispositivo e tenha acesso ao seu 
            cashback, transferências e muito mais, mesmo quando estiver offline.
          </p>
        </div>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-8">
            <TabsTrigger value="android" className="flex items-center gap-2">
              <Smartphone size={16} />
              <span>Android</span>
            </TabsTrigger>
            <TabsTrigger value="ios" className="flex items-center gap-2">
              <Apple size={16} />
              <span>iOS</span>
            </TabsTrigger>
            <TabsTrigger value="windows" className="flex items-center gap-2">
              <Laptop size={16} />
              <span>Windows</span>
            </TabsTrigger>
            <TabsTrigger value="mac" className="flex items-center gap-2">
              <Laptop size={16} />
              <span>macOS</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da aba Android */}
          <TabsContent value="android" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="text-primary" size={24} />
                  Baixar para Android
                </CardTitle>
                <CardDescription>
                  Baixe e instale o aplicativo Vale Cashback em seu dispositivo Android para 
                  acessar todas as funcionalidades, mesmo offline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
                    <Smartphone size={48} className="text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aplicativo Mobile</h3>
                    <p className="text-sm text-center text-muted-foreground mb-4">
                      Baixe o aplicativo completo para usar em seu dispositivo Android
                    </p>
                    <DownloadButton 
                      fileUrl="/app-files/vale-cashback-mobile.html" 
                      fileName="Vale-Cashback-App.html" 
                    />
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
                    <Globe size={48} className="text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Acessar Online</h3>
                    <p className="text-sm text-center text-muted-foreground mb-4">
                      Acesse o aplicativo online e adicione à sua tela inicial
                    </p>
                    <a href="/" className="w-full">
                      <Button variant="outline" className="w-full gap-2">
                        <Globe size={16} />
                        Acessar Online
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <Button variant="link" asChild className="px-0">
                  <a href="/downloads/installers/android-instructions.html" target="_blank" className="flex items-center gap-2">
                    <HelpCircle size={16} />
                    Precisa de ajuda para instalar? Veja nossas instruções detalhadas
                    <ChevronRight size={14} />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da aba iOS */}
          <TabsContent value="ios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="text-primary" size={24} />
                  Baixar para iOS (iPhone/iPad)
                </CardTitle>
                <CardDescription>
                  Instale o aplicativo Vale Cashback em seu dispositivo iOS para 
                  ter a melhor experiência com notificações e acesso offline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
                    <Apple size={48} className="text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aplicativo Mobile</h3>
                    <p className="text-sm text-center text-muted-foreground mb-4">
                      Baixe o aplicativo completo para usar em seu iPhone ou iPad
                    </p>
                    <DownloadButton 
                      fileUrl="/app-files/vale-cashback-mobile.html" 
                      fileName="Vale-Cashback-App.html" 
                    />
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
                    <Globe size={48} className="text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Acessar Online</h3>
                    <p className="text-sm text-center text-muted-foreground mb-4">
                      Acesse o aplicativo online e adicione à sua tela inicial
                    </p>
                    <a href="/" className="w-full">
                      <Button variant="outline" className="w-full gap-2">
                        <Globe size={16} />
                        Acessar Online
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <Button variant="link" asChild className="px-0">
                  <a href="/downloads/installers/ios-instructions.html" target="_blank" className="flex items-center gap-2">
                    <HelpCircle size={16} />
                    Veja instruções detalhadas para instalação no iOS
                    <ChevronRight size={14} />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da aba Windows */}
          <TabsContent value="windows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Laptop className="text-primary" size={24} />
                  Baixar para Windows
                </CardTitle>
                <CardDescription>
                  Use o Vale Cashback em seu computador com Windows para uma experiência completa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
                    <FileDown size={48} className="text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aplicativo Windows</h3>
                    <p className="text-sm text-center text-muted-foreground mb-4">
                      Baixe o instalador exe e execute-o em seu computador Windows
                    </p>
                    <a href="/downloads/vale-cashback-windows.exe" className="w-full">
                      <Button className="w-full gap-2">
                        <Download size={16} />
                        Baixar .EXE
                      </Button>
                    </a>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
                    <Globe size={48} className="text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Versão Web</h3>
                    <p className="text-sm text-center text-muted-foreground mb-4">
                      Use a versão web no seu navegador Edge, Chrome ou Firefox
                    </p>
                    <Link href="/" className="w-full">
                      <Button variant="outline" className="w-full gap-2">
                        <Globe size={16} />
                        Usar Versão Web
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da aba macOS */}
          <TabsContent value="mac" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Laptop className="text-primary" size={24} />
                  Baixar para macOS
                </CardTitle>
                <CardDescription>
                  Use o Vale Cashback em seu Mac para uma experiência completa e integrada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
                    <FileDown size={48} className="text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aplicativo macOS</h3>
                    <p className="text-sm text-center text-muted-foreground mb-4">
                      Baixe o instalador DMG para MacOS (Intel e Apple Silicon)
                    </p>
                    <a href="/downloads/vale-cashback-mac.dmg" className="w-full">
                      <Button className="w-full gap-2">
                        <Download size={16} />
                        Baixar .DMG
                      </Button>
                    </a>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
                    <Globe size={48} className="text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Versão Web</h3>
                    <p className="text-sm text-center text-muted-foreground mb-4">
                      Use a versão web no Safari e adicione aos favoritos
                    </p>
                    <Link href="/" className="w-full">
                      <Button variant="outline" className="w-full gap-2">
                        <Globe size={16} />
                        Usar Versão Web
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-primary">Por que baixar o aplicativo?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <div className="flex items-start gap-3">
                <div className="bg-primary rounded-full p-2 text-white mt-1">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Acesso Offline</h3>
                  <p className="text-sm text-muted-foreground">
                    Continue utilizando diversas funções mesmo sem conexão à internet.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-start gap-3">
                <div className="bg-primary rounded-full p-2 text-white mt-1">
                  <Download size={16} />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Melhor Desempenho</h3>
                  <p className="text-sm text-muted-foreground">
                    Navegação mais rápida e fluida do que na versão web.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-start gap-3">
                <div className="bg-primary rounded-full p-2 text-white mt-1">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Notificações</h3>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas sobre transações, cashback e mais.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}