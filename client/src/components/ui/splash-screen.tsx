import React, { useEffect, useState, useRef } from "react";
import "@/styles/splash-animation.css";

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

export function SplashScreen({ onFinish, duration = 3000 }: SplashScreenProps) {
  console.log("SplashScreen renderizada");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; delay: number }[]>([]);
  const particlesRef = useRef<HTMLDivElement>(null);

  // Mensagens de carregamento elegantes para o Vale Cashback
  const loadingMessages = [
    "Iniciando Vale Cashback...",
    "Preparando seu cashback...",
    "Carregando sistema de pagamentos...",
    "Configurando sua experiência...",
    "Finalizando...",
  ];

  const messageIndex = Math.min(
    Math.floor(loadingProgress / 25),
    loadingMessages.length - 1
  );

  // Gera partículas decorativas
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 5,
    }));
    
    setParticles(newParticles);
  }, []);

  // Efeito de simulação de carregamento
  useEffect(() => {
    console.log("SplashScreen montada, configurando temporizador");
    
    // Limpa o cache do navegador para evitar problemas de exibição
    try {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          // Exclui apenas caches antigos, preservando o cache do aplicativo para a funcionalidade offline
          if (!cacheName.includes('workbox') && !cacheName.includes('vale-cashback')) {
            caches.delete(cacheName);
          }
        });
      });
      console.log('Cache do navegador limpo com sucesso');
    } catch (err) {
      console.error('Erro ao limpar cache do navegador:', err);
    }
    
    // Progresso de carregamento com velocidade variável para parecer natural
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev < 60) {
          // Início mais rápido
          return Math.min(prev + (Math.random() * 8 + 3), 60);
        } else if (prev < 85) {
          // Meio mais moderado
          return Math.min(prev + (Math.random() * 5 + 1), 85);
        } else if (prev < 98) {
          // Final mais lento para sensação de "quase lá"
          return Math.min(prev + (Math.random() * 2 + 0.5), 98);
        } else {
          // Último passo
          return prev < 100 ? 100 : prev;
        }
      });
    }, 180);
    
    const timer = setTimeout(() => {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      // Pequeno delay após 100% para mostrar a experiência completa
      setTimeout(() => {
        console.log("Temporizador terminado, chamando onFinish");
        onFinish();
      }, 800);
    }, duration - 800);

    return () => {
      console.log("SplashScreen desmontada, limpando temporizador");
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onFinish]);

  // Função para criar raios de luz em ângulos diferentes
  const generateLightRays = () => {
    return Array.from({ length: 4 }, (_, i) => (
      <div 
        key={`light-ray-${i}`}
        className="light-ray"
        style={{
          transform: `rotate(${i * 45}deg)`,
        }}
      />
    ));
  };

  return (
    <div className="splash-clean-container">
      {/* Fundo com gradiente sutil */}
      <div className="splash-background-clean"></div>

      {/* Elementos decorativos */}
      <div className="splash-decoration">
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
        <div className="decoration-line"></div>
        <div className="decoration-line"></div>
      </div>

      {/* Partículas flutuantes sutis */}
      <div className="particles-clean" ref={particlesRef}>
        {particles.map((particle, index) => (
          <div
            key={`particle-${index}`}
            className="particle-clean"
            style={{
              width: `${particle.size * 10}px`,
              height: `${particle.size * 10}px`,
              left: `${particle.x * 100}%`,
              bottom: '20px',
              '--random-x': `${(Math.random() * 100 - 50)}px`,
              animationDelay: `${particle.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Logo com efeito de brilho */}
      <div className="logo-container-clean">
        {/* Efeito de raios de luz */}
        <div className="light-rays">
          {generateLightRays()}
        </div>
        
        <img
          src="/LOGO-VALE-CASHBACK.SEM-FUNDO.png"
          alt="Vale Cashback"
          className="logo-animation-clean"
          style={{ 
            maxWidth: '100%',
            width: '280px',
            height: 'auto',
          }}
        />
      </div>

      {/* Removido título para deixar apenas a logo */}

      {/* Barra de progresso moderna */}
      <div className="progress-container-clean">
        <div className="progress-bar-clean">
          <div 
            className="progress-fill-clean"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        
        <div className="progress-text-clean">
          <span>{Math.round(loadingProgress)}%</span>
          <span>Vale Cashback</span>
        </div>
        
        <div className="progress-message-clean">
          {loadingMessages[messageIndex]}
        </div>
      </div>

      {/* Indicador de carregamento com pontos */}
      <div className="dots-loader-clean">
        <div className="dot-clean"></div>
        <div className="dot-clean"></div>
        <div className="dot-clean"></div>
      </div>

      {/* Rodapé com copyright */}
      <div className="copyright-clean">
        © Vale Cashback {new Date().getFullYear()}
      </div>
    </div>
  );
}