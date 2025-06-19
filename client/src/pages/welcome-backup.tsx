import React from 'react';
import { WelcomeScreens } from '@/components/ui/welcome-screens';
import { useLocation } from 'wouter';

export default function WelcomePage() {
  const [_, setLocation] = useLocation();

  const handleComplete = () => {
    // Redirecionar para auth após completar as telas de boas-vindas
    setLocation('/auth');
  };

  return (
    <div className="welcome-page-container min-h-screen w-full flex items-center justify-center bg-white" 
         style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      <WelcomeScreens onComplete={handleComplete} />
    </div>
  );
}