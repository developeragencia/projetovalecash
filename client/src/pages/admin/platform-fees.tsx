import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingUp, Users, Calculator, Download, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlatformFeesData {
  report_type: string;
  period: {
    start_date?: string;
    end_date?: string;
  };
  settings: {
    platform_fee_rate: number;
    client_cashback_rate: number;
    referral_bonus_rate: number;
  };
  summary: {
    active_merchants: number;
    total_transactions: number;
    total_platform_volume: number;
    total_platform_fees: number;
    total_cashback_paid: number;
    total_referral_bonuses: number;
    net_platform_profit: number;
  };
  merchant_details: Array<{
    store_name: string;
    merchant_email: string;
    merchant_phone: string;
    total_transactions: number;
    total_sales_volume: number;
    platform_fees_owed: number;
    cashback_paid_by_platform: number;
    referral_bonuses_paid: number;
    net_platform_revenue: number;
    period_month: string;
  }>;
}

export default function PlatformFees() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState("");

  const { data: feesData, isLoading, refetch } = useQuery<PlatformFeesData>({
    queryKey: ['/api/admin/reports/platform-fees', startDate, endDate, selectedMerchant],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (selectedMerchant) params.append('merchant_id', selectedMerchant);
      
      const response = await fetch(`/api/admin/reports/platform-fees?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar relatório de taxas');
      }
      
      return response.json();
    },
    retry: false
  });

  const exportToCSV = () => {
    if (!feesData?.merchant_details) return;
    
    const headers = [
      'Loja',
      'Email',
      'Telefone',
      'Transações',
      'Volume de Vendas',
      'Taxa da Plataforma (5%)',
      'Cashback Pago',
      'Bônus de Indicação',
      'Receita Líquida da Plataforma'
    ];
    
    const rows = feesData.merchant_details.map(merchant => [
      merchant.store_name,
      merchant.merchant_email,
      merchant.merchant_phone,
      merchant.total_transactions,
      merchant.total_sales_volume,
      merchant.platform_fees_owed,
      merchant.cashback_paid_by_platform,
      merchant.referral_bonuses_paid,
      merchant.net_platform_revenue
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-taxas-plataforma-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Relatório de Taxas da Plataforma" type="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Relatório de Taxas da Plataforma" type="admin">
      <div className="space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Data Inicial</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data Final</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={() => refetch()} className="w-full">
                  Aplicar Filtros
                </Button>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={exportToCSV} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Taxa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Configurações de Taxa Atuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-red-800">Taxa da Plataforma</h3>
                <p className="text-2xl font-bold text-red-600">
                  {((feesData?.settings?.platform_fee_rate || 0) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-red-600">Cobrado dos lojistas</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">Cashback Cliente</h3>
                <p className="text-2xl font-bold text-green-600">
                  {((feesData?.settings?.client_cashback_rate || 0) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-green-600">Pago pela plataforma</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800">Bônus Indicação</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {((feesData?.settings?.referral_bonus_rate || 0) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-blue-600">Pago pela plataforma</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Comerciantes Ativos</p>
                  <p className="text-2xl font-bold">{feesData?.summary?.active_merchants || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Volume Total</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(feesData?.summary?.total_platform_volume || 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxas Arrecadadas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(feesData?.summary?.total_platform_fees || 0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(feesData?.summary?.net_platform_profit || 0)}
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhamento de Custos */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento de Custos da Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold text-muted-foreground">Cashback Pago</h3>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(feesData?.summary?.total_cashback_paid || 0)}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold text-muted-foreground">Bônus de Indicação</h3>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(feesData?.summary?.total_referral_bonuses || 0)}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold text-muted-foreground">Total de Custos</h3>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(
                    (feesData?.summary?.total_cashback_paid || 0) + 
                    (feesData?.summary?.total_referral_bonuses || 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela Detalhada por Comerciante */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Comerciante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loja</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Transações</TableHead>
                    <TableHead className="text-right">Volume de Vendas</TableHead>
                    <TableHead className="text-right">Taxa da Plataforma (5%)</TableHead>
                    <TableHead className="text-right">Cashback Pago</TableHead>
                    <TableHead className="text-right">Bônus Indicação</TableHead>
                    <TableHead className="text-right">Receita Líquida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feesData?.merchant_details?.map((merchant, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {merchant.store_name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{merchant.merchant_email}</div>
                          <div className="text-muted-foreground">{merchant.merchant_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{merchant.total_transactions}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(merchant.total_sales_volume)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatCurrency(merchant.platform_fees_owed)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(merchant.cashback_paid_by_platform)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(merchant.referral_bonuses_paid)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatCurrency(merchant.net_platform_revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {(!feesData?.merchant_details || feesData.merchant_details.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado encontrado para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}