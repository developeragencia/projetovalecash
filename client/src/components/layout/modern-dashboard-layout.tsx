import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useTranslation } from "@/hooks/use-translation";
import { Link, useLocation } from "wouter";
import { 
  User, LogOut, Menu, X, Bell, ChevronDown, 
  Search, Home, List, ShoppingCart, CreditCard, 
  Package, Store, Users, BarChart, Settings,
  FileText, Landmark, Scan, DollarSign, Headphones,
  Sun, Moon, Building2, History, Palette
} from "lucide-react";
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
import { ModernPWAInstall, ModernInstallButton } from "@/components/ui/modern-pwa-install";
import "../../styles/modern-theme.css";

interface ModernDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  type: "client" | "merchant" | "admin";
}

export function ModernDashboardLayout({ 
  children, 
  title, 
  type 
}: ModernDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Detecta rolagem para esconder/mostrar o header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Definir se a página foi rolada para baixo (para mudar a aparência do header)
      if (currentScrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      // Esconder/mostrar header baseado na direção da rolagem
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  // Fecha a sidebar quando clicar fora em dispositivos móveis
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        const sidebar = document.querySelector('.modern-sidebar');
        const header = document.querySelector('.modern-header');
        
        if (sidebar && header && 
            !sidebar.contains(e.target as Node) && 
            !header.contains(e.target as Node)) {
          setSidebarOpen(false);
        }
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen]);
  
  // Detecta tamanho da tela para ajustar sidebar automaticamente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Inicializa
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Focus na caixa de pesquisa quando abrir
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);
  
  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  // Links de navegação baseados no tipo de usuário
  const getNavLinks = () => {
    switch (type) {
      case "client":
        return [
          { href: "/client/dashboard", icon: <Home size={20} />, label: t('common.Dashboard') },
          { href: "/client/transactions", icon: <List size={20} />, label: t('navigation.transactions') },
          { href: "/client/transfers", icon: <CreditCard size={20} />, label: t('navigation.transfers') },
          { href: "/client/qr-code", icon: <Scan size={20} />, label: t('common.QRCode') },
          { href: "/client/stores", icon: <Store size={20} />, label: t('navigation.stores') },
          { href: "/client/referrals", icon: <Users size={20} />, label: t('common.Referrals') },
          { href: "/client/profile", icon: <User size={20} />, label: t('common.profile') },
        ];
      case "merchant":
        return [
          { href: "/merchant/dashboard", icon: <Home size={20} />, label: t('common.Dashboard') },
          { href: "/merchant/sales", icon: <ShoppingCart size={20} />, label: t('merchant.registerSale') },
          { href: "/merchant/transactions", icon: <List size={20} />, label: t('merchant.history') },
          { href: "/merchant/transaction-management", icon: <FileText size={20} />, label: t('merchant.manageSales') },
          { href: "/merchant/withdrawals", icon: <Landmark size={20} />, label: t('merchant.requestWithdrawal') },
          { href: "/merchant/salaries", icon: <DollarSign size={20} />, label: "Comissões e Taxas" },
          { href: "/merchant/products", icon: <Package size={20} />, label: t('navigation.products') },
          { href: "/merchant/scanner", icon: <Scan size={20} />, label: t('navigation.scanner') },
          { href: "/merchant/payment-qr", icon: <CreditCard size={20} />, label: t('common.QRCode') },
          { href: "/merchant/stores", icon: <Store size={20} />, label: t('merchant.partnerStores') },
          { href: "/merchant/referrals", icon: <Users size={20} />, label: t('common.Referrals') },
          { href: "/merchant/reports", icon: <BarChart size={20} />, label: t('navigation.reports') },
          { href: "/merchant/settings", icon: <Settings size={20} />, label: t('common.settings') },
          { href: "/merchant/profile", icon: <User size={20} />, label: t('merchant.myStore') },
          { href: "/merchant/support", icon: <Headphones size={20} />, label: t('merchant.support') },
        ];
      case "admin":
        return [
          { href: "/admin/dashboard", icon: <Home size={20} />, label: t('common.Dashboard') },
          { href: "/admin/users", icon: <Users size={20} />, label: t('navigation.users') },
          { href: "/admin/customers", icon: <User size={20} />, label: t('navigation.customers') },
          { href: "/admin/merchants", icon: <Store size={20} />, label: t('navigation.merchants') },
          { href: "/admin/stores", icon: <Building2 size={20} />, label: t('navigation.stores') },
          { href: "/admin/transactions", icon: <CreditCard size={20} />, label: t('navigation.transactions') },
          { href: "/admin/transfers", icon: <Landmark size={20} />, label: t('navigation.transfers') },
          { href: "/admin/withdrawals", icon: <CreditCard size={20} />, label: t('navigation.withdrawals') },
          { href: "/admin/reports", icon: <BarChart size={20} />, label: "Relatórios" },
          { href: "/admin/settings", icon: <Settings size={20} />, label: t('common.settings') },
          { href: "/admin/brand-settings", icon: <Palette size={20} />, label: 'Marca' },
          { href: "/admin/logs", icon: <History size={20} />, label: t('navigation.logs') },
          { href: "/admin/support", icon: <Headphones size={20} />, label: t('navigation.support') },
        ];
      default:
        return [];
    }
  };
  
  const navLinks = getNavLinks();
  
  // Fornecer dados de usuário padrão quando não estiver autenticado (para desenvolvimento)
  const userInfo = {
    name: user?.name || "Usuário de Teste",
    photo: user?.photo || undefined,
    email: user?.email || "usuario@example.com",
    extraInfo: type === "merchant" ? "Taxa de comissão: 1%" : undefined,
    status: user?.status || "active"
  };
  
  const getTypeColor = () => {
    switch (type) {
      case "client":
        return "var(--secondary-color)";
      case "merchant":
        return "var(--accent-color)";
      case "admin":
        return "var(--primary-color)";
      default:
        return "var(--primary-color)";
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>
          {t(`common.${title}`) !== `common.${title}` ? t(`common.${title}`) : 
           t(title) !== title ? t(title) : title} | Vale Cashback
        </title>
        <meta name="theme-color" content={getTypeColor()} />
      </Helmet>
      
      {/* Componente de instalação PWA */}
      <ModernPWAInstall />
      
      {/* Header */}
      <header 
        className={`modern-header ${scrolled ? 'shadow-md' : ''} ${headerVisible ? 'header-visible' : 'header-scrolled'}`}
        style={{
          background: `linear-gradient(90deg, var(--primary-color) 0%, ${getTypeColor()} 100%)`
        }}
      >
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-white/10"
          >
            <Menu size={24} />
          </Button>
          
          <div className="logo-container ml-3">
            <img 
              src="/valecashback-logo-white-text.png" 
              alt="Vale Cashback"
              className="h-8 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <span className="logo-text ml-2">
              {type === "client" ? "Cliente" : type === "merchant" ? "Lojista" : "Admin"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Botão de pesquisa */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-white hover:bg-white/10"
          >
            <Search size={20} />
          </Button>
          
          {/* Selector de idioma */}
          <LanguageSelector />
          
          {/* Toggle modo escuro */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDarkMode(!darkMode)}
            className="text-white hover:bg-white/10"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          
          {/* Botão de instalação PWA */}
          <div className="hidden md:block">
            <ModernInstallButton />
          </div>
          
          {/* Notificações */}
          <NotificationBell />
          
          {/* Menu de usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 border-2 border-white/50">
                  <AvatarImage src={user?.photo || undefined} alt={user?.name} />
                  <AvatarFallback className="bg-primary-foreground/20 text-white">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                if (type === "client") {
                  window.location.href = "/client/profile";
                } else if (type === "merchant") {
                  window.location.href = "/merchant/profile";
                } else {
                  window.location.href = "/admin/profile";
                }
              }}>
                <User className="mr-2 h-4 w-4" />
                <span>{t('common.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('common.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Campo de busca */}
      {searchOpen && (
        <div className="fixed top-[var(--header-height)] left-0 right-0 bg-card-bg border-b border-card-border p-4 z-30 shadow-md animate-slideInDown">
          <div className="max-w-3xl mx-auto relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`${t('common.search')}...`}
              className="w-full p-3 pl-10 rounded-lg border border-card-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearchOpen(false)}
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      )}
      
      {/* Sidebar moderna */}
      <aside 
        className={`modern-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{ 
          borderRight: '1px solid var(--card-border)'
        }}
      >
        {/* Cabeçalho da sidebar */}
        <div className="sidebar-header">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={userInfo.photo || undefined} alt={userInfo.name} />
            <AvatarFallback>
              {getInitials(userInfo.name)}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <div className="font-medium truncate">{userInfo.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {type === "client" ? "Cliente" : type === "merchant" ? "Lojista" : "Administrador"}
              </div>
              {userInfo.extraInfo && (
                <div className="text-xs text-muted-foreground mt-0.5">{userInfo.extraInfo}</div>
              )}
            </div>
          )}
        </div>
        
        {/* Navegação */}
        <div className="sidebar-section">
          <nav>
            <ul className="space-y-1">
              {navLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <a 
                      className={`nav-item ${location === link.href ? 'active' : ''}`}
                      title={sidebarCollapsed ? link.label : undefined}
                    >
                      <span className="nav-icon">{link.icon}</span>
                      {!sidebarCollapsed && <span className="nav-text">{link.label}</span>}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        {/* Rodapé da sidebar */}
        <div className="sidebar-section mt-auto border-t border-card-border pt-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start mb-2"
            onClick={() => logout()}
          >
            <LogOut size={20} className="mr-2" />
            {!sidebarCollapsed && <span>{t('common.logout')}</span>}
          </Button>
          
          {!sidebarCollapsed && (
            <div className="text-xs text-center text-muted-foreground mt-4">
              Vale Cashback v3.0 <br />
              &copy; {new Date().getFullYear()}
            </div>
          )}
        </div>
        
        {/* Botão para colapsar sidebar (apenas em desktop) */}
        <div className="hidden lg:flex justify-center py-2 border-t border-card-border">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 p-0"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </aside>
      
      {/* Conteúdo principal */}
      <main 
        className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{ 
          transition: 'all var(--transition-speed) ease',
          paddingTop: `calc(var(--header-height) + ${searchOpen ? '60px' : '0px'})` 
        }}
      >
        <div className="max-w-7xl mx-auto fade-in">
          <h1 className="text-2xl font-semibold mb-6 slide-in-left">
            {t(title) || title}
          </h1>
          <div className="slide-in-right">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}