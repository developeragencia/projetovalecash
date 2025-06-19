import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Info,
  History,
  User,
  Clock,
  Shield,
  Eye,
  FileText,
  Activity,
  Trash2,
  HardDrive
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Tipos e componentes
interface LogEntry {
  id: number;
  action: string;
  actionDescription: string;
  entityType: string;
  entityId: number;
  user: {
    id: number;
    name: string;
    email: string | null;
  };
  details: Record<string, any>;
  createdAt: string;
}

interface AuditEntry {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  ip: string;
  details: string;
  resource: string;
  resourceId: string;
}

const LogTypeIcons: Record<string, React.ReactNode> = {
  "info": <Info className="h-4 w-4 text-blue-500" />,
  "warning": <AlertCircle className="h-4 w-4 text-yellow-500" />,
  "error": <AlertCircle className="h-4 w-4 text-red-500" />,
  "security": <Shield className="h-4 w-4 text-purple-500" />,
};

export default function AdminLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{from: Date | null, to: Date | null}>({
    from: null,
    to: null,
  });
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("logs");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const { toast } = useToast();
  
  // Query para buscar logs do sistema
  const { data: logData, isLoading: logsLoading } = useQuery<{ 
    logs: LogEntry[], 
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      pageCount: number;
    }
  }>({
    queryKey: ['/api/admin/logs', {
      page,
      pageSize,
      action: typeFilter,
      entityType: moduleFilter,
      dateFrom: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateTo: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      search: searchTerm
    }],
    enabled: activeTab === "logs"
  });
  
  // Query para buscar auditoria
  const { data: auditData, isLoading: auditLoading } = useQuery<{ 
    audits: AuditEntry[], 
    actionCounts: { action: string, count: number }[],
    resourceCounts: { resource: string, count: number }[],
    pageCount: number
  }>({
    queryKey: ['/api/admin/audit', {
      page,
      pageSize,
      action: typeFilter,
      resource: moduleFilter,
      dateFrom: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateTo: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      search: searchTerm
    }],
    enabled: activeTab === "audit",
    placeholderData: {
      audits: [
        { id: 501, action: "create", user: "admin@example.com", timestamp: "21/07/2023 15:45:22", ip: "192.168.1.1", details: "Criou nova configuração de sistema", resource: "settings", resourceId: "sys-001" },
        { id: 502, action: "update", user: "admin@example.com", timestamp: "21/07/2023 15:40:12", ip: "192.168.1.1", details: "Atualizou taxa de cashback para 2.5%", resource: "settings", resourceId: "rates-001" },
        { id: 503, action: "delete", user: "admin@example.com", timestamp: "21/07/2023 15:30:05", ip: "192.168.1.1", details: "Removeu usuário inativo", resource: "user", resourceId: "usr-123" },
        { id: 504, action: "create", user: "admin@example.com", timestamp: "21/07/2023 15:20:47", ip: "192.168.1.1", details: "Criou nova loja parceira", resource: "merchant", resourceId: "merch-456" },
        { id: 505, action: "update", user: "admin@example.com", timestamp: "21/07/2023 15:10:33", ip: "192.168.1.1", details: "Atualizou status de transação", resource: "transaction", resourceId: "tx-789" },
        { id: 506, action: "view", user: "admin@example.com", timestamp: "21/07/2023 15:00:18", ip: "192.168.1.1", details: "Visualizou dados sensíveis de cliente", resource: "user", resourceId: "usr-456" },
        { id: 507, action: "export", user: "admin@example.com", timestamp: "21/07/2023 14:50:09", ip: "192.168.1.1", details: "Exportou relatório de transações", resource: "report", resourceId: "rep-001" },
        { id: 508, action: "update", user: "admin@example.com", timestamp: "21/07/2023 14:40:55", ip: "192.168.1.1", details: "Alterou permissões de usuário", resource: "user", resourceId: "usr-789" },
        { id: 509, action: "create", user: "admin@example.com", timestamp: "21/07/2023 14:30:41", ip: "192.168.1.1", details: "Criou novo produto promocional", resource: "product", resourceId: "prod-123" },
        { id: 510, action: "approve", user: "admin@example.com", timestamp: "21/07/2023 14:20:27", ip: "192.168.1.1", details: "Aprovou solicitação de saque", resource: "withdrawal", resourceId: "with-456" },
      ],
      actionCounts: [
        { action: "create", count: 3 },
        { action: "update", count: 3 },
        { action: "delete", count: 1 },
        { action: "view", count: 1 },
        { action: "export", count: 1 },
        { action: "approve", count: 1 }
      ],
      resourceCounts: [
        { resource: "user", count: 3 },
        { resource: "settings", count: 2 },
        { resource: "merchant", count: 1 },
        { resource: "transaction", count: 1 },
        { resource: "report", count: 1 },
        { resource: "product", count: 1 },
        { resource: "withdrawal", count: 1 }
      ],
      pageCount: 5
    }
  });
  
  // Exportar dados
  const handleExport = () => {
    toast({
      title: "Exportação iniciada",
      description: "Os logs estão sendo exportados para CSV.",
    });
    
    // Em uma implementação real, aqui iríamos gerar um arquivo CSV e fazer o download
    setTimeout(() => {
      toast({
        title: "Exportação concluída",
        description: "Arquivo CSV exportado com sucesso.",
      });
    }, 1500);
  };
  
  // Visualizar detalhes do log
  const handleViewLog = (log: LogEntry) => {
    try {
      toast({
        title: `Log #${log.id}`,
        description: `${log.actionDescription} - ${log.entityType} #${log.entityId}`,
      });
    } catch (error) {
      console.error("Erro ao exibir detalhes do log:", error);
      toast({
        title: "Erro",
        description: "Não foi possível exibir os detalhes do log",
        variant: "destructive",
      });
    }
  };
  
  // Visualizar detalhes da auditoria
  const handleViewAudit = (audit: AuditEntry) => {
    toast({
      title: `Auditoria #${audit.id}`,
      description: `${audit.action.toUpperCase()} - ${audit.details}`,
    });
  };
  
  // Definição das colunas da tabela de logs
  const logColumns = [
    {
      header: "ID",
      accessorKey: "id" as keyof LogEntry,
    },
    {
      header: "Ação",
      accessorKey: "action" as keyof LogEntry,
      cell: (log: LogEntry) => {
        // Mapear cores com base no tipo de ação
        const actionColors: Record<string, string> = {
          "store_approved": "bg-green-100 text-green-800",
          "store_rejected": "bg-red-100 text-red-800",
          "user_created": "bg-blue-100 text-blue-800",
          "user_updated": "bg-blue-100 text-blue-800",
          "user_deleted": "bg-red-100 text-red-800",
          "transfer_approved": "bg-green-100 text-green-800",
          "transfer_rejected": "bg-red-100 text-red-800",
          "transfer_processing": "bg-yellow-100 text-yellow-800",
          "transfer_completed": "bg-green-100 text-green-800",
          "transaction_created": "bg-blue-100 text-blue-800",
          "transaction_updated": "bg-blue-100 text-blue-800",
          "settings_updated": "bg-purple-100 text-purple-800",
          "login_success": "bg-green-100 text-green-800",
          "login_failed": "bg-red-100 text-red-800",
          "password_reset": "bg-yellow-100 text-yellow-800"
        };
        
        // Cor padrão para ações não mapeadas
        const color = actionColors[log.action] || "bg-gray-100 text-gray-800";
        
        // Ícones baseados nas ações
        const actionIcons: Record<string, React.ReactNode> = {
          "store_approved": <CheckCircle2 className="h-4 w-4" />,
          "store_rejected": <AlertCircle className="h-4 w-4" />,
          "user_created": <User className="h-4 w-4" />,
          "user_updated": <User className="h-4 w-4" />,
          "user_deleted": <Trash2 className="h-4 w-4" />,
          "transfer_approved": <CheckCircle2 className="h-4 w-4" />,
          "transfer_rejected": <AlertCircle className="h-4 w-4" />,
          "transfer_processing": <Clock className="h-4 w-4" />,
          "transfer_completed": <CheckCircle2 className="h-4 w-4" />,
          "transaction_created": <Activity className="h-4 w-4" />,
          "transaction_updated": <Activity className="h-4 w-4" />,
          "settings_updated": <HardDrive className="h-4 w-4" />,
          "login_success": <User className="h-4 w-4" />,
          "login_failed": <AlertCircle className="h-4 w-4" />,
          "password_reset": <Shield className="h-4 w-4" />
        };
        
        const icon = actionIcons[log.action] || <Info className="h-4 w-4" />;
        
        return (
          <div className={`rounded-full px-2 py-1 text-xs font-medium inline-flex items-center ${color}`}>
            {icon}
            <span className="ml-1">{log.actionDescription}</span>
          </div>
        );
      },
    },
    {
      header: "Entidade",
      accessorKey: "entityType" as keyof LogEntry,
      cell: (log: LogEntry) => (
        <div className="flex items-center">
          <HardDrive className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="capitalize">{log.entityType}</span>
          <span className="ml-1 text-xs text-muted-foreground">#{log.entityId}</span>
        </div>
      ),
    },
    {
      header: "Usuário",
      accessorKey: "user" as keyof LogEntry,
      cell: (log: LogEntry) => (
        <div className="flex items-center">
          <User className="h-4 w-4 text-muted-foreground mr-2" />
          <span>{log.user?.name || "Sistema"}</span>
          {log.user?.email && <span className="ml-1 text-xs text-muted-foreground">({log.user.email})</span>}
        </div>
      ),
    },
    {
      header: "Data/Hora",
      accessorKey: "createdAt" as keyof LogEntry,
      cell: (log: LogEntry) => {
        const formatSafeDate = (dateString: string) => {
          if (!dateString) return "Data não informada";
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Data inválida";
            return date.toLocaleString("pt-BR");
          } catch (error) {
            return "Data inválida";
          }
        };
        
        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-muted-foreground mr-2" />
            <span>{formatSafeDate(log.createdAt)}</span>
          </div>
        );
      },
    },
    {
      header: "Detalhes",
      accessorKey: "details" as keyof LogEntry,
      cell: (log: LogEntry) => {
        // Converter detalhes para string legível
        let detailsText = "Sem detalhes";
        try {
          if (typeof log.details === 'string') {
            try {
              const parsedDetails = JSON.parse(log.details);
              detailsText = Object.entries(parsedDetails)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            } catch {
              detailsText = log.details;
            }
          } else if (log.details && typeof log.details === 'object') {
            detailsText = Object.entries(log.details)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
          }
        } catch (e) {
          console.error("Erro ao processar detalhes:", e);
        }
        
        return (
          <div className="max-w-md truncate">
            {detailsText}
          </div>
        );
      },
    },
  ];
  
  // Definição das colunas da tabela de auditoria
  const auditColumns = [
    {
      header: "ID",
      accessorKey: "id" as keyof AuditEntry,
    },
    {
      header: "Ação",
      accessorKey: "action" as keyof AuditEntry,
      cell: (audit: AuditEntry) => {
        const actionLabels: Record<string, string> = {
          "create": "Criação",
          "update": "Edição",
          "delete": "Exclusão",
          "view": "Visualização",
          "export": "Exportação",
          "approve": "Aprovação"
        };
        
        const actionColors: Record<string, string> = {
          "create": "bg-green-100 text-green-800",
          "update": "bg-blue-100 text-blue-800",
          "delete": "bg-red-100 text-red-800",
          "view": "bg-purple-100 text-purple-800",
          "export": "bg-yellow-100 text-yellow-800",
          "approve": "bg-indigo-100 text-indigo-800"
        };
        
        const ActionIcons: Record<string, React.ReactNode> = {
          "create": <CheckCircle2 className="h-4 w-4" />,
          "update": <History className="h-4 w-4" />,
          "delete": <Trash2 className="h-4 w-4" />,
          "view": <Eye className="h-4 w-4" />,
          "export": <Download className="h-4 w-4" />,
          "approve": <CheckCircle2 className="h-4 w-4" />
        };
        
        return (
          <div className={`rounded-full px-2 py-1 text-xs font-medium inline-flex items-center ${actionColors[audit.action]}`}>
            {ActionIcons[audit.action]}
            <span className="ml-1">{actionLabels[audit.action]}</span>
          </div>
        );
      },
    },
    {
      header: "Detalhes",
      accessorKey: "details" as keyof AuditEntry,
      cell: (audit: AuditEntry) => (
        <div className="max-w-md truncate">
          {audit.details}
        </div>
      ),
    },
    {
      header: "Usuário",
      accessorKey: "user" as keyof AuditEntry,
      cell: (audit: AuditEntry) => (
        <div className="flex items-center">
          <User className="h-4 w-4 text-muted-foreground mr-2" />
          <span>{audit.user}</span>
        </div>
      ),
    },
    {
      header: "Data/Hora",
      accessorKey: "timestamp" as keyof AuditEntry,
    },
    {
      header: "Recurso",
      accessorKey: "resource" as keyof AuditEntry,
      cell: (audit: AuditEntry) => (
        <div className="flex items-center">
          <HardDrive className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="capitalize">{audit.resource}</span>
          <span className="ml-1 text-xs text-muted-foreground">#{audit.resourceId}</span>
        </div>
      ),
    },
  ];
  
  // Ações para a tabela de logs
  const logActions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: (log: LogEntry) => handleViewLog(log),
    },
    {
      label: "Exportar",
      icon: <FileText className="h-4 w-4" />,
      onClick: (log: LogEntry) => {
        toast({
          title: "Log exportado",
          description: `Log #${log.id} exportado com sucesso.`,
        });
      },
    },
  ];
  
  // Ações para a tabela de auditoria
  const auditActions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: (audit: AuditEntry) => handleViewAudit(audit),
    },
  ];
  
  // Renderizar estatísticas com base na aba ativa
  const renderStats = () => {
    if (activeTab === "logs") {
      // Agrupar logs por tipo de ação e entidade
      const actionGroups: Record<string, number> = {};
      const entityGroups: Record<string, number> = {};
      
      logData?.logs?.forEach(log => {
        // Agrupar por ação
        actionGroups[log.action] = (actionGroups[log.action] || 0) + 1;
        
        // Agrupar por entidade
        entityGroups[log.entityType] = (entityGroups[log.entityType] || 0) + 1;
      });
      
      const actionCountsArray = Object.entries(actionGroups)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
        
      const entityCountsArray = Object.entries(entityGroups)
        .map(([entity, count]) => ({ entity, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Ação</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {actionCountsArray.length > 0 ? actionCountsArray.map(item => {
                  // Verificar qual ícone usar com base na ação
                  const actionIcons: Record<string, React.ReactNode> = {
                    "store_approved": <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
                    "store_rejected": <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
                    "user_created": <User className="h-3.5 w-3.5 text-blue-500" />,
                    "user_updated": <User className="h-3.5 w-3.5 text-blue-500" />,
                    "user_deleted": <Trash2 className="h-3.5 w-3.5 text-red-500" />,
                    "transfer_approved": <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
                    "transfer_rejected": <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
                    "transfer_processing": <Clock className="h-3.5 w-3.5 text-yellow-500" />,
                    "transfer_completed": <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
                    "transaction_created": <Activity className="h-3.5 w-3.5 text-blue-500" />,
                    "transaction_updated": <Activity className="h-3.5 w-3.5 text-blue-500" />,
                    "settings_updated": <HardDrive className="h-3.5 w-3.5 text-purple-500" />,
                    "login_success": <User className="h-3.5 w-3.5 text-green-500" />,
                    "login_failed": <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
                    "password_reset": <Shield className="h-3.5 w-3.5 text-yellow-500" />
                  };
                  
                  return (
                    <div key={item.action} className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        {actionIcons[item.action] || <Info className="h-3.5 w-3.5 text-gray-500" />}
                        <span className="ml-1 capitalize">{item.action.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  );
                }) : (
                  <div className="text-sm text-muted-foreground">
                    Nenhuma ação registrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Entidade</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {entityCountsArray.length > 0 ? entityCountsArray.map(item => {
                  // Ícones baseados no tipo de entidade
                  const entityIcons: Record<string, React.ReactNode> = {
                    "user": <User className="h-3.5 w-3.5 text-blue-500" />,
                    "merchant": <HardDrive className="h-3.5 w-3.5 text-purple-500" />,
                    "transaction": <Activity className="h-3.5 w-3.5 text-green-500" />,
                    "transfer": <Activity className="h-3.5 w-3.5 text-yellow-500" />,
                    "setting": <HardDrive className="h-3.5 w-3.5 text-gray-500" />,
                    "commission_setting": <HardDrive className="h-3.5 w-3.5 text-orange-500" />
                  };
                  
                  return (
                    <div key={item.entity} className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        {entityIcons[item.entity] || <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="ml-1 capitalize">{item.entity.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  );
                }) : (
                  <div className="text-sm text-muted-foreground">
                    Nenhuma entidade registrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else if (activeTab === "audit") {
      return (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Ação</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {auditData?.actionCounts.map((actionCount) => {
                  const actionLabels: Record<string, string> = {
                    "create": "Criação",
                    "update": "Edição",
                    "delete": "Exclusão",
                    "view": "Visualização",
                    "export": "Exportação",
                    "approve": "Aprovação"
                  };
                  
                  return (
                    <div key={actionCount.action} className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Activity className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span>{actionLabels[actionCount.action] || actionCount.action}</span>
                      </div>
                      <span className="text-sm font-medium">{actionCount.count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Recurso</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {auditData?.resourceCounts.map((resourceCount) => (
                  <div key={resourceCount.resource} className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <HardDrive className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span className="capitalize">{resourceCount.resource}</span>
                    </div>
                    <span className="text-sm font-medium">{resourceCount.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <DashboardLayout title="Logs e Auditoria" type="admin">
      <Tabs defaultValue="logs" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="logs">
              <Activity className="h-4 w-4 mr-2" />
              Logs do Sistema
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Shield className="h-4 w-4 mr-2" />
              Auditoria
            </TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={new Date()}
                  selected={{
                    from: dateRange.from ?? undefined,
                    to: dateRange.to ?? undefined,
                  }}
                  onSelect={range => {
                    if (range?.from) {
                      setDateRange({ from: range.from, to: range.to ?? null });
                    }
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
        
        {/* Estatísticas */}
        {renderStats()}
        
        {/* Tab: Logs do Sistema */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Registros de atividades, erros e alertas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative w-full md:w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar logs..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-1 gap-4">
                  <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="info">Informação</SelectItem>
                      <SelectItem value="warning">Alerta</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="security">Segurança</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={moduleFilter} onValueChange={(val) => setModuleFilter(val)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os módulos</SelectItem>
                      <SelectItem value="auth">Autenticação</SelectItem>
                      <SelectItem value="payment">Pagamento</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                      <SelectItem value="qrcode">QR Code</SelectItem>
                      <SelectItem value="access">Acesso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DataTable
                data={logData?.logs || []}
                columns={logColumns}
                actions={logActions}
                searchable={false}
                pagination={{
                  pageIndex: page - 1,
                  pageSize: pageSize,
                  pageCount: logData?.pagination?.pageCount || 1,
                  onPageChange: (newPage) => setPage(newPage + 1),
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Auditoria */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria</CardTitle>
              <CardDescription>
                Registros detalhados de ações realizadas por usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative w-full md:w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar auditoria..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-1 gap-4">
                  <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as ações</SelectItem>
                      <SelectItem value="create">Criação</SelectItem>
                      <SelectItem value="update">Edição</SelectItem>
                      <SelectItem value="delete">Exclusão</SelectItem>
                      <SelectItem value="view">Visualização</SelectItem>
                      <SelectItem value="export">Exportação</SelectItem>
                      <SelectItem value="approve">Aprovação</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={moduleFilter} onValueChange={(val) => setModuleFilter(val)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Recurso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os recursos</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="settings">Configurações</SelectItem>
                      <SelectItem value="merchant">Loja</SelectItem>
                      <SelectItem value="transaction">Transação</SelectItem>
                      <SelectItem value="report">Relatório</SelectItem>
                      <SelectItem value="product">Produto</SelectItem>
                      <SelectItem value="withdrawal">Saque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DataTable
                data={auditData?.audits || []}
                columns={auditColumns}
                actions={auditActions}
                searchable={false}
                pagination={{
                  pageIndex: page - 1,
                  pageSize: pageSize,
                  pageCount: auditData?.pageCount || 1,
                  onPageChange: (newPage) => setPage(newPage + 1),
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}