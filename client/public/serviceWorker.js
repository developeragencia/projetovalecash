// Service Worker for Vale Cashback PWA
const CACHE_NAME = 'vale-cashback-v1.0.5';

// Lista de recursos a serem cacheados na instalação
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/valecashback-logo.svg',
  '/icon-512.png',
  '/favicon.ico',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js',
  '/downloads/vale-cashback-android.apk',
  '/downloads/vale-cashback-ios.ipa',
  '/downloads/vale-cashback-windows.exe',
  '/downloads/vale-cashback-mac.dmg',
  '/downloads/installers/android-instructions.html',
  '/downloads/installers/ios-instructions.html',
  '/offline.html'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando recursos estáticos');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Instalação concluída');
        return self.skipWaiting();
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativando...');
  
  // Limpa caches antigos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('vale-cashback-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('[Service Worker] Removendo cache antigo:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Service Worker] Agora está ativo, controlando todas as páginas.');
      return self.clients.claim();
    })
  );
});

// Estratégia de cache e network (Cache First, Network Fallback)
self.addEventListener('fetch', event => {
  // Ignora requisições para downloads ou APIs
  if (event.request.url.includes('/downloads/') || 
      event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Recurso encontrado no cache
          console.log('[Service Worker] Usando recurso do cache para:', event.request.url);
          
          // Faça uma solicitação de rede em segundo plano para atualizar o cache
          // para a próxima visita
          fetch(event.request)
            .then(networkResponse => {
              // Se a resposta é válida, atualiza o cache
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, networkResponse));
              }
            })
            .catch(error => console.log('[Service Worker] Erro ao atualizar cache:', error));
          
          return cachedResponse;
        }
        
        // Cache miss - obter da rede
        console.log('[Service Worker] Carregando da rede:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Se a resposta não for válida, retorne-a assim mesmo
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Clone a resposta para poder armazená-la no cache
            const responseToCache = response.clone();
            
            // Adiciona ao cache para uso futuro
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Erro de rede:', error);
            
            // Se o recurso for uma página, retorne a página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html')
                .then(offlineResponse => {
                  if (offlineResponse) {
                    return offlineResponse;
                  }
                  // Se não tiver página offline, retorne uma mensagem básica
                  return new Response('Você está offline e não temos uma página offline para mostrar.', {
                    headers: { 'Content-Type': 'text/html' }
                  });
                });
            }
            
            // Para outros recursos, retorne um response vazio
            return new Response('', {
              status: 408,
              statusText: 'Request timed out.'
            });
          });
      })
  );
});

// Mensagens do Cliente (para comunicação com a aplicação)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronização em segundo plano (para salvar dados offline)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-transaction') {
    console.log('[Service Worker] Sincronizando transações pendentes');
    event.waitUntil(syncTransactions());
  }
});

// Suporte para downloads de aplicativo
self.addEventListener('fetch', event => {
  // Detecta solicitações de download de APK, IPA, EXE, DMG
  if (event.request.url.match(/\.(apk|ipa|exe|dmg)$/)) {
    console.log('[Service Worker] Manipulando download de aplicativo:', event.request.url);
    
    // Adiciona cabeçalhos específicos para downloads de aplicativos
    const requestWithHeaders = new Request(event.request.url, {
      method: event.request.method,
      headers: new Headers({
        'Content-Type': getContentType(event.request.url),
        'Content-Disposition': `attachment; filename="${getFileName(event.request.url)}"`,
        'X-Content-Type-Options': 'nosniff',
      }),
      mode: 'cors',
      cache: 'no-cache',
    });
    
    event.respondWith(
      fetch(requestWithHeaders)
        .catch(error => {
          console.error('[Service Worker] Erro ao fazer download:', error);
          return caches.match(event.request);
        })
    );
  }
});

// Função auxiliar para determinar o tipo de conteúdo com base na extensão do arquivo
function getContentType(url) {
  if (url.endsWith('.apk')) return 'application/vnd.android.package-archive';
  if (url.endsWith('.ipa')) return 'application/octet-stream';
  if (url.endsWith('.exe')) return 'application/vnd.microsoft.portable-executable';
  if (url.endsWith('.dmg')) return 'application/x-apple-diskimage';
  return 'application/octet-stream';
}

// Função auxiliar para extrair o nome do arquivo da URL
function getFileName(url) {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// Exemplo de função de sincronização para transações offline
async function syncTransactions() {
  try {
    // Obter transações pendentes do IndexedDB
    const db = await openDB();
    const pendingTransactions = await db.getAll('pending_transactions');
    
    if (pendingTransactions.length > 0) {
      console.log(`[Service Worker] Encontradas ${pendingTransactions.length} transações pendentes`);
      
      // Tenta enviar cada transação para o servidor
      for (const tx of pendingTransactions) {
        try {
          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(tx)
          });
          
          if (response.ok) {
            // Se sucesso, remove da fila
            await db.delete('pending_transactions', tx.id);
            console.log(`[Service Worker] Transação ${tx.id} sincronizada com sucesso`);
          } else {
            console.log(`[Service Worker] Falha ao sincronizar transação ${tx.id}: ${response.status}`);
          }
        } catch (error) {
          console.log(`[Service Worker] Erro ao sincronizar transação ${tx.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.log('[Service Worker] Erro ao sincronizar transações:', error);
  }
}

// Suporte simples para IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('vale-cashback-db', 1);
    
    request.onerror = event => reject(event.target.error);
    request.onsuccess = event => resolve(event.target.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_transactions')) {
        db.createObjectStore('pending_transactions', { keyPath: 'id' });
      }
    };
  });
}

// Push notifications
self.addEventListener('push', event => {
  const notification = event.data.json();
  const options = {
    body: notification.body,
    icon: '/icon-512.png',
    badge: '/favicon.ico',
    data: notification.data,
    vibrate: [100, 50, 100],
    actions: notification.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(notification.title, options)
  );
});

// Quando o usuário clica em uma notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Verifica se já existe uma janela/aba com a aplicação aberta
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Se não houver nenhuma janela aberta, abra uma nova
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});