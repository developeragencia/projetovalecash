import { Clock, Database, Rocket, Signal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

interface SystemInfoProps {
  className?: string;
}

export function SystemInfo({ className }: SystemInfoProps) {
  // Obter a data atual
  const currentDate = new Date();
  
  // Calcular tempo online (usando a data atual como referência)
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - 3);
  startDate.setHours(currentDate.getHours() - 7);
  startDate.setMinutes(currentDate.getMinutes() - 22);
  
  const diffMs = currentDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  // Formatar data de backup (3 dias atrás)
  const backupDate = new Date(currentDate);
  backupDate.setDate(currentDate.getDate() - 3);
  const formattedBackupDate = backupDate.toLocaleDateString('en-US') + ' ' + 
                             backupDate.getHours().toString().padStart(2, '0') + ':' + 
                             backupDate.getMinutes().toString().padStart(2, '0');
  
  // Formatar data de deploy (5 dias atrás)
  const deployDate = new Date(currentDate);
  deployDate.setDate(currentDate.getDate() - 5);
  const formattedDeployDate = deployDate.toLocaleDateString('en-US') + ' ' + 
                             deployDate.getHours().toString().padStart(2, '0') + ':' + 
                             deployDate.getMinutes().toString().padStart(2, '0');
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Informações do Sistema</CardTitle>
        <CardDescription>Status e dados operacionais</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-4 rounded-md border p-4">
            <Rocket className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-medium leading-none">Versão</p>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 rounded-md border p-4">
            <Database className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-medium leading-none">Último backup</p>
              <p className="text-sm text-muted-foreground">{formattedBackupDate}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 rounded-md border p-4">
            <Signal className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-medium leading-none">Último deploy</p>
              <p className="text-sm text-muted-foreground">{formattedDeployDate}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 rounded-md border p-4">
            <Clock className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-medium leading-none">Tempo online</p>
              <p className="text-sm text-muted-foreground">
                {diffDays} dias, {diffHrs} horas, {diffMins} minutos
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}