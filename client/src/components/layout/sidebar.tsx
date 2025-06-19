import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  List, 
  CreditCard, 
  QrCode, 
  Users, 
  User, 
  Settings, 
  LogOut,
  ShoppingCart,
  Package,
  Scan,
  Store,
  BarChart,
  FileText,
  Landmark,
  History,
  Headphones,
  Menu,
  X,
  Building2,
  Palette,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useTranslation } from "@/hooks/use-translation";

interface SidebarProps {
  type: "client" | "merchant" | "admin";
  userInfo: {
    name: string;
    status?: string;
    photo?: string;
    extraInfo?: string;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function Sidebar({ 
  type, 
  userInfo, 
  open = true, 
  onOpenChange,
  className 
}: SidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { t } = useTranslation();
  
  const clientLinks = [
    { href: "/client/dashboard", icon: <Home className="mr-2 h-5 w-5" />, label: t('common.Dashboard') },
    { href: "/client/transactions", icon: <List className="mr-2 h-5 w-5" />, label: t('navigation.transactions') },
    { href: "/client/transfers", icon: <CreditCard className="mr-2 h-5 w-5" />, label: t('navigation.transfers') },
    { href: "/client/qr-code", icon: <QrCode className="mr-2 h-5 w-5" />, label: t('common.QRCode') },
    { href: "/client/stores", icon: <Store className="mr-2 h-5 w-5" />, label: t('navigation.stores') },
    { href: "/client/referrals", icon: <Users className="mr-2 h-5 w-5" />, label: t('common.Referrals') },
    { href: "/client/profile", icon: <User className="mr-2 h-5 w-5" />, label: t('common.profile') },
  ];
  
  const merchantLinks = [
    { href: "/merchant/dashboard", icon: <Home className="mr-2 h-5 w-5" />, label: t('common.Dashboard') },
    { href: "/merchant/sales", icon: <ShoppingCart className="mr-2 h-5 w-5" />, label: t('merchant.registerSale') },
    { href: "/merchant/transactions", icon: <List className="mr-2 h-5 w-5" />, label: t('merchant.history') },
    { href: "/merchant/transaction-management", icon: <FileText className="mr-2 h-5 w-5" />, label: t('merchant.manageSales') },
    { href: "/merchant/withdrawals-new", icon: <Landmark className="mr-2 h-5 w-5" />, label: t('merchant.requestWithdrawal') },
    { href: "/merchant/products", icon: <Package className="mr-2 h-5 w-5" />, label: t('navigation.products') },
    { href: "/merchant/scanner", icon: <Scan className="mr-2 h-5 w-5" />, label: t('navigation.scanner') },
    { href: "/merchant/referrals", icon: <Users className="mr-2 h-5 w-5" />, label: t('common.Referrals') },
    { href: "/merchant/reports", icon: <BarChart className="mr-2 h-5 w-5" />, label: t('navigation.reports') },
    { href: "/merchant/profile", icon: <User className="mr-2 h-5 w-5" />, label: t('merchant.myStore') },
    { href: "/merchant/settings", icon: <Settings className="mr-2 h-5 w-5" />, label: t('common.settings') },
    { href: "/merchant/support", icon: <Headphones className="mr-2 h-5 w-5" />, label: t('merchant.support') },
  ];
  
  const adminLinks = [
    { href: "/admin/dashboard", icon: <Home className="mr-2 h-5 w-5" />, label: t('common.Dashboard') },
    { href: "/admin/users", icon: <Users className="mr-2 h-5 w-5" />, label: t('navigation.users') },
    { href: "/admin/customers", icon: <User className="mr-2 h-5 w-5" />, label: t('navigation.customers') },
    { href: "/admin/merchants", icon: <Store className="mr-2 h-5 w-5" />, label: t('navigation.merchants') },
    { href: "/admin/stores", icon: <Building2 className="mr-2 h-5 w-5" />, label: t('navigation.stores') },
    { href: "/admin/transactions", icon: <CreditCard className="mr-2 h-5 w-5" />, label: t('navigation.transactions') },
    { href: "/admin/transfers", icon: <Landmark className="mr-2 h-5 w-5" />, label: t('navigation.transfers') },
    { href: "/admin/withdrawals", icon: <DollarSign className="mr-2 h-5 w-5" />, label: t('navigation.withdrawals') },
    { href: "/admin/reports", icon: <BarChart className="mr-2 h-5 w-5" />, label: "Relatórios" },
    { href: "/admin/settings", icon: <Settings className="mr-2 h-5 w-5" />, label: t('common.settings') },
    { href: "/admin/brand-settings", icon: <Palette className="mr-2 h-5 w-5" />, label: 'Marca' },
    { href: "/admin/logs", icon: <History className="mr-2 h-5 w-5" />, label: t('navigation.logs') },
    { href: "/admin/support", icon: <Headphones className="mr-2 h-5 w-5" />, label: t('navigation.support') },
  ];
  
  const links = type === "client" 
    ? clientLinks 
    : type === "merchant" 
      ? merchantLinks 
      : adminLinks;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  const sidebarClass = cn(
    "flex flex-col h-full w-72 border-r shadow-lg",
    {
      "bg-gradient-to-b from-blue-600 to-blue-700 text-white": type === "client",
      "bg-gradient-to-b from-green-600 to-green-700 text-white": type === "merchant",
      "bg-gradient-to-b from-orange-500 to-orange-600 text-white": type === "admin"
    },
    className
  );
  
  const linkClass = (active: boolean) => cn(
    "flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
    {
      "hover:bg-white/15": !active,
      "bg-white/20 shadow-md": active
    }
  );
  
  return (
    <>
      {/* Mobile overlay */}
      {open && onOpenChange && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => onOpenChange(false)}
        />
      )}
      
      <aside 
        className={cn(
          sidebarClass,
          "fixed inset-y-0 left-0 z-50 md:relative",
          { "translate-x-0": open, "-translate-x-full": !open },
          "transition-transform duration-200 ease-in-out md:translate-x-0"
        )}
      >
        {/* Close button for mobile */}
        {onOpenChange && (
          <div className="md:hidden p-4 flex justify-end">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              <X size={24} />
            </Button>
          </div>
        )}
        
        {/* User info - Design moderno com cartão elevado */}
        <div className="p-6 border-b border-white/10">
          <div className="bg-white/10 rounded-2xl p-4 shadow-md backdrop-blur-sm">
            <div className="flex items-center mb-3">
              <Avatar className="h-14 w-14 mr-4 ring-2 ring-white/30 shadow-lg">
                <AvatarImage src={userInfo.photo || undefined} alt={userInfo.name} />
                <AvatarFallback className="bg-white/20 text-white font-medium">
                  {getInitials(userInfo.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-white">{userInfo.name}</div>
                <div className="text-xs text-white/80 mt-0.5 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-300 mr-1.5"></span>
                  {type === "client" ? "Cliente" : type === "merchant" ? "Lojista" : "Administrador"}
                  {userInfo.status && ` • ${userInfo.status}`}
                </div>
              </div>
            </div>
            {userInfo.extraInfo && (
              <div className="text-xs mt-1 text-white/70 bg-white/10 rounded-lg p-2 text-center">
                {userInfo.extraInfo}
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation - Design moderno com ícones maiores e espaçamento melhorado */}
        <ScrollArea className="flex-1">
          <nav className="px-4 py-6">
            <div className="mb-2 px-4 text-xs font-medium uppercase tracking-wider text-white/60">
              Menu Principal
            </div>
            <ul className="space-y-1.5">
              {links.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <div className={linkClass(location === link.href)}>
                      <div className={`rounded-lg ${location === link.href ? 'bg-white/20' : 'bg-white/10'} p-2 mr-3`}>
                        {React.cloneElement(link.icon, { 
                          className: "h-5 w-5", 
                          strokeWidth: location === link.href ? 2.5 : 2
                        })}
                      </div>
                      <span>{link.label}</span>
                    </div>
                  </Link>
                </li>
              ))}
              
              <li className="pt-6 mt-6 border-t border-white/10">
                <div className="mb-2 px-4 text-xs font-medium uppercase tracking-wider text-white/60">
                  Sistema
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-white/15 transition-all duration-200"
                >
                  <div className="rounded-lg bg-white/10 p-2 mr-3">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm">Sair</span>
                </button>
              </li>
            </ul>
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick}>
      <Menu className="h-5 w-5" />
    </Button>
  );
}
