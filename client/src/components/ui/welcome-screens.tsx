import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ShoppingCart, Users, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import '@/styles/welcome-screens.css';

interface WelcomeScreensProps {
  onComplete: () => void;
}

export function WelcomeScreens({ onComplete }: WelcomeScreensProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const screens = [
    {
      icon: <ShoppingCart size={80} className="welcome-icon" />,
      title: 'Compre e ganhe cashback',
      description: 'Faça compras nas lojas participantes e receba cashback em todas as suas transações.'
    },
    {
      icon: <Percent size={80} className="welcome-icon" />,
      title: 'Acumule benefícios',
      description: 'Quanto mais você utiliza o sistema, mais cashback acumula para usar em suas próximas compras.'
    },
    {
      icon: <Users size={80} className="welcome-icon" />,
      title: 'Indique e ganhe mais',
      description: 'Convide amigos para usar o Vale Cashback e ganhe bônus extras em cada compra deles.'
    }
  ];

  const nextScreen = () => {
    if (currentScreen < screens.length - 1) {
      setDirection(1);
      setCurrentScreen(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevScreen = () => {
    if (currentScreen > 0) {
      setDirection(-1);
      setCurrentScreen(prev => prev - 1);
    }
  };

  const skipAll = () => {
    onComplete();
  };

  // Variantes para animação de slide
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="welcome-container">
      {/* Fundo com gradiente sutil */}
      <div className="welcome-background"></div>
      
      {/* Ondas decorativas */}
      <div className="welcome-waves">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="welcome-content">
        {/* Indicadores de progresso */}
        <div className="progress-indicators">
          {screens.map((_, index) => (
            <div 
              key={index}
              className={`progress-dot ${index === currentScreen ? 'active' : ''}`}
              onClick={() => {
                setDirection(index > currentScreen ? 1 : -1);
                setCurrentScreen(index);
              }}
            />
          ))}
        </div>
        
        {/* Slides animados */}
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={currentScreen}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.5 }
            }}
            className="welcome-slide"
          >
            {/* Ícone animado */}
            <motion.div 
              className="icon-container"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {screens[currentScreen].icon}
              <div className="icon-glow"></div>
            </motion.div>
            
            {/* Título e descrição */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="welcome-title"
            >
              {screens[currentScreen].title}
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="welcome-description"
            >
              {screens[currentScreen].description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
        
        {/* Botões de navegação */}
        <div className="welcome-actions">
          {currentScreen < screens.length - 1 ? (
            <>
              <Button 
                variant="ghost" 
                className="skip-button"
                onClick={skipAll}
              >
                Pular
              </Button>
              <Button 
                className="next-button"
                onClick={nextScreen}
              >
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button 
              className="start-button"
              onClick={onComplete}
            >
              Começar agora
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}