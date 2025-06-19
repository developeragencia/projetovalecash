// Script simples para forçar redirecionamento para a tela de boas-vindas
(function() {
  const currentPath = window.location.pathname;
  
  // Se estiver na raiz, redireciona para welcome-new automaticamente
  if (currentPath === '/' || currentPath === '') {
    window.location.href = '/welcome-new';
  }
})();