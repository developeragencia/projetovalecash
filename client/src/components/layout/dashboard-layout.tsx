import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useTranslation } from "@/hooks/use-translation";
import { Sidebar, SidebarToggle } from "@/components/layout/sidebar";
import { User, LogOut as Logout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/ui/notification-bell";
import { LanguageSelector } from "@/components/ui/language-selector";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  type: "client" | "merchant" | "admin";
}

export function DashboardLayout({ 
  children, 
  title, 
  type 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  // Hook para atualizar o título quando o idioma muda
  useEffect(() => {
    if (title) {
      let translatedTitle = title;
      
      // Verificações específicas para títulos que são palavras comuns
      if (title === 'Referrals' || title === 'Indicações') {
        translatedTitle = t('common.Referrals');
      } else {
        // Tenta traduzir o título diretamente, ou como chave common.X, ou manter o original
        translatedTitle = 
          t(`common.${title}`) !== `common.${title}` ? t(`common.${title}`) : 
          t(title) !== title ? t(title) : 
          title;
      }
        
      document.title = `${translatedTitle} | Vale Cashback`;
    }
  }, [title, t]);
  
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  // Fornecer dados de usuário padrão quando não estiver autenticado (para desenvolvimento)
  const userInfo = {
    name: user?.name || "Usuário de Teste",
    photo: user?.photo || undefined,
    extraInfo: type === "merchant" ? "Taxa de comissão: 1%" : undefined,
    status: user?.status || "active"
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>
          {t(`common.${title}`) !== `common.${title}` ? t(`common.${title}`) : 
           t(title) !== title ? t(title) : title} | Vale Cashback
        </title>
      </Helmet>
      
      {/* Header - Design moderno com gradiente de cores */}
      <header 
        className="bg-gradient-to-r from-green-600 to-green-500 text-white py-3 px-4 flex justify-between items-center sticky top-0 z-30 shadow-md"
        style={{ 
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        <div className="flex items-center">
          <SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex items-center">
            <img 
              src="/valecashback-logo-white-text.png" 
              alt="Vale Cashback"
              className="h-8 w-auto ml-2 md:ml-3"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="hidden md:block">
            <LanguageSelector />
          </div>
          <NotificationBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-white/40 hover:border-white/80 transition-all duration-200 p-0">
                <Avatar className="h-full w-full">
                  <AvatarImage src={user?.photo || undefined} alt={user?.name} />
                  <AvatarFallback className="bg-green-700 text-white">{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 mt-1 p-1 rounded-xl shadow-lg border border-gray-200" align="end" forceMount>
              <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg mb-1">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={user?.photo || undefined} alt={user?.name} />
                    <AvatarFallback className="bg-green-600 text-white">{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </div>
              <DropdownMenuItem 
                className="rounded-lg py-2.5 my-1 cursor-pointer flex items-center" 
                onClick={() => {
                  if (type === "client") {
                    window.location.href = "/client/profile";
                  } else if (type === "merchant") {
                    window.location.href = "/merchant/profile";
                  } else {
                    window.location.href = "/admin/profile";
                  }
                }}
              >
                <User className="mr-2 h-4 w-4" />
                <span>{t('common.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem 
                className="rounded-lg py-2.5 text-red-600 cursor-pointer flex items-center" 
                onClick={() => logout()}
              >
                <Logout className="mr-2 h-4 w-4" />
                <span>{t('common.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar com novo estilo */}
        <Sidebar
          type={type}
          userInfo={userInfo}
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
        />
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Cabeçalho da página com título e indicador de caminho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8">
              <div>
                <div className="text-sm text-gray-500 mb-1 hidden md:flex items-center">
                  <span className="capitalize">{type}</span> 
                  <span className="mx-2">•</span> 
                  <span>{t('common.dashboard')}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                  {t(title) || title}
                </h1>
              </div>
            </div>
            
            {/* Conteúdo principal */}
            <div className="animate-fadeIn">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      {/* Removido o estilo JSX que estava causando problemas */}
    </div>
  );
}
