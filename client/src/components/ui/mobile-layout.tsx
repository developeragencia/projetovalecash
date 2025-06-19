import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Home, ShoppingBag, QrCode, Users, User, Settings, LogOut, Wallet, CreditCard, Info, Palette, Scan, BarChart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import { LanguageSelector } from '@/components/ui/language-selector';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  hideHeader?: boolean;
}

// Definição fixa dos menus para cada tipo de usuário
const menuItems = {
  client: [
    {
      path: '/client/dashboard',
      icon: <Home className="h-6 w-6" />,
      label: 'Home'
    },
    {
      path: '/client/scanner',
      icon: <Scan className="h-6 w-6" />,
      label: 'Pagar QR Code'
    },
    {
      path: '/client/stores',
      icon: <ShoppingBag className="h-6 w-6" />,
      label: 'Lojas'
    },
    {
      path: '/client/transfers',
      icon: <Wallet className="h-6 w-6" />,
      label: 'Transferir'
    },
    {
      path: '/client/cashbacks',
      icon: <CreditCard className="h-6 w-6" />,
      label: 'Cashback'
    }
  ],
  merchant: [
    {
      path: '/merchant/dashboard',
      icon: <Home className="h-5 w-5" />,
      label: 'Home'
    },
    {
      path: '/merchant/sales',
      icon: <ShoppingBag className="h-5 w-5" />,
      label: 'Vendas'
    },
    {
      path: '/merchant/payment-qr',
      icon: <QrCode className="h-5 w-5" />,
      label: 'QR Code'
    },
    {
      path: '/merchant/transactions',
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Transações'
    },
    {
      path: '/merchant/scanner',
      icon: <Scan className="h-5 w-5" />,
      label: 'Scanner'
    }
  ],
  admin: [
    {
      path: '/admin/dashboard',
      icon: <Home className="h-5 w-5" />,
      label: 'Home'
    },
    {
      path: '/admin/reports',
      icon: <BarChart className="h-5 w-5" />,
      label: 'Relatórios'
    },
    {
      path: '/admin/customers',
      icon: <Users className="h-5 w-5" />,
      label: 'Clientes'
    },
    {
      path: '/admin/merchants',
      icon: <ShoppingBag className="h-5 w-5" />,
      label: 'Lojistas'
    },
    {
      path: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
      label: 'Config'
    }
  ]
};

export function MobileLayout({ children, title, hideHeader = false }: MobileLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [menuOptions, setMenuOptions] = useState<any[]>([]);
  
  // Mapeamentos de tradução para labels dos menus
  const translateLabel = (label: string): string => {
    switch(label) {
      case 'Home': return t('common.home');
      case 'QR Code': return t('common.QRCode');
      case 'Lojas': return t('navigation.stores');
      case 'Transferir': return t('navigation.transfers');
      case 'Transferências': return t('common.Transferencias');
      case 'Dashboard': return t('common.Dashboard');
      case 'Painel': return t('common.Panel');
      case 'Cashback': return t('navigation.cashback');
      case 'Vendas': return t('navigation.sales');
      case 'Scanner': return t('navigation.scanner');
      case 'Transações': return t('navigation.transactions');
      case 'Pagar QR Code': return 'Pagar QR';
      case 'Indicações': return t('common.Referrals');
      case 'Lojistas': return t('navigation.merchants');
      case 'Clientes': return t('navigation.customers');
      case 'Config': return t('common.settings');
      case 'Perfil': return t('common.profile');
      case 'Login': return t('common.login');
      default: return label;
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Memoizamos a função de geração de menu
  useEffect(() => {
    // Atualiza o título da página com o idioma atual
    if (title) {
      document.title = `${t(title) || title} | Vale Cashback`;
    }
    
    // Se não houver usuário, use menu de login padrão
    if (!user) {
      const defaultMenu = Array(5).fill({
        path: '/login',
        icon: <User className="h-5 w-5" />,
        label: 'Login'
      });
      setMenuOptions(defaultMenu);
      return;
    }
    
    // Pega o tipo de usuário 
    const userType = user.type;
    
    // Verifica se o tipo é válido para o menuItems
    if (!userType || !menuItems[userType as keyof typeof menuItems]) {
      console.error(`Tipo de usuário inválido: ${userType}`);
      const defaultMenu = Array(5).fill({
        path: '/login',
        icon: <User className="h-5 w-5" />,
        label: 'Login'
      });
      setMenuOptions(defaultMenu);
      return;
    }
    
    // Clona as opções de menu para evitar mutações acidentais
    const userMenu = [...menuItems[userType as keyof typeof menuItems]];
    
    // Garante que sempre temos exatamente 5 itens de menu
    if (userMenu.length !== 5) {
      // Se tiver menos de 5, adiciona itens perfil até completar
      while (userMenu.length < 5) {
        userMenu.push({
          path: `/${userType}/profile`,
          icon: <User className="h-5 w-5" />,
          label: 'Perfil'
        });
      }
      // Se tiver mais de 5, remove os excedentes
      if (userMenu.length > 5) {
        userMenu.splice(5);
      }
    }
    
    // Log apenas em DEV para debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`Menu para tipo ${userType} carregado:`, userMenu);
    }
    
    setMenuOptions(userMenu);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.type]); // Dependências mínimas necessárias

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      {!hideHeader && (
        <header className="sticky top-0 z-50 w-full border-b bg-primary text-white shadow-md">
          <div className="container py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src="/valecashback-logo-white-text.png" 
                alt="Vale Cashback" 
                className="h-8 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <h1 className="text-xl font-semibold tracking-tight">
                {t(`common.${title}`) !== `common.${title}` ? t(`common.${title}`) : 
                 t(title) !== title ? t(title) : title}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSelector type="dropdown" size="sm" variant="ghost" />
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-primary-foreground/10"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-auto px-4 pb-20",
        hideHeader ? "pt-2" : "py-4"
      )}>
        {children}
      </main>

      {/* Bottom Navigation com grid fixo de 5 colunas e feedback visual melhorado */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-50">
        <div className="grid grid-cols-5 w-full py-2">
          {menuOptions.slice(0, 5).map((item, index) => {
            const isActive = location === item.path;
            return (
              <Link
                key={index}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-1 rounded-md text-xs font-medium transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <div className={cn(
                  "relative flex items-center justify-center",
                  isActive && "after:absolute after:content-[''] after:w-2 after:h-2 after:rounded-full after:-top-1 after:bg-primary"
                )}>
                  {item.icon}
                  {isActive && <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse-slow scale-150" />}
                </div>
                <span className={cn(
                  "mt-1 truncate text-[0.65rem]",
                  isActive && "font-bold"
                )}>
                  {translateLabel(item.label)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* PWA Status Bar Color */}
      <meta name="theme-color" content="#0466c8" />
    </div>
  );
}