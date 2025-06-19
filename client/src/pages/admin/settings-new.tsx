import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { 
  Percent, 
  DollarSign, 
  Save, 
  Settings, 
  CreditCard,
  Info,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Schema para validação das taxas do novo modelo
const commissionsSchema = z.object({
  platform_fee: z.preprocess(
    (val) => parseFloat(val as string), 
    z.number().min(0).max(100)
  ),
  client_cashback: z.preprocess(
    (val) => parseFloat(val as string), 
    z.number().min(0).max(100)
  ),
  referral_bonus: z.preprocess(
    (val) => parseFloat(val as string), 
    z.number().min(0).max(100)
  ),
  min_withdrawal: z.preprocess(
    (val) => parseFloat(val as string), 
    z.number().min(0)
  ),
});

type CommissionSettings = z.infer<typeof commissionsSchema>;

export default function AdminSettingsNew() {
  const { toast } = useToast();
  
  // Query para buscar configurações atuais
  const { data: settings, isLoading } = useQuery<CommissionSettings>({
    queryKey: ['/api/admin/settings/commission'],
    retry: 2
  });
  
  // Formulário para configurações de comissão
  const form = useForm<CommissionSettings>({
    resolver: zodResolver(commissionsSchema),
    defaultValues: {
      platform_fee: 5.0,
      client_cashback: 2.0,
      referral_bonus: 1.0,
      min_withdrawal: 20.0,
    },
    values: settings ? {
      platform_fee: parseFloat(settings.platform_fee.toString()),
      client_cashback: parseFloat(settings.client_cashback.toString()),
      referral_bonus: parseFloat(settings.referral_bonus.toString()),
      min_withdrawal: parseFloat(settings.min_withdrawal.toString()),
    } : undefined
  });
  
  // Mutation para atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: CommissionSettings) => {
      return await apiRequest('/api/admin/settings/commission', 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As taxas foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/commission'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Erro ao atualizar configurações.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CommissionSettings) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Configurações" type="admin">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Configurações do Sistema" type="admin">
      <div className="space-y-6">
        
        {/* Informações do Novo Modelo */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Novo Modelo de Taxas:</strong> Lojistas pagam 5% para a plataforma, clientes recebem 2% de cashback, 
            e indicações geram 1% de bônus. A comissão do lojista foi removida.
          </AlertDescription>
        </Alert>

        {/* Card de Configurações de Taxas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Taxas e Comissões
            </CardTitle>
            <CardDescription>
              Configure as taxas do sistema conforme o novo modelo implementado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Taxa da Plataforma */}
                  <FormField
                    control={form.control}
                    name="platform_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Taxa da Plataforma (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="5.0"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Percentual pago pelos lojistas à plataforma (recomendado: 5%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cashback do Cliente */}
                  <FormField
                    control={form.control}
                    name="client_cashback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Cashback do Cliente (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="2.0"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Percentual de cashback recebido pelos clientes (recomendado: 2%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Bônus de Indicação */}
                  <FormField
                    control={form.control}
                    name="referral_bonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Bônus de Indicação (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="1.0"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Percentual de bônus para indicações (recomendado: 1%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Saque Mínimo */}
                  <FormField
                    control={form.control}
                    name="min_withdrawal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Saque Mínimo (R$)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="20.00"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Valor mínimo para solicitação de saque
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                <Separator />

                {/* Exemplo de Cálculo */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Exemplo de Cálculo (Transação de R$ 100,00)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Cliente paga:</strong> R$ 100,00</p>
                      <p><strong>Cliente recebe de cashback:</strong> R$ {(100 * (form.watch('client_cashback') || 2) / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p><strong>Lojista paga à plataforma:</strong> R$ {(100 * (form.watch('platform_fee') || 5) / 100).toFixed(2)}</p>
                      <p><strong>Lojista recebe líquido:</strong> R$ {(100 - (100 * (form.watch('platform_fee') || 5) / 100)).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Botão de Salvar */}
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Informações Atuais */}
        {settings && (
          <Card>
            <CardHeader>
              <CardTitle>Configurações Atuais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{settings.platform_fee}%</div>
                  <div className="text-sm text-muted-foreground">Taxa da Plataforma</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{settings.client_cashback}%</div>
                  <div className="text-sm text-muted-foreground">Cashback do Cliente</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{settings.referral_bonus}%</div>
                  <div className="text-sm text-muted-foreground">Bônus de Indicação</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">R$ {settings.min_withdrawal}</div>
                  <div className="text-sm text-muted-foreground">Saque Mínimo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}