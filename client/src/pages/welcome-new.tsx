import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Wallet, 
  Share2, 
  BadgeCheck, 
  DollarSign, 
  CreditCard, 
  Sparkles,
  MoveRight,
  Globe,
  MessageCircleHeart,
  ArrowDownCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// Importação de imagens usando urls relativas
const logoImage = "/LOGO-VALE-CASHBACK.SEM-FUNDO.png";
const logoImageMobile = "/image_1747679209990.png";

export default function WelcomeNewPage() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDownIndicator, setShowDownIndicator] = useState(true);

  // Iniciar animações ao carregar
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Remover indicador de rolagem após alguns segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDownIndicator(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Se o usuário já viu a tela de boas-vindas antes, redireciona para o login
  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_welcome');
    if (hasSeen === 'true') {
      window.location.href = '/login';
    }
  }, []);

  // Avançar para a próxima tela
  const nextScreen = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(prev => prev + 1);
    }
  };

  // Pular todas as telas e ir direto para o login
  const skipAll = () => {
    localStorage.setItem('has_seen_welcome', 'true');
    window.location.href = '/login';
  };

  // Configuração das telas de boas-vindas com ícones e textos
  const screens = [
    {
      icon: <ShoppingCart size={36} className="text-white" />,
      title: "Bem-vindo ao Vale Cashback",
      description: "Sua plataforma completa para lojistas e clientes ganharem com cashback em cada compra."
    },
    {
      icon: <Wallet size={36} className="text-white" />,
      title: "Cashback para todos",
      description: "Lojistas aumentam vendas, clientes ganham dinheiro de volta em todas as compras."
    },
    {
      icon: <MessageCircleHeart size={36} className="text-white" />,
      title: "Indique e Ganhe",
      description: "Convide amigos para o Vale Cashback e receba bônus por cada novo cadastro realizado."
    },
    {
      icon: <DollarSign size={36} className="text-white" />,
      title: "Fácil e Instantâneo",
      description: "Sistema intuitivo onde você acumula cashback e pode usar em novas compras imediatamente."
    },
    {
      icon: <Globe size={36} className="text-white" />,
      title: "Comece Agora",
      description: "Cadastre-se gratuitamente e comece a ganhar ou vender com cashback hoje mesmo!"
    }
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Fundo com gradiente animado */}
      <div className="absolute inset-0 animated-gradient-bg"></div>
      
      {/* Overlay pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgxMzUpIj48cGF0aCBkPSJNMCAwIGwxIDAgbDAgMSBsLTEgMCBsMCAtMSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMC41IiBmaWxsPSJub25lIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')] opacity-20"></div>
      
      {/* Bolhas decorativas com blur */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-blue-300 filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-purple-300 filter blur-3xl opacity-20"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-sky-300 filter blur-3xl opacity-10"></div>
      
      {/* Partículas flutuantes */}
      {Array.from({ length: 8 }).map((_, index) => (
        <motion.div
          key={`particle-${index}`}
          className="absolute z-0 rounded-full bg-white"
          style={{
            width: Math.random() * 8 + 2 + 'px',
            height: Math.random() * 8 + 2 + 'px',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, Math.random() * 200 - 100],
            x: [0, Math.random() * 200 - 100],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, Math.random() * 1.5 + 0.5, 1],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Ícones flutuantes */}
      <motion.div
        className="absolute left-[15%] top-[20%] text-white/30 hidden sm:block"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0.7, 1, 0.7],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      >
        <CreditCard size={40} />
      </motion.div>

      <motion.div
        className="absolute right-[20%] top-[70%] text-white/30 hidden sm:block"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0.7, 1, 0.7],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, -10, 10, 0]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1
        }}
      >
        <DollarSign size={40} />
      </motion.div>

      {/* Ondas decorativas na parte inferior */}
      <div className="wave-bg absolute bottom-0 left-0 w-full"></div>
      <div className="wave-bg wave-2 absolute bottom-0 left-0 w-full"></div>
      
      {/* Indicador de rolar para baixo (aparece brevemente) */}
      <AnimatePresence>
        {showDownIndicator && (
          <motion.div 
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/70"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "loop"
            }}
          >
            <ArrowDownCircle size={28} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Container principal */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Logo animado */}
          <motion.div 
            className="flex justify-center mb-8 sm:mb-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          >
            <div className="relative glow-effect rounded-full">
              <motion.img 
                src={logoImage} 
                alt="Vale Cashback" 
                className="h-24 sm:h-28 object-contain relative z-10 drop-shadow-xl hidden sm:block"
                animate={{ 
                  rotate: [0, -2, 2, -2, 0],
                  scale: [1, 1.02, 0.98, 1.02, 1]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut"
                }}
              />
              <motion.img 
                src={logoImageMobile} 
                alt="Vale Cashback" 
                className="h-20 object-contain relative z-10 drop-shadow-xl sm:hidden"
                animate={{ 
                  rotate: [0, -2, 2, -2, 0],
                  scale: [1, 1.02, 0.98, 1.02, 1]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
          
          {/* Card principal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
          >
            {/* Conteúdo das telas */}
            <div className="p-6 sm:p-8">
              {/* Slider das telas */}
              <div className="relative min-h-[280px] sm:min-h-[250px] flex flex-col justify-between">
                {/* Ícone e conteúdo da tela */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScreen}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-6"
                  >
                    {/* Ícone da tela com efeito de pulse */}
                    <motion.div 
                      className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-500/80 mb-4 sm:mb-5 shadow-lg backdrop-blur card-glow"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        {screens[currentScreen].icon}
                      </motion.div>
                    </motion.div>
                    
                    {/* Título da tela */}
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white"
                    >
                      {screens[currentScreen].title}
                    </motion.h2>
                    
                    {/* Descrição da tela */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="text-sm sm:text-base text-white/80 max-w-xs mx-auto"
                    >
                      {screens[currentScreen].description}
                    </motion.p>
                  </motion.div>
                </AnimatePresence>
                
                {/* Indicadores de progresso */}
                <div className="flex justify-center space-x-2 sm:space-x-3 mb-6">
                  {screens.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                        index === currentScreen
                          ? 'bg-white w-6 sm:w-8'
                          : 'bg-white/30 w-2 sm:w-3'
                      }`}
                      initial={{ opacity: 0.4, scale: 0.8 }}
                      animate={{ 
                        opacity: index === currentScreen ? 1 : 0.4,
                        scale: index === currentScreen ? 1 : 0.8
                      }}
                      transition={{ delay: index * 0.1 }}
                    />
                  ))}
                </div>
                
                {/* Botões de navegação */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0">
                  {currentScreen < screens.length - 1 ? (
                    <>
                      {/* Botão Pular */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="order-2 sm:order-1 w-full sm:w-auto"
                      >
                        <Button
                          variant="ghost"
                          onClick={skipAll}
                          className="w-full sm:w-auto text-white/80 hover:text-white hover:bg-white/10"
                        >
                          Pular Introdução
                        </Button>
                      </motion.div>
                      
                      {/* Botão Próximo */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="order-1 sm:order-2 w-full sm:w-auto"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Button
                          onClick={nextScreen}
                          className="w-full sm:w-auto bg-white text-blue-600 hover:bg-white/90 group"
                        >
                          Próximo
                          <motion.div
                            animate={{
                              x: [0, 4, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "easeInOut"
                            }}
                            className="ml-1"
                          >
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    // Botão Começar
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="w-full"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button
                        onClick={() => {
                          localStorage.setItem('has_seen_welcome', 'true');
                          window.location.href = '/login';
                        }}
                        className="w-full bg-white text-blue-600 hover:bg-white/90 relative button-highlight overflow-hidden h-11"
                      >
                        <span className="mr-2 relative z-10">Acessar o Sistema</span>
                        <motion.div
                          className="relative z-10"
                          animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.2, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity
                          }}
                        >
                          <Sparkles size={18} />
                        </motion.div>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Mensagem de direitos autorais na parte inferior */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 1.5 }}
            className="text-center mt-6 text-white/60 text-xs"
          >
            © {new Date().getFullYear()} Vale Cashback. Todos os direitos reservados.
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}