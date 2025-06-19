import { createRoot } from "react-dom/client";
import { Helmet } from "react-helmet";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./pwaHelpers";

// Desativar overlay de erro do Vite que está causando problemas
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.server = window.server || {};
  // @ts-ignore
  window.server.hmr = window.server.hmr || {};
  // @ts-ignore
  window.server.hmr.overlay = false;
}

// Limpar cache do aplicativo para forçar a atualização
const clearCache = async () => {
  if ('caches' in window) {
    try {
      // Listar todos os caches e limpar
      const cacheNames = await window.caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => window.caches.delete(cacheName))
      );
      console.log('Cache do navegador limpo com sucesso');
    } catch (err) {
      console.error('Erro ao limpar cache:', err);
    }
  }
};

// Limpar cache antes de iniciar o aplicativo
clearCache().then(() => {
  // Registra o service worker para suporte PWA após limpar o cache
  registerServiceWorker();
});

createRoot(document.getElementById("root")!).render(
  <>
    <Helmet>
      <title>Vale Cashback - Sistema de Cashback</title>
      <meta name="description" content="Sistema completo para gerenciar cashback e fidelizar clientes." />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <meta name="theme-color" content="#0066B3" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      <link rel="manifest" href="/manifest.json" />
    </Helmet>
    <App />
  </>
);
