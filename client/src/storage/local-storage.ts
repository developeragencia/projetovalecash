/**
 * LocalStorage helper para armazenar credenciais do usuário temporariamente
 * Isso é usado apenas para auxiliar durante o desenvolvimento e depuração
 */

// Chaves para armazenamento
const USER_DATA_KEY = 'valecashback_user_data';

// Interface para os dados do usuário
interface StoredUserData {
  id: number;
  name: string;
  email: string;
  type: string;
  photo?: string;
  token?: string;
  expiresAt?: number;
}

/**
 * Salva os dados do usuário no localStorage
 */
export function saveUserData(userData: StoredUserData): void {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Erro ao salvar dados do usuário no localStorage:', error);
  }
}

/**
 * Recupera os dados do usuário do localStorage
 */
export function getUserData(): StoredUserData | null {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    if (!data) return null;
    
    return JSON.parse(data) as StoredUserData;
  } catch (error) {
    console.error('Erro ao recuperar dados do usuário do localStorage:', error);
    return null;
  }
}

/**
 * Limpa os dados do usuário do localStorage
 */
export function clearUserData(): void {
  try {
    localStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Erro ao limpar dados do usuário do localStorage:', error);
  }
}

/**
 * Verifica se existem dados de usuário salvos
 */
export function hasUserData(): boolean {
  return getUserData() !== null;
}