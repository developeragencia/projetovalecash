import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation, cubicBezier } from 'framer-motion';
import { 
  ChevronRight, 
  ShoppingCart, 
  Users, 
  Percent, 
  Wallet, 
  ArrowUpRight, 
  CreditCard, 
  Sparkles,
  Gift,
  RefreshCw,
  ArrowRight,
  DollarSign,
  Star,
  ShieldCheck,
  Coins,
  ChevronsRight,
  Zap,
  BadgeCheck,
  BarChart3,
  Share2,
  Heart,
  Award,
  MoveRight,
  ArrowDownCircle,
  Globe,
  MessageCircleHeart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useTranslation } from '@/hooks/use-translation';
import logoImage from "@assets/LOGO-VALE-CASHBACK.SEM-FUNDO.png";
import cashbankImage from "@assets/image_1747674179202.png";

export default function WelcomeStaticPage() {
  const [_, setLocation] = useLocation();
  const [currentScreen, setCurrentScreen] = useState(0);
  const { t } = useTranslation();
  const [animatedValue, setAnimatedValue] = useState(0);
  
  // Efeito de contador para animação percentual
  useEffect(() => {
    if (currentScreen === 1) {
      let interval = setInterval(() => {
        setAnimatedValue(prev => {
          if (prev < 15) return prev + 1;
          clearInterval(interval);
          return 15;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
    
    return () => setAnimatedValue(0);
  }, [currentScreen]);
  
  const screens = [
    {
      icon: <ShoppingCart size={80} className="text-green-500" />,
      title: 'Sistema Completo de Cashback',
      description: 'Uma plataforma integrada que conecta compradores e lojistas com benefícios financeiros para ambos.',
      visual: (
        <div className="w-full relative mt-6 mb-2">
          <motion.div 
            className="absolute z-10 top-[-10px] right-[-10px] bg-orange-400 rounded-full p-2 shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Sparkles className="h-6 w-6 text-white" />
          </motion.div>
          <motion.div 
            className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-md overflow-hidden border border-green-100"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            whileHover={{ 
              boxShadow: "0 8px 30px rgba(0, 166, 0, 0.1)",
              y: -5,
              transition: { duration: 0.3 }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-500 rounded-full p-2">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium">Compra realizada</p>
                  <p className="text-xs text-gray-500">Loja: Café Premium</p>
                </div>
              </div>
              <motion.p 
                className="font-bold text-green-700"
                initial={{ scale: 0.9 }}
                animate={{ scale: [0.9, 1.1, 1] }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                R$100,00
              </motion.p>
            </div>
            
            <div className="border-t border-green-100 my-3"></div>
            
            <motion.div 
              className="flex items-center bg-green-100 rounded-lg p-2 mt-2"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <RefreshCw className="h-5 w-5 text-green-500 mr-2" />
              <motion.p 
                className="text-sm text-green-700 font-semibold"
                initial={{ opacity: 1 }}
                animate={{ 
                  textShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 5px rgba(0,166,0,0.5)", "0px 0px 0px rgba(0,0,0,0)"]
                }}
                transition={{ delay: 1, duration: 2, repeat: Infinity, repeatDelay: 2 }}
              >
                Cashback recebido: R$8,00
              </motion.p>
            </motion.div>
            
            {/* Moedas animadas caindo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                initial={{ y: -20, x: 30, opacity: 0 }}
                animate={{ 
                  y: 100,
                  opacity: [0, 1, 1, 0],
                  rotate: [0, 30, 60, 90]
                }}
                transition={{ 
                  duration: 2,
                  delay: 1,
                  times: [0, 0.3, 0.8, 1]
                }}
                className="absolute text-orange-400"
              >
                <Coins size={16} />
              </motion.div>
              
              <motion.div
                initial={{ y: -20, x: 50, opacity: 0 }}
                animate={{ 
                  y: 120,
                  opacity: [0, 1, 1, 0],
                  rotate: [0, -20, -40, -60]
                }}
                transition={{ 
                  duration: 2.2,
                  delay: 1.2,
                  times: [0, 0.3, 0.8, 1]
                }}
                className="absolute text-orange-400"
              >
                <Coins size={12} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      )
    },
    {
      icon: <Wallet size={80} className="text-orange-500" />,
      title: 'Crescimento através de Indicações',
      description: 'Amplie sua rede e aumente sua receita convidando novos usuários para a plataforma.',
      visual: (
        <div className="w-full relative mt-4 mb-2">
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-50 rounded-2xl shadow-lg overflow-hidden border border-blue-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ 
              boxShadow: "0 10px 40px rgba(59, 130, 246, 0.15)",
              y: -5,
              transition: { duration: 0.3 }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm"
            >
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <Percent className="h-6 w-6 text-blue-600" />
              </div>
              <motion.span 
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-sky-600"
                animate={{ 
                  scale: [1, 1.08, 1],
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                {animatedValue}%
              </motion.span>
              <p className="text-xs text-gray-600 mt-1">Taxa de Comissão</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="h-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm"
            >
              <motion.div
                animate={{ 
                  y: [0, -3, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="bg-blue-100 p-3 rounded-full mb-2"
              >
                <Users className="h-6 w-6 text-blue-600" />
              </motion.div>
              <motion.span 
                className="text-lg font-semibold"
                animate={{ color: ["#3B82F6", "#0EA5E9", "#3B82F6"] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                52
              </motion.span>
              <p className="text-xs text-gray-600 mt-1">Novos Indicados</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="h-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                }}
                className="bg-blue-100 p-3 rounded-full mb-2"
              >
                <Gift className="h-6 w-6 text-blue-600" />
              </motion.div>
              <motion.span 
                className="text-lg font-semibold"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  textShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 5px rgba(59, 130, 246, 0.5)", "0px 0px 0px rgba(0,0,0,0)"]
                }}
                transition={{ 
                  opacity: { duration: 0.6, delay: 0.7 },
                  textShadow: { delay: 1.2, duration: 2, repeat: Infinity }
                }}
              >
                R$ 267,40
              </motion.span>
              <p className="text-xs text-gray-600 mt-1">Comissão Total</p>
            </motion.div>
            
            {/* Partículas flutuantes */}
            <motion.div
              className="absolute right-4 bottom-4"
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity
              }}
            >
              <Star size={12} className="text-amber-300" />
            </motion.div>
          </motion.div>
        </div>
      )
    },
    {
      icon: <ShieldCheck size={80} className="text-emerald-500" />,
      title: 'Benefícios para Todos',
      description: 'Maximize seus retornos enquanto os clientes economizam e os lojistas aumentam suas vendas.',
      visual: (
        <div className="w-full relative mt-4 mb-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-3 gap-2 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl shadow-md border border-green-100"
            whileHover={{ 
              boxShadow: "0 8px 30px rgba(16, 185, 129, 0.1)",
              y: -5,
              transition: { duration: 0.3 }
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm"
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
              >
                <Users className="h-8 w-8 text-orange-500 mb-2" />
              </motion.div>
              <h3 className="text-xs font-bold text-gray-700">Clientes</h3>
              <p className="text-[10px] text-center text-gray-600 mt-1">Economizam em cada compra</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm"
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "mirror", delay: 0.3 }}
              >
                <ShoppingCart className="h-8 w-8 text-green-500 mb-2" />
              </motion.div>
              <h3 className="text-xs font-bold text-gray-700">Lojistas</h3>
              <p className="text-[10px] text-center text-gray-600 mt-1">Aumentam vendas</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm"
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "mirror", delay: 0.6 }}
              >
                <Gift className="h-8 w-8 text-amber-500 mb-2" />
              </motion.div>
              <h3 className="text-xs font-bold text-gray-700">Indicadores</h3>
              <p className="text-[10px] text-center text-gray-600 mt-1">Ganham comissão</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="col-span-3 mt-2 bg-gradient-to-r from-green-100 to-emerald-100 p-2 rounded-lg flex items-center justify-center"
              whileHover={{ 
                boxShadow: "0 2px 10px rgba(16, 185, 129, 0.2)",
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, 0, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity },
                  scale: { duration: 3, repeat: Infinity }
                }}
              >
                <Sparkles className="h-4 w-4 text-emerald-500 mr-1" />
              </motion.div>
              <p className="text-xs font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500">
                Ecossistema completo de benefícios
              </p>
            </motion.div>
            
            {/* Elemento de decoração flutuante */}
            <motion.div
              className="absolute -bottom-2 -right-2 text-orange-400"
              animate={{ 
                rotate: [0, 10, 0, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity
              }}
            >
              <Star size={14} />
            </motion.div>
          </motion.div>
        </div>
      )
    }
  ];

  const nextScreen = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(prev => prev + 1);
    } else {
      // Marca que o usuário já viu a tela de boas-vindas
      localStorage.setItem('has_seen_welcome', 'true');
      // Redirecionar para login após completar as telas de boas-vindas
      setLocation('/login');
    }
  };

  const skipAll = () => {
    // Marca que o usuário já viu a tela de boas-vindas
    localStorage.setItem('has_seen_welcome', 'true');
    setLocation('/login');
  };

  // Gerar elementos de partículas
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 5,
      duration: Math.random() * 10 + 5,
      delay: Math.random() * 2,
      type: i % 3
    }));
  }, []);

  // Configurar animações do logo
  const logoControls = useAnimation();
  
  useEffect(() => {
    const sequence = async () => {
      await logoControls.start({ 
        scale: [0.8, 1.1, 1],
        rotate: [0, 10, 0],
        transition: { duration: 1.5 }
      });
      
      logoControls.start({
        y: [0, -10, 0],
        filter: ["drop-shadow(0 0 0px rgba(59, 130, 246, 0))", "drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))", "drop-shadow(0 0 0px rgba(59, 130, 246, 0))"],
        transition: { 
          y: { repeat: Infinity, duration: 3, repeatType: "reverse" },
          filter: { repeat: Infinity, duration: 3, repeatType: "reverse" }
        }
      });
    };
    
    sequence();
  }, [logoControls]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200 p-2 sm:p-4 overflow-hidden" 
         style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      {/* Elementos de fundo animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Círculos decorativos com efeito de gradiente e blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 0.3,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            opacity: { duration: 1.5 },
            scale: { duration: 8, repeat: Infinity, repeatType: "reverse" }
          }}
          className="absolute top-[-10%] right-[-5%] w-64 h-64 rounded-full bg-gradient-to-br from-blue-300 to-sky-200 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 0.3,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            opacity: { duration: 1.5, delay: 0.3 },
            scale: { duration: 10, repeat: Infinity, repeatType: "reverse", delay: 0.5 }
          }}
          className="absolute bottom-[-10%] left-[-5%] w-72 h-72 rounded-full bg-gradient-to-tr from-cyan-300 to-blue-200 blur-3xl"
        />
        
        {/* Partículas flutuantes */}
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: `${particle.x}vw`, 
              y: `${particle.y}vh`, 
              opacity: 0,
              scale: 0.5
            }}
            animate={{ 
              y: [`${particle.y}vh`, `${particle.y - 15}vh`, `${particle.y}vh`],
              x: [`${particle.x}vw`, `${particle.x + (particle.id % 2 === 0 ? 5 : -5)}vw`, `${particle.x}vw`],
              opacity: [0.1, 0.7, 0.1],
              rotate: [0, 180, 360],
              scale: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut"
            }}
            className="absolute"
          >
            {particle.type === 0 ? (
              <Sparkles className="text-blue-400" style={{ width: particle.size, height: particle.size }} />
            ) : particle.type === 1 ? (
              <div className="rounded-full bg-sky-300" style={{ width: particle.size/2, height: particle.size/2 }} />
            ) : (
              <Star className="text-sky-400" style={{ width: particle.size, height: particle.size }} />
            )}
          </motion.div>
        ))}
        
        {/* Adicionar mais efeitos de fundo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 0.2,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            opacity: { duration: 1.5, delay: 0.6 },
            scale: { duration: 12, repeat: Infinity, repeatType: "reverse" }
          }}
          className="absolute top-[30%] left-[-5%] w-48 h-48 rounded-full bg-gradient-to-br from-blue-200 to-sky-100 blur-3xl"
        />
        
        {/* Linhas decorativas animadas */}
        <svg className="absolute top-10 right-10 opacity-20 hidden sm:block" width="150" height="150" viewBox="0 0 100 100">
          <motion.path
            d="M20,50 C20,20 80,20 80,50 C80,80 20,80 20,50 Z"
            fill="none"
            stroke="#2563EB"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 0.7,
              rotate: [0, 360]
            }}
            transition={{ 
              pathLength: { duration: 2, ease: "easeInOut" },
              opacity: { duration: 1 },
              rotate: { duration: 60, repeat: Infinity, ease: "linear" }
            }}
          />
        </svg>
        
        <svg className="absolute bottom-10 left-10 opacity-20 hidden sm:block" width="120" height="120" viewBox="0 0 100 100">
          <motion.path
            d="M30,30 L70,30 L70,70 L30,70 Z"
            fill="none"
            stroke="#0284C7"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 0.7,
              rotate: [0, -360]
            }}
            transition={{ 
              pathLength: { duration: 2, ease: "easeInOut" },
              opacity: { duration: 1 },
              rotate: { duration: 50, repeat: Infinity, ease: "linear" }
            }}
          />
        </svg>
        
        {/* Partículas animadas fluidas */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ 
            y: [null, 0, 100, 200, 300],
            opacity: [0, 0.7, 0.7, 0.7, 0]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            repeatType: "loop"
          }}
          className="absolute left-[10%] top-[10%] w-6 h-6 text-blue-400"
        >
          <DollarSign size={20} />
        </motion.div>
        
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ 
            y: [null, 0, 100, 200, 300],
            opacity: [0, 0.7, 0.7, 0.7, 0],
            x: [null, 10, -10, 20, -20]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity,
            repeatType: "loop",
            delay: 2
          }}
          className="absolute right-[20%] top-[15%] w-6 h-6 text-orange-400"
        >
          <Coins size={20} />
        </motion.div>
        
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ 
            y: [null, 0, 100, 200, 300],
            opacity: [0, 0.7, 0.7, 0.7, 0],
            x: [null, -15, 15, -25, 25]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity,
            repeatType: "loop",
            delay: 4
          }}
          className="absolute left-[30%] top-[5%] w-6 h-6 text-green-500"
        >
          <Percent size={20} />
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="welcome-container w-[95%] sm:w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-100"
      >
        <div className="p-4 sm:p-8">
          {/* Logo */}
          <motion.div 
            className="flex justify-center mb-4 sm:mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo do Vale Cashback */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 360 }}
              transition={{ 
                duration: 1.5, 
                delay: 0.5,
                ease: "easeInOut"
              }}
              className="flex flex-col items-center"
            >
              <motion.img 
                src={logoImage} 
                alt="Vale Cashback" 
                className="h-20 sm:h-28 mb-2"
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                initial={{ y: -20, opacity: 0 }}
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  filter: ["drop-shadow(0 0 0px rgba(0,0,0,0))", "drop-shadow(0 0 8px rgba(0,166,0,0.5))"]
                }}
                transition={{ 
                  duration: 0.8,
                  filter: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                }}
              />
              <motion.div 
                className="text-gray-600 text-sm font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                Sistema completo de Cashback e Indicações
              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Conteúdo do slide atual */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div 
                className="p-4 sm:p-5 rounded-full bg-blue-100 mb-3 sm:mb-5 shadow-lg"
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="text-blue-600">
                  {screens[currentScreen].icon}
                </div>
              </motion.div>
              <motion.h2 
                className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-700"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                {screens[currentScreen].title}
              </motion.h2>
              <motion.p 
                className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-5"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                {screens[currentScreen].description}
              </motion.p>
              
              {/* Visualização customizada */}
              {screens[currentScreen].visual}
            </motion.div>
          </AnimatePresence>
          
          {/* Indicadores de progresso */}
          <div className="flex justify-center space-x-3 my-4 sm:my-6">
            {screens.map((_, index) => (
              <motion.div 
                key={index} 
                className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ease-in-out ${
                  index === currentScreen 
                    ? 'bg-blue-500 w-5 sm:w-6' 
                    : 'bg-gray-200 w-2 sm:w-2.5'
                }`}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              />
            ))}
          </div>
          
          {/* Botões de navegação com efeitos */}
          <motion.div 
            className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {currentScreen < screens.length - 1 ? (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="order-2 sm:order-1 w-full sm:w-auto"
                >
                  <Button 
                    variant="ghost" 
                    onClick={skipAll}
                    className="w-full sm:w-auto text-blue-500 hover:bg-blue-50/50 hover:text-blue-600 transition-all duration-300"
                  >
                    Pular Introdução
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="order-1 sm:order-2 w-full sm:w-auto"
                >
                  <Button 
                    onClick={nextScreen}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 shadow-md hover:shadow-lg transition-all duration-300 text-white"
                  >
                    Próximo
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ 
                        repeat: Infinity, 
                        repeatType: "reverse", 
                        duration: 1,
                        repeatDelay: 1
                      }}
                      className="inline-flex"
                    >
                      <ChevronRight className="ml-1.5 h-4 w-4" />
                    </motion.div>
                  </Button>
                </motion.div>
              </>
            ) : (
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full"
              >
                <Button 
                  onClick={() => {
                    // Marca que o usuário já viu a tela de boas-vindas
                    localStorage.setItem('has_seen_welcome', 'true');
                    // Redirecionar diretamente para a página de login
                    window.location.href = '/login';
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 shadow-md hover:shadow-lg transition-all duration-300 text-white h-10 sm:h-auto py-2 px-4"
                >
                  <span className="mr-2">Acessar o Sistema</span>
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, 0, -10, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity
                    }}
                    className="inline-flex"
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}