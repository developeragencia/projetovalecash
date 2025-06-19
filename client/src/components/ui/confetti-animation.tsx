import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, DollarSign, Star, Heart, Sparkles } from 'lucide-react';

interface ConfettiAnimationProps {
  show: boolean;
  onComplete?: () => void;
  bonusAmount?: number;
  message?: string;
}

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({ 
  show, 
  onComplete, 
  bonusAmount = 10,
  message = "Parabéns! Você ganhou"
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; icon: any; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Criar partículas de confetti
      const newParticles = [];
      const colors = ['#3db54e', '#f58220', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
      const icons = [Gift, DollarSign, Star, Heart, Sparkles];

      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: -50,
          color: colors[Math.floor(Math.random() * colors.length)],
          icon: icons[Math.floor(Math.random() * icons.length)],
          delay: Math.random() * 2
        });
      }
      setParticles(newParticles);

      // Auto-complete após 4 segundos
      const timer = setTimeout(() => {
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
          style={{ background: 'rgba(0, 0, 0, 0.1)' }}
        >
          {/* Partículas de confetti */}
          {particles.map((particle) => {
            const IconComponent = particle.icon;
            return (
              <motion.div
                key={particle.id}
                initial={{ 
                  x: particle.x, 
                  y: particle.y,
                  scale: 0,
                  rotate: 0
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  scale: [0, 1, 1, 0],
                  rotate: 360
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: particle.delay,
                  ease: "easeOut"
                }}
                className="absolute"
              >
                <IconComponent 
                  size={16 + Math.random() * 8} 
                  color={particle.color}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
              </motion.div>
            );
          })}

          {/* Card central com mensagem de bônus */}
          <motion.div
            initial={{ scale: 0, y: -100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -100 }}
            transition={{ 
              type: "spring", 
              damping: 15, 
              stiffness: 300,
              delay: 0.5 
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-[#3db54e] max-w-sm mx-auto text-center">
              {/* Ícone principal animado */}
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="mb-4"
              >
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#3db54e] to-[#f58220] rounded-full flex items-center justify-center">
                  <Gift className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              {/* Mensagem principal */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="text-2xl font-bold text-gray-800 mb-2"
              >
                🎉 {message}
              </motion.h2>

              {/* Valor do bônus */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, type: "spring" }}
                className="mb-4"
              >
                <div className="inline-flex items-center bg-gradient-to-r from-[#3db54e] to-[#f58220] text-white px-6 py-3 rounded-full text-3xl font-bold">
                  <DollarSign className="w-8 h-8 mr-2" />
                  {bonusAmount.toFixed(2)}
                </div>
              </motion.div>

              {/* Descrição */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-gray-600 text-sm"
              >
                Seu bônus de boas-vindas já está disponível!<br />
                Use em suas próximas compras nas lojas parceiras.
              </motion.p>

              {/* Estrelas decorativas */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="flex justify-center mt-4 space-x-1"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.div
                    key={star}
                    animate={{ 
                      scale: [1, 1.3, 1],
                      rotate: [0, 360]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: star * 0.2
                    }}
                  >
                    <Star className="w-4 h-4 text-[#f58220] fill-current" />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Efeito de brilho de fundo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: 0.1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#3db54e] to-[#f58220] rounded-full blur-3xl"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfettiAnimation;