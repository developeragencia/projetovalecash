import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightCircle,
  Users,
  ShoppingBag,
  Wallet,
  CreditCard,
  Bell,
  ChevronRight,
  Percent,
  Star,
  Award,
  TrendingUp,
  Check,
  ChevronLeft,
  Gift,
  CreditCard as CreditCardIcon,
  DollarSign,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoPath from '@assets/LOGO-VALE-CASHBACK.SEM-FUNDO.png';

// Animações e estilos personalizados
const customStyles = `
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes shine {
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}

.floating {
  animation: float 6s ease-in-out infinite;
}

.pulse {
  animation: pulse 3s ease-in-out infinite;
}

.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.icon-container {
  position: relative;
  overflow: hidden;
}

.icon-container::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: rotate(30deg);
  animation: shine 3s infinite linear;
  pointer-events: none;
}

.gradient-text {
  background: linear-gradient(90deg, #3db54e, #f58220);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}

.primary-button {
  background: linear-gradient(90deg, #3db54e, #3db54e);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.primary-button:hover {
  background: linear-gradient(90deg, #3db54e, #33a043);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(61, 181, 78, 0.4);
}

.secondary-button {
  background: linear-gradient(90deg, #f58220, #f58220);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.secondary-button:hover {
  background: linear-gradient(90deg, #f58220, #e67300);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(245, 130, 32, 0.4);
}

.pagination-dot {
  transition: all 0.3s ease;
}

.pagination-dot.active {
  background: linear-gradient(90deg, #3db54e, #f58220);
  width: 30px;
}

/* Adiciona sombra suave nos cards */
.feature-card {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.feature-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

/* Estilo do indicador de progresso */
.progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin: 20px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3db54e, #f58220);
  transition: width 0.5s ease;
}
`;

