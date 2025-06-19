import { useEffect, useState } from 'react';
import { Bell, BellRing, MoreHorizontal, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'transaction' | 'cashback' | 'transfer' | 'referral' | 'system';
  read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationBell() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Buscar notificações
  const { data, isLoading, error } = useQuery<NotificationResponse>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/notifications');
      return response.json();
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('PATCH', `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida",
        variant: "destructive",
      });
    }
  });

  // Marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível marcar as notificações como lidas",
        variant: "destructive",
      });
    }
  });

  // Excluir notificação
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a notificação",
        variant: "destructive",
      });
    }
  });

  // Função para lidar com a marcação de leitura
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  // Função para lidar com a exclusão
  const handleDelete = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  // Função para marcar todas como lidas
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Fechar o popover automaticamente após marcar como lido ou excluir
  useEffect(() => {
    if (markAsReadMutation.isSuccess || deleteNotificationMutation.isSuccess) {
      // Fechamos o popover apenas depois de um tempo para que o usuário veja o efeito
      setTimeout(() => {
        setIsOpen(false);
      }, 300);
    }
  }, [markAsReadMutation.isSuccess, deleteNotificationMutation.isSuccess]);

  const unreadCount = data?.unreadCount || 0;

  // Obter o ícone com base no tipo da notificação
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <div className="bg-green-100 p-2 rounded-full"><Bell className="h-4 w-4 text-green-500" /></div>;
      case 'cashback':
        return <div className="bg-green-100 p-2 rounded-full"><Bell className="h-4 w-4 text-green-500" /></div>;
      case 'transfer':
        return <div className="bg-blue-100 p-2 rounded-full"><Bell className="h-4 w-4 text-blue-500" /></div>;
      case 'referral':
        return <div className="bg-purple-100 p-2 rounded-full"><Bell className="h-4 w-4 text-purple-500" /></div>;
      case 'system':
        return <div className="bg-amber-100 p-2 rounded-full"><Bell className="h-4 w-4 text-amber-500" /></div>;
      default:
        return <div className="bg-gray-100 p-2 rounded-full"><Bell className="h-4 w-4 text-gray-500" /></div>;
    }
  };

  // Formatar a data da notificação de forma segura
  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não informada";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Data inválida";
      return format(date, "dd/MM/yyyy HH:mm");
    } catch (error) {
      console.error("Erro ao formatar data da notificação:", error);
      return "Data inválida";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Notificações"
        >
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-5 w-5 text-white" />
              <Badge 
                className="absolute -top-1 -right-1 px-1.5 min-w-5 h-5 flex items-center justify-center"
                variant="destructive"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5 text-white" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 max-h-[90vh]" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Notificações</h2>
          {(data?.notifications?.length || 0) > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Marcar todas como lidas'
              )}
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[50vh] md:h-[40vh]">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-destructive">
              Erro ao carregar notificações
            </div>
          ) : !data?.notifications ? (
            <div className="p-6 text-center text-muted-foreground">
              Falha ao carregar notificações
            </div>
          ) : data.notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Você não tem notificações
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {data.notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`border-b last:border-0 ${!notification.read ? 'bg-secondary/20' : ''}`}
                >
                  <DropdownMenu>
                    <div className="flex items-start p-4 gap-3 relative">
                      {getNotificationIcon(notification.type)}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{notification.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 absolute top-2 right-2 opacity-50 hover:opacity-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                        </Button>
                      </DropdownMenuTrigger>
                    </div>
                    
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuGroup>
                        {!notification.read && (
                          <DropdownMenuItem 
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markAsReadMutation.isPending}
                          >
                            {markAsReadMutation.isPending ? 
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                              <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            }
                            Marcar como lida
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(notification.id)}
                          disabled={deleteNotificationMutation.isPending}
                          className="text-destructive"
                        >
                          {deleteNotificationMutation.isPending ? 
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          }
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}