import React from 'react';
import WelcomeStaticPage from './welcome-static';

/**
 * Este é um componente wrapper para garantir que a página de boas-vindas seja renderizada corretamente
 * sem ser afetada por redirecionamentos de autenticação ou outras lógicas de navegação
 */
export default function WelcomePage() {
  // Renderizar a página de boas-vindas diretamente
  return <WelcomeStaticPage />;
}