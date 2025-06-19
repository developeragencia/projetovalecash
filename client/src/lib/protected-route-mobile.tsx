import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Route, Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';
import { MobileLayout } from '@/components/ui/mobile-layout';

interface ProtectedRouteMobileProps {
  path: string;
  component: React.ComponentType<any>;
  userType?: string;
  title: string;
}

export function ProtectedRouteMobile({
  path,
  component: Component,
  userType,
  title,
}: ProtectedRouteMobileProps) {
  const { user, loading } = useAuth();

  // Se a autenticação estiver em andamento, mostrar carregamento
  if (loading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth/login" />
      </Route>
    );
  }

  // Se userType for especificado e não corresponder ao tipo do usuário
  if (userType && user.type !== userType) {
    // Redirecionar para o dashboard apropriado
    const redirectPath = `/${user.type}/dashboard`;
    return (
      <Route path={path}>
        <Redirect to={redirectPath} />
      </Route>
    );
  }

  // Usar sempre o layout móvel para esta rota
  return (
    <Route path={path}>
      <MobileLayout title={title}>
        <Component />
      </MobileLayout>
    </Route>
  );
}