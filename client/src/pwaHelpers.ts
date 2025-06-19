/**
 * Helpers para identificar dispositivos e comportamentos específicos para PWA
 */

/**
 * Verifica se o dispositivo atual é um dispositivo móvel
 * @returns {boolean} true se for um dispositivo móvel
 */
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
}

/**
 * Detecta o sistema operacional do dispositivo
 * @returns {string|null} 'android', 'ios', 'windows', 'mac', 'linux' ou null se não for possível detectar
 */
export function getDeviceOS(): string | null {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  } else if (/windows/.test(userAgent)) {
    return 'windows';
  } else if (/macintosh|mac os x/.test(userAgent)) {
    return 'mac';
  } else if (/linux/.test(userAgent)) {
    return 'linux';
  }
  
  return null;
}

/**
 * Verifica se o app já está instalado como PWA
 * @returns {boolean} true se o app estiver instalado como PWA
 */
export function isAppInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

/**
 * Verifica se o navegador suporta instalação de PWA
 * @returns {boolean} true se o navegador suportar PWA
 */
export function isPWASupported(): boolean {
  return 'serviceWorker' in navigator && 
         window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost';
}

/**
 * Verifica se o navegador é compatível com a Web Share API
 * @returns {boolean} true se o navegador suportar Web Share API
 */
export function isWebShareSupported(): boolean {
  return !!navigator.share;
}

/**
 * Compartilha o link via Web Share API (útil para iOS)
 * @returns {Promise<boolean>} true se o compartilhamento foi bem-sucedido
 */
export async function shareApp(): Promise<boolean> {
  if (!isWebShareSupported()) {
    return false;
  }
  
  try {
    await navigator.share({
      title: 'Vale Cashback',
      text: 'Instale o Vale Cashback para gerenciar suas finanças de forma fácil e rápida!',
      url: window.location.href,
    });
    return true;
  } catch (error) {
    console.error('Erro ao compartilhar:', error);
    return false;
  }
}

/**
 * Salva imagem PNG do PWA
 * @param {string} url Caminho para o ícone
 * @param {string} fileName Nome do arquivo para salvar
 */
export function saveIcon(url: string, fileName: string = 'vale-cashback-icon.png'): void {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Erro ao salvar ícone:', error);
  }
}

/**
 * Limpa o cache do aplicativo (útil para atualizações)
 */
export async function clearAppCache(): Promise<boolean> {
  try {
    if ('caches' in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => window.caches.delete(cacheName))
      );
      console.log('Cache do navegador limpo com sucesso');
      return true;
    }
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
  return false;
}

/**
 * Verifica por atualizações no service worker
 */
export async function checkForUpdates(): Promise<boolean> {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        return true;
      }
    }
  } catch (error) {
    console.error('Erro ao verificar por atualizações:', error);
  }
  return false;
}

/**
 * Registra o service worker para funcionalidade PWA
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registrado com sucesso:', registration.scope);
        })
        .catch(error => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    });
  } else {
    console.warn('Service Worker não é suportado neste navegador');
  }
}