export default function WelcomeEnhancedPage() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Determina quando o usuário já viu a página de boas-vindas
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('has_seen_welcome');
    if (hasSeenWelcome) {
      // Se já viu, redireciona para a página de login
      window.location.href = "/auth/login";
    } else {
      setHasStarted(true);
    }
  }, []);

  const handleComplete = () => {
    // Marcar como visto para que não apareça novamente
    localStorage.setItem('has_seen_welcome', 'true');
    // Redirecionar para a página de login
    window.location.href = "/auth/login";
  };

  // Telas com conteúdo
  const screens = [
    {
      title: "Bem-vindo ao Vale Cashback",
      subtitle: "🎁 GANHE $10 GRÁTIS AO SE CADASTRAR! 🎁",
      description: "Cadastre-se agora e receba $10 automaticamente no seu saldo! Mais cashback de 2% em todas as compras.",
      mainIcon: <Wallet className="w-24 h-24 text-[#3db54e]" />,
      features: [
        { 
          icon: <Gift className="w-8 h-8 text-[#f58220]" />,
          title: "💰 BÔNUS DE $10 GRÁTIS!", 
          description: "Receba $10 automaticamente no seu saldo assim que finalizar seu cadastro!" 
        },
        { 
          icon: <Gift className="w-6 h-6 text-[#f58220]" />,
          title: "Programa de Referência", 
          description: "Indique amigos e ganhe bônus em cada compra que eles fizerem." 
        },
        { 
          icon: <CreditCardIcon className="w-6 h-6 text-[#3db54e]" />,
          title: "Pagamentos Simplificados", 
          description: "Realize pagamentos rápidos e seguros através de QR Code." 
        }
      ]
    },
    {
      title: "Benefícios para Clientes",
      subtitle: "Economize e ganhe em cada transação",
      description: "Transforme suas compras do dia a dia em economia real e oportunidades de crescimento.",
      mainIcon: <Award className="w-24 h-24 text-[#f58220]" />,
      features: [
        { 
          icon: <Gift className="w-6 h-6 text-[#f58220]" />,
          title: "🎁 Bônus de $10 Grátis", 
          description: "Ganhe $10 automaticamente ao se cadastrar para usar em suas primeiras compras!" 
        },
        { 
          icon: <Star className="w-6 h-6 text-[#f58220]" />,
          title: "Cashback Garantido", 
          description: "Ganhe dinheiro de volta em todas as suas compras nas lojas parceiras." 
        },
        { 
          icon: <Users className="w-6 h-6 text-[#3db54e]" />,
          title: "Bônus por Indicação", 
          description: "Ganhe 1% adicional nas compras dos amigos que você indicar." 
        },
        { 
          icon: <TrendingUp className="w-6 h-6 text-[#f58220]" />,
          title: "Transferências Rápidas", 
          description: "Transfira seu cashback para sua conta bancária quando quiser." 
        }
      ]
    },
    {
      title: "Vantagens para Lojistas",
      subtitle: "Aumente suas vendas e fidelize clientes",
      description: "Atraia mais clientes, aumente seu faturamento e construa relacionamentos duradouros.",
      mainIcon: <ShoppingBag className="w-24 h-24 text-[#3db54e]" />,
      features: [
        { 
          icon: <Percent className="w-6 h-6 text-[#3db54e]" />,
          title: "Comissões Competitivas", 
          description: "Taxas justas e transparentes para cada transação realizada." 
        },
        { 
          icon: <Smartphone className="w-6 h-6 text-[#f58220]" />,
          title: "App Responsivo", 
          description: "Gerencie seu negócio de qualquer lugar através do seu celular." 
        },
        { 
          icon: <Check className="w-6 h-6 text-[#3db54e]" />,
          title: "Relatórios Detalhados", 
          description: "Acompanhe vendas, clientes e tendências com análises avançadas." 
        }
      ]
    },
    {
      title: "Comece Agora",
      subtitle: "Tudo pronto para você aproveitar",
      description: "Junte-se aos milhares de usuários que já estão economizando e crescendo com o Vale Cashback.",
      mainIcon: <ArrowRightCircle className="w-24 h-24 text-[#f58220]" />,
      features: [
        { 
          icon: <Check className="w-6 h-6 text-[#3db54e]" />,
          title: "Cadastro Rápido", 
          description: "Crie sua conta em menos de 2 minutos e comece a usar." 
        },
        { 
          icon: <Bell className="w-6 h-6 text-[#f58220]" />,
          title: "Notificações Automáticas", 
          description: "Receba alertas sobre cashback e novas oportunidades." 
        },
        { 
          icon: <Users className="w-6 h-6 text-[#3db54e]" />,
          title: "Suporte Personalizado", 
          description: "Nossa equipe está sempre disponível para ajudar você." 
        }
      ]
    }
  ];

  // Navegar para a próxima tela
  const nextScreen = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      handleComplete();
    }
  };

  // Navegar para a tela anterior
  const prevScreen = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  // Progresso (percentual)
  const progress = ((currentScreen + 1) / screens.length) * 100;

  // Animação das features
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="pulse">
          <img src={logoPath} alt="Vale Cashback" className="h-20 w-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      {/* Estilos injetados */}
      <style>{customStyles}</style>

      <div className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="floating"
          >
            <img src={logoPath} alt="Vale Cashback" className="h-16 md:h-20 w-auto" />
          </motion.div>
        </div>

        {/* Barra de progresso */}
        <div className="progress-bar">
          <motion.div 
            className="progress-fill"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Conteúdo principal com transição */}
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl mx-auto"
            >
              {/* Ícone principal */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex justify-center mb-6"
              >
                <div className="p-6 rounded-full bg-gray-50 shadow-md icon-container">
                  {screens[currentScreen].mainIcon}
                </div>
              </motion.div>

              {/* Título e subtítulo */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-center mb-8"
              >
                <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text">
                  {screens[currentScreen].title}
                </h1>
                <h2 className="text-xl text-gray-600">
                  {screens[currentScreen].subtitle}
                </h2>
                <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                  {screens[currentScreen].description}
                </p>
              </motion.div>

              {/* Cards de features */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
              >
                {screens[currentScreen].features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    className="feature-card card-hover bg-white rounded-xl p-6 flex flex-col items-center text-center"
                    style={{
                      border: idx % 2 === 0 
                        ? '1px solid rgba(61, 181, 78, 0.2)' 
                        : '1px solid rgba(245, 130, 32, 0.2)'
                    }}
                  >
                    <div className="mb-4 p-3 rounded-full" style={{
                      background: idx % 2 === 0 
                        ? 'rgba(61, 181, 78, 0.1)' 
                        : 'rgba(245, 130, 32, 0.1)'
                    }}>
                      {feature.icon}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Indicadores de página */}
              <div className="flex justify-center gap-2 mb-8">
                {screens.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentScreen(idx)}
                    className={`pagination-dot h-2 rounded-full ${
                      idx === currentScreen ? 'active' : 'bg-gray-300 w-10'
                    }`}
                    aria-label={`Ir para slide ${idx + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Botões de navegação */}
        <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
          {currentScreen < screens.length - 1 ? (
            <>
              <Button 
                onClick={nextScreen}
                className="primary-button py-6 rounded-xl text-white text-lg font-medium"
              >
                Próximo <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleComplete}
                className="py-4 rounded-xl border-gray-300 font-medium"
              >
                Pular Introdução
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={handleComplete}
                className="secondary-button py-6 rounded-xl text-white text-lg font-medium"
              >
                Começar Agora <ArrowRightCircle className="ml-2 w-5 h-5" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={prevScreen}
                className="py-4 rounded-xl border-gray-300 font-medium"
              >
                <ChevronLeft className="mr-2 w-5 h-5" /> Voltar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}