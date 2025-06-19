import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Smartphone, ExternalLink } from 'lucide-react';
import { getDeviceOS } from '@/pwaHelpers';
import { Link } from 'wouter';

export function AppDownload() {
  const [showDialog, setShowDialog] = useState(false);
  const deviceOS = getDeviceOS();
  const defaultTab = deviceOS === 'ios' ? 'ios' : (deviceOS === 'android' ? 'android' : 'desktop');

  const handleOpenDialog = () => {
    setShowDialog(true);
  };

  return (
    <>
      <Link href="/downloads">
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar Aplicativo
        </Button>
      </Link>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Baixe o Vale Cashback
            </DialogTitle>
            <DialogDescription>
              Escolha a versão do aplicativo para seu dispositivo
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
              <TabsTrigger value="desktop" className="flex items-center gap-1">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 8H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Desktop
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ios" className="pt-4">
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Faça o download do Vale Cashback para iOS e aproveite todos os benefícios de cashback em seu iPhone.
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  <img 
                    src="/icon-512.png" 
                    alt="Vale Cashback para iOS" 
                    className="w-24 h-24 rounded-2xl shadow-lg"
                  />
                  
                  <div className="flex flex-col gap-3 w-full">
                    <a 
                      href="/downloads/vale-cashback-ios.ipa" 
                      download
                      className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md text-center flex items-center justify-center gap-2 font-medium"
                    >
                      <Download className="h-5 w-5" />
                      Baixar para iOS (.ipa)
                    </a>
                    
                    <a 
                      href="https://apps.apple.com/app/vale-cashback/id123456789" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-md text-center flex items-center justify-center gap-2 font-medium"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Abrir na App Store
                    </a>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
                  <p><strong>Nota:</strong> Para instalar o arquivo .ipa, você precisará do AltStore ou estar com o dispositivo desbloqueado (jailbreak).</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="android" className="pt-4">
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Faça o download do Vale Cashback para Android e aproveite todos os benefícios de cashback em seu smartphone.
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  <img 
                    src="/icon-512.png" 
                    alt="Vale Cashback para Android" 
                    className="w-24 h-24 rounded-2xl shadow-lg"
                  />
                  
                  <div className="flex flex-col gap-3 w-full">
                    <a 
                      href="/downloads/vale-cashback-android.apk" 
                      download
                      className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md text-center flex items-center justify-center gap-2 font-medium"
                    >
                      <Download className="h-5 w-5" />
                      Baixar APK direto
                    </a>
                    
                    <a 
                      href="https://play.google.com/store/apps/details?id=com.valecashback.app" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-md text-center flex items-center justify-center gap-2 font-medium"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Abrir na Play Store
                    </a>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
                  <p><strong>Nota:</strong> Para instalar o APK, você precisará habilitar a instalação de fontes desconhecidas nas configurações do seu dispositivo.</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="desktop" className="pt-4">
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Faça o download do Vale Cashback para Desktop e aproveite todos os benefícios de cashback em seu computador.
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  <img 
                    src="/icon-512.png" 
                    alt="Vale Cashback para Desktop" 
                    className="w-24 h-24 rounded-2xl shadow-lg"
                  />
                  
                  <div className="flex flex-col gap-3 w-full">
                    <a 
                      href="/downloads/vale-cashback-windows.exe" 
                      download
                      className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md text-center flex items-center justify-center gap-2 font-medium"
                    >
                      <Download className="h-5 w-5" />
                      Baixar para Windows (.exe)
                    </a>
                    
                    <a 
                      href="/downloads/vale-cashback-mac.dmg" 
                      download
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-md text-center flex items-center justify-center gap-2 font-medium"
                    >
                      <Download className="h-5 w-5" />
                      Baixar para macOS (.dmg)
                    </a>
                    
                    <a 
                      href="/downloads/vale-cashback-linux.deb" 
                      download
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-md text-center flex items-center justify-center gap-2 font-medium"
                    >
                      <Download className="h-5 w-5" />
                      Baixar para Linux (.deb)
                    </a>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
                  <p><strong>Nota:</strong> Os instaladores para desktop oferecem uma experiência nativa do Vale Cashback no seu computador.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}