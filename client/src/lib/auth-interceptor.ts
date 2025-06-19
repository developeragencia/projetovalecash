// Interceptor global para garantir que todas as requisições incluam credenciais
let isAuthenticating = false;

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  // Configurar headers padrão para manter sessão
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, defaultOptions);

  // Se receber 401 e não estiver já autenticando, redirecionar para login
  if (response.status === 401 && !isAuthenticating) {
    isAuthenticating = true;
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 100);
  }

  return response;
}

// Função para verificar se o usuário está autenticado
export async function checkAuth() {
  try {
    const response = await authenticatedFetch('/api/auth/me');
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return null;
  }
}