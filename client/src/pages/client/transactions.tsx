import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

// Interface para transações da API do cliente
interface ClientTransaction {
  id: number;
  amount: string;
  cashback_amount: string;
  description: string;
  created_at: string;
  store_name?: string;
  payment_method: string;
  status: string;
  merchant_category?: string;
}

// Array vazio para quando não há transações
const emptyTransactions: ClientTransaction[] = [];

const paymentMethodLabels: Record<string, string> = {
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  cash: "Dinheiro",
  pix: "PIX",
  cashback: "Cashback"
};

export default function ClientTransactions() {
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [period, setPeriod] = useState("30days");
  const [store, setStore] = useState("all");
  const [status, setStatus] = useState("all");

  // Query para buscar transações reais da API
  const { data: transactions = [], isLoading, error } = useQuery<ClientTransaction[]>({
    queryKey: ['/api/client/transactions'],
    retry: 2,
    staleTime: 30000
  });

  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    alert("Exportando relatório...");
    // Implementação real seria feita com um endpoint de API
  };

  // Filter options
  const periodOptions = [
    { label: "Últimos 30 dias", value: "30days" },
    { label: "Este mês", value: "thisMonth" },
    { label: "Mês anterior", value: "lastMonth" },
    { label: "Personalizado", value: "custom" },
  ];

  const storeOptions = [
    { label: "Todas as lojas", value: "all" },
    { label: "Mercado Central", value: "Mercado Central" },
    { label: "Farmácia Popular", value: "Farmácia Popular" },
    { label: "Posto Shell", value: "Posto Shell" },
    { label: "Livraria Cultura", value: "Livraria Cultura" },
  ];

  const statusOptions = [
    { label: "Todos os status", value: "all" },
    { label: "Concluída", value: "completed" },
    { label: "Pendente", value: "pending" },
    { label: "Cancelada", value: "cancelled" },
  ];

  const columns = [
    {
      header: "ID",
      accessorKey: "id" as keyof ClientTransaction,
    },
    {
      header: "Loja",
      accessorKey: "store_name" as keyof ClientTransaction,
      cell: ({ row }: any) => {
        const transaction = row.original;
        return transaction.store_name || 'N/A';
      },
    },
    {
      header: "Data",
      accessorKey: "created_at" as keyof ClientTransaction,
      cell: ({ row }: any) => {
        const transaction = row.original;
        return new Date(transaction.created_at).toLocaleDateString('pt-BR');
      },
    },
    {
      header: "Valor",
      accessorKey: "amount" as keyof ClientTransaction,
      cell: ({ row }: any) => {
        const transaction = row.original;
        return (
          <span className="font-medium">
            {formatCurrency(parseFloat(transaction.amount) || 0)}
          </span>
        );
      },
    },
    {
      header: "Cashback",
      accessorKey: "cashback_amount" as keyof ClientTransaction,
      cell: ({ row }: any) => {
        const transaction = row.original;
        return (
          <span className="text-green-600 font-medium">
            {formatCurrency(parseFloat(transaction.cashback_amount) || 0)}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status" as keyof ClientTransaction,
      cell: ({ row }: any) => {
        const transaction = row.original;
        return (
          <Badge 
            variant={transaction.status === "completed" ? "success" : transaction.status === "pending" ? "outline" : "destructive"}
          >
            {transaction.status === "completed" ? "Concluída" : transaction.status === "pending" ? "Pendente" : "Cancelada"}
          </Badge>
        );
      },
    },
    {
      header: "Método",
      accessorKey: "payment_method" as keyof ClientTransaction,
      cell: ({ row }: any) => {
        const transaction = row.original;
        return paymentMethodLabels[transaction.payment_method] || transaction.payment_method || 'N/A';
      },
    },
  ];

  const filters = [
    {
      name: "Período",
      options: periodOptions,
      onChange: (value: string) => setPeriod(value),
    },
    {
      name: "Loja",
      options: storeOptions,
      onChange: (value: string) => setStore(value),
    },
    {
      name: "Status",
      options: statusOptions,
      onChange: (value: string) => setStatus(value),
    },
  ];

  const actions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewDetails,
    },
  ];

  return (
    <DashboardLayout title="Transações" type="client">
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : Array.isArray(transactions) && transactions.length > 0 ? (
            <DataTable
              data={transactions}
              columns={columns}
              actions={actions}
              filters={filters}
              searchable={true}
              onSearch={(value) => console.log("Searching:", value)}
              pagination={{
                pageIndex: 0,
                pageSize: 10,
                pageCount: Math.ceil(transactions.length / 10),
                onPageChange: (page) => console.log("Page changed:", page),
              }}
              exportable={true}
              onExport={handleExport}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma transação encontrada. As transações aparecerão aqui quando você fizer compras.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
            <DialogDescription>
              Transação #{selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Loja:</span>
                <span className="font-medium">{selectedTransaction.store}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">{selectedTransaction.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium">{formatCurrency(selectedTransaction.amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Cashback:</span>
                <span className="font-medium">{formatCurrency(selectedTransaction.cashback)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={selectedTransaction.status === "completed" ? "success" : selectedTransaction.status === "pending" ? "outline" : "destructive"}>
                  {selectedTransaction.status === "completed" ? "Concluída" : selectedTransaction.status === "pending" ? "Pendente" : "Cancelada"}
                </Badge>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Método de Pagamento:</span>
                <span className="font-medium">{paymentMethodLabels[selectedTransaction.paymentMethod] || selectedTransaction.paymentMethod}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
