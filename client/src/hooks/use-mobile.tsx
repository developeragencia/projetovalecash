import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { isMobileDevice } from "@/pwaHelpers";

type MobileContextType = {
  isMobile: boolean;
};

const MobileContext = createContext<MobileContextType | null>(null);

export function MobileProvider({ children }: { children: ReactNode }) {
  // Força mobile para true para este caso específico, garantindo comportamento consistente
  const [isMobile, setIsMobile] = useState<boolean>(true);
  
  useEffect(() => {
    // Detectar se é um dispositivo móvel na inicialização
    setIsMobile(true);
    
    // Também monitorar mudanças no tamanho da janela
    const handleResize = () => {
      setIsMobile(true);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <MobileContext.Provider value={{ isMobile }}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile() {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error("useMobile must be used within a MobileProvider");
  }
  return context.isMobile;
}

// Alias para compatibilidade
export function useIsMobile() {
  return useMobile();
}