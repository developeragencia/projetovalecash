import React, { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth.tsx";
import { ThemeProvider } from "next-themes";
import { TranslationProvider } from "@/hooks/use-translation";
import { ProtectedRoute } from "./lib/protected-route";
import { ProtectedRouteMobile } from "./lib/protected-route-mobile";
import { MobileProvider } from "@/hooks/use-mobile";
import { SplashScreen } from "@/components/ui/splash-screen";
import { ModernPWAInstall } from "@/components/ui/modern-pwa-install";

// Auth Pages
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ForgotPassword from "@/pages/auth/forgot-password";
import PasswordReset from "@/pages/auth/password-reset";

// Client Pages
import ClientDashboard from "@/pages/client/dashboard";
import ClientTransactions from "@/pages/client/transactions";
import ClientTransfers from "@/pages/client/transfers";
import ClientQRCode from "@/pages/client/qr-code";
import ClientReferrals from "@/pages/client/referrals-new";
import ClientProfile from "@/pages/client/profile";
import ClientStores from "@/pages/client/stores";
import ClientScanner from "@/pages/client/scanner";
import ClientCashbacks from "@/pages/client/cashbacks";

// Merchant Pages
import MerchantDashboard from "@/pages/merchant/dashboard";
import MerchantSales from "@/pages/merchant/sales";
import MerchantProducts from "@/pages/merchant/products";
import MerchantScanner from "@/pages/merchant/scanner";
import MerchantCustomers from "@/pages/merchant/customers";
import MerchantProfile from "@/pages/merchant/profile";
import MerchantTransactions from "@/pages/merchant/transactions";
import MerchantTransactionManagement from "@/pages/merchant/transaction-management";
import MerchantReports from "@/pages/merchant/reports";
import MerchantSettings from "@/pages/merchant/settings";
import MerchantSupport from "@/pages/merchant/support";
import MerchantReferrals from "@/pages/merchant/referrals";
import MerchantStores from "@/pages/merchant/stores";
import MerchantWithdrawals from "@/pages/merchant/withdrawals-new";
import MerchantSalaries from "@/pages/merchant/salaries";
import MerchantPaymentQR from "@/pages/merchant/payment-qr";
import MerchantPayment from "@/pages/merchant/payment";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminMerchants from "@/pages/admin/merchants";
import AdminTransactions from "@/pages/admin/transactions";
import AdminTransfers from "@/pages/admin/transfers";
import AdminWithdrawals from "@/pages/admin/withdrawals";
import AdminReports from "@/pages/admin/reports";
import AdminSettings from "@/pages/admin/settings";
import AdminBrandSettings from "@/pages/admin/brand-settings";
import AdminLogs from "@/pages/admin/logs";
import AdminSupport from "@/pages/admin/support";
import AdminProfile from "@/pages/admin/profile";
import AdminReports from "@/pages/admin/reports";

// Welcome Pages
import WelcomePage from "@/pages/welcome";
import WelcomeSimplePage from "@/pages/welcome-simple";
import WelcomeStaticPage from "@/pages/welcome-static";
import InvitePage from "@/pages/invite";
import NotFound from "@/pages/not-found";
import DownloadsPage from "@/pages/downloads";

function Router() {
  return (
    <Switch>
      {/* Welcome Page */}
      <Route path="/" component={WelcomePage} />
      <Route path="/welcome" component={WelcomePage} />
      <Route path="/welcome-simple" component={WelcomeSimplePage} />
      
      {/* Auth Routes */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/password-reset" component={PasswordReset} />
      <Route path="/auth" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/password-reset" component={PasswordReset} />
      <Route path="/downloads" component={DownloadsPage} />
      
      {/* Invitation Routes */}
      <Route path="/convite/:code" component={(props) => <InvitePage {...props} />} />
      <Route path="/parceiro/:code" component={(props) => <InvitePage {...props} />} />
      <Route path="/invite" component={(props) => <InvitePage {...props} />} />
      <Route path="/convite" component={(props) => <InvitePage {...props} />} />
      
      {/* Client Routes */}
      <ProtectedRouteMobile path="/client" component={ClientDashboard} userType="client" title="Dashboard" />
      <ProtectedRouteMobile path="/client/dashboard" component={ClientDashboard} userType="client" title="Dashboard" />
      <ProtectedRouteMobile path="/client/transactions" component={ClientTransactions} userType="client" title="Transações" />
      <ProtectedRouteMobile path="/client/transfers" component={ClientTransfers} userType="client" title="Transferências" />
      <ProtectedRouteMobile path="/client/qr-code" component={ClientQRCode} userType="client" title="QR Code" />
      <ProtectedRouteMobile path="/client/scanner" component={ClientScanner} userType="client" title="Pagar com QR Code" />
      <ProtectedRouteMobile path="/client/referrals" component={ClientReferrals} userType="client" title="Indicações" />
      <ProtectedRouteMobile path="/client/profile" component={ClientProfile} userType="client" title="Meu Perfil" />
      <ProtectedRouteMobile path="/client/stores" component={ClientStores} userType="client" title="Lojas" />
      <ProtectedRouteMobile path="/client/cashbacks" component={ClientCashbacks} userType="client" title="Cashback" />
      
      {/* Merchant Routes */}
      <ProtectedRouteMobile path="/merchant" component={MerchantDashboard} userType="merchant" title="Dashboard" />
      <ProtectedRouteMobile path="/merchant/dashboard" component={MerchantDashboard} userType="merchant" title="Dashboard" />
      <ProtectedRouteMobile path="/merchant/sales" component={MerchantSales} userType="merchant" title="Vendas" />
      <ProtectedRouteMobile path="/merchant/products" component={MerchantProducts} userType="merchant" title="Produtos" />
      <ProtectedRouteMobile path="/merchant/scanner" component={MerchantScanner} userType="merchant" title="Scanner" />
      <ProtectedRouteMobile path="/merchant/payment-qr" component={MerchantPaymentQR} userType="merchant" title="Gerar QR Code" />
      <ProtectedRouteMobile path="/merchant/customers" component={MerchantCustomers} userType="merchant" title="Clientes" />
      <ProtectedRouteMobile path="/merchant/profile" component={MerchantProfile} userType="merchant" title="Meu Perfil" />
      <ProtectedRouteMobile path="/merchant/transactions" component={MerchantTransactions} userType="merchant" title="Transações" />
      <ProtectedRouteMobile path="/merchant/transaction-management" component={MerchantTransactionManagement} userType="merchant" title="Gerenciar Transações" />
      <ProtectedRouteMobile path="/merchant/reports" component={MerchantReports} userType="merchant" title="Relatórios" />
      <ProtectedRouteMobile path="/merchant/settings" component={MerchantSettings} userType="merchant" title="Configurações" />
      <ProtectedRouteMobile path="/merchant/support" component={MerchantSupport} userType="merchant" title="Suporte" />
      <ProtectedRouteMobile path="/merchant/referrals" component={MerchantReferrals} userType="merchant" title="Indicações" />
      <ProtectedRouteMobile path="/merchant/stores" component={MerchantStores} userType="merchant" title="Lojas" />
      <ProtectedRouteMobile path="/merchant/withdrawals" component={MerchantWithdrawals} userType="merchant" title="Saques" />
      <ProtectedRouteMobile path="/merchant/salaries" component={MerchantSalaries} userType="merchant" title="Salários" />
      <ProtectedRouteMobile path="/merchant/payment" component={MerchantPayment} userType="merchant" title="Pagamento" />
      
      {/* Admin Routes */}
      <ProtectedRouteMobile path="/admin" component={AdminDashboard} userType="admin" title="Dashboard" />
      <ProtectedRouteMobile path="/admin/dashboard" component={AdminDashboard} userType="admin" title="Dashboard" />
      <ProtectedRouteMobile path="/admin/users" component={AdminUsers} userType="admin" title="Usuários" />
      <ProtectedRouteMobile path="/admin/merchants" component={AdminMerchants} userType="admin" title="Lojistas" />
      <ProtectedRouteMobile path="/admin/transactions" component={AdminTransactions} userType="admin" title="Transações" />
      <ProtectedRouteMobile path="/admin/transfers" component={AdminTransfers} userType="admin" title="Transferências" />
      <ProtectedRouteMobile path="/admin/withdrawals" component={AdminWithdrawals} userType="admin" title="Solicitações de Saque" />
      <ProtectedRouteMobile path="/admin/reports" component={AdminReports} userType="admin" title="Relatórios" />
      <ProtectedRouteMobile path="/admin/settings" component={AdminSettings} userType="admin" title="Configurações" />
      <ProtectedRouteMobile path="/admin/brand-settings" component={AdminBrandSettings} userType="admin" title="Configurações de Marca" />
      <ProtectedRouteMobile path="/admin/logs" component={AdminLogs} userType="admin" title="Logs e Auditoria" />
      <ProtectedRouteMobile path="/admin/support" component={AdminSupport} userType="admin" title="Suporte" />
      <ProtectedRouteMobile path="/admin/profile" component={AdminProfile} userType="admin" title="Meu Perfil" />
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TranslationProvider>
          <AuthProvider>
            <MobileProvider>
              <TooltipProvider>
                <Toaster />
                {showSplash ? (
                  <SplashScreen onFinish={handleSplashFinish} />
                ) : (
                  <div className="App">
                    <Router />
                    <ModernPWAInstall />
                  </div>
                )}
              </TooltipProvider>
            </MobileProvider>
          </AuthProvider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;