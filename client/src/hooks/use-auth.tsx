import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { saveUserData, clearUserData, getUserData } from '@/storage/local-storage';

type UserType = 'client' | 'merchant' | 'admin';

interface User {
  id: number;
  name: string;
  email: string;
  type: UserType;
  photo?: string;
  status?: string;
  invitation_code?: string;
  phone?: string;
  username?: string;
  created_at?: Date;
  last_login?: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, type: UserType) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  userType: UserType | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    let isSubscribed = true;
    
    async function loadUser() {
      if (!isSubscribed) return;
      
      try {
        // Primeiro verifica dados armazenados localmente
        const storedUser = getUserData();
        if (storedUser && storedUser.expiresAt && storedUser.expiresAt > Date.now()) {
          setUser({
            id: storedUser.id,
            name: storedUser.name,
            email: storedUser.email,
            type: storedUser.type as UserType,
            photo: storedUser.photo,
            status: 'active'
          });
          setLoading(false);
          return;
        }
        
        // Se não há dados locais válidos, verifica com o servidor
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (!isSubscribed) return;
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          saveUserData({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            type: userData.type,
            photo: userData.photo,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 dias
          });
        } else {
          // Só limpa dados se a resposta for 401 (não autenticado)
          if (response.status === 401) {
            setUser(null);
            clearUserData();
          }
        }
      } catch (error) {
        console.log("Erro na verificação de autenticação:", error);
        // Em caso de erro de rede, mantém dados locais se válidos
        const storedUser = getUserData();
        if (storedUser && storedUser.expiresAt && storedUser.expiresAt > Date.now()) {
          setUser({
            id: storedUser.id,
            name: storedUser.name,
            email: storedUser.email,
            type: storedUser.type as UserType,
            photo: storedUser.photo,
            status: 'active'
          });
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }
    
    loadUser();
    
    return () => {
      isSubscribed = false;
    };
  }, []);

  const login = async (email: string, password: string, type: UserType) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          userType: type,
        }),
        credentials: 'include', // Importante para cookies de sessão
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Falha na autenticação. Tente novamente.');
      }
      
      const userData = await response.json();
      setUser(userData);
      
      // Salvar dados no localStorage para persistência
      saveUserData({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        type: userData.type,
        photo: userData.photo,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 dias
      });
      
      // Redirecionar imediatamente sem verificações adicionais
      const userType = userData.type;
      if (userType === 'client') {
        navigate('/client/dashboard');
      } else if (userType === 'merchant') {
        navigate('/merchant/dashboard');
      } else if (userType === 'admin') {
        navigate('/admin/dashboard');
      }
      
      toast({
        title: 'Login realizado com sucesso',
        description: `Bem-vindo(a), ${userData.name}!`,
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Erro ao fazer login',
        description: err.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar usuário');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Cadastro realizado com sucesso',
        description: 'Você ganhou $10 de bônus! Já pode fazer login no sistema.',
      });
      
      navigate('/auth/login');
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Erro ao cadastrar',
        description: err.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Importante para cookies de sessão
      });
      
      // Limpar o localStorage ao fazer logout
      clearUserData();
      
      setUser(null);
      navigate('/auth/login');
      
      toast({
        title: 'Logout realizado',
        description: 'Você saiu do sistema com sucesso.',
      });
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    userType: user?.type || null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Objeto de cache para usuários simulados por tipo
const mockUserCache: Record<UserType, User> = {
  client: {
    id: 999,
    name: 'Cliente de Teste',
    email: 'cliente@valecashback.com',
    type: 'client',
    photo: undefined,
    status: 'active'
  },
  merchant: {
    id: 999,
    name: 'Lojista de Teste',
    email: 'lojista@valecashback.com',
    type: 'merchant',
    photo: undefined,
    status: 'active'
  },
  admin: {
    id: 999,
    name: 'Admin de Teste',
    email: 'admin@valecashback.com',
    type: 'admin',
    photo: undefined,
    status: 'active'
  }
};

// Contexto simulado memoizado para evitar re-renderizações desnecessárias
const simulatedContextCache: Partial<Record<UserType, AuthContextType>> = {};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
