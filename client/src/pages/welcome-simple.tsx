import React from 'react';
import { motion } from 'framer-motion';
import { Gift, DollarSign, ArrowRight, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoPath from '@assets/LOGO-VALE-CASHBACK.SEM-FUNDO.png';

export default function WelcomeSimplePage() {
  const handleGoToRegister = () => {
    window.location.href = "/auth/register";
  };

  const handleGoToLogin = () => {
    window.location.href = "/auth/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fffe] to-[#e8f5e8] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8"
      >
        <img src={logoPath} alt="Vale Cashback" className="h-20 w-auto" />
      </motion.div>

      {/* Título Principal */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800"
      >
        Bem-vindo ao Vale Cashback
      </motion.h1>

      {/* DESTAQUE DO BÔNUS DE $10 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="bg-gradient-to-r from-[#3db54e] to-[#f58220] p-8 rounded-3xl shadow-2xl mb-8 text-center max-w-md w-full"
      >
        <div className="bg-white rounded-2xl p-6">
          <Gift className="w-16 h-16 text-[#f58220] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            🎁 GANHE $10 GRÁTIS! 🎁
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Cadastre-se agora e receba <strong className="text-[#3db54e]">$10 automaticamente</strong> no seu saldo para usar em compras!
          </p>
          <div className="flex items-center justify-center bg-gradient-to-r from-[#3db54e] to-[#f58220] text-white px-6 py-3 rounded-full text-2xl font-bold">
            <DollarSign className="w-6 h-6 mr-2" />
            10,00
          </div>
        </div>
      </motion.div>

      {/* Benefícios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl w-full"
      >
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <Star className="w-12 h-12 text-[#f58220] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Cashback de 2%</h3>
          <p className="text-gray-600">Ganhe 2% de volta em todas as suas compras</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <Users className="w-12 h-12 text-[#3db54e] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Bônus de Indicação</h3>
          <p className="text-gray-600">Ganhe 1% extra quando indicar amigos</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <DollarSign className="w-12 h-12 text-[#f58220] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Saque Rápido para Lojistas</h3>
          <p className="text-gray-600">Lojistas podem transferir suas vendas quando quiserem</p>
        </div>
      </motion.div>

      {/* Botões */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
      >
        <Button 
          onClick={handleGoToRegister}
          className="flex-1 bg-gradient-to-r from-[#3db54e] to-[#f58220] hover:opacity-90 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105"
        >
          Cadastrar e Ganhar $10
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        
        <Button 
          onClick={handleGoToLogin}
          variant="outline"
          className="flex-1 border-2 border-[#3db54e] text-[#3db54e] hover:bg-[#3db54e] hover:text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300"
        >
          Já tenho conta
        </Button>
      </motion.div>

      {/* Texto final */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="text-center text-gray-600 mt-8 max-w-2xl"
      >
        Junte-se a milhares de pessoas que já estão economizando e ganhando dinheiro com o Vale Cashback!
      </motion.p>


    </div>
  );
}