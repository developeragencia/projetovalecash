import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { LineChartComponent } from "@/components/ui/charts";
import { Badge } from "@/components/ui/badge";
import { Eye, ShoppingBag, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock customer data - would be replaced with real data from API
const customers = [
  { 
    id: 1, 
    name: "João Silva", 
    email: "joao@email.com", 
    purchases: 12, 
    totalSpent: 1250.50, 
    totalCashback: 25.01, 
    lastPurchase: "15/07/2023",
    transactions: [
      { id: 101, date: "15/07/2023", amount: 150.00, cashback: 3.00, items: "5 itens" },
      { id: 95, date: "10/07/2023", amount: 200.00, cashback: 4.00, items: "3 itens" },
      { id: 87, date: "05/07/2023", amount: 75.50, cashback: 1.51, items: "2 itens" }
    ],
    purchaseHistory: [
      { month: "Fev", value: 150 },
      { month: "Mar", value: 200 },
      { month: "Abr", value: 175 },
      { month: "Mai", value: 350 },
      { month: "Jun", value: 225 },
      { month: "Jul", value: 150 }
    ]
  },
  { 
    id: 2, 
    name: "Maria Souza", 
    email: "maria@email.com", 
    purchases: 8, 
    totalSpent: 980.25, 
    totalCashback: 19.60, 
    lastPurchase: "12/07/2023",
    transactions: [
      { id: 99, date: "12/07/2023", amount: 125.75, cashback: 2.51, items: "4 itens" },
      { id: 92, date: "08/07/2023", amount: 85.00, cashback: 1.70, items: "2 itens" },
      { id: 85, date: "01/07/2023", amount: 150.50, cashback: 3.01, items: "3 itens" }
    ],
    purchaseHistory: [
      { month: "Fev", value: 100 },
      { month: "Mar", value: 150 },
      { month: "Abr", value: 200 },
      { month: "Mai", value: 180 },
      { month: "Jun", value: 225 },
      { month: "Jul", value: 125 }
    ]
  },
  { 
    id: 3, 
    name: "Carlos Oliveira", 
    email: "carlos@email.com", 
    purchases: 5, 
    totalSpent: 520.00, 
    totalCashback: 10.40, 
    lastPurchase: "08/07/2023",
    transactions: [
      { id: 97, date: "08/07/2023", amount: 95.00, cashback: 1.90, items: "3 itens" },
      { id: 88, date: "02/07/2023", amount: 125.00, cashback: 2.50, items: "2 itens" },
      { id: 82, date: "25/06/2023", amount: 100.00, cashback: 2.00, items: "1 item" }
    ],
    purchaseHistory: [
      { month: "Fev", value: 0 },
      { month: "Mar", value: 85 },
      { month: "Abr", value: 120 },
      { month: "Mai", value: 95 },
      { month: "Jun", value: 125 },
      { month: "Jul", value: 95 }
    ]
  },
  { 
    id: 4, 
    name: "Ana Lima", 
    email: "ana@email.com", 
    purchases: 15, 
    totalSpent: 1825.75, 
    totalCashback: 36.51, 
    lastPurchase: "20/07/2023",
    transactions: [
      { id: 105, date: "20/07/2023", amount: 175.25, cashback: 3.50, items: "6 itens" },
      { id: 100, date: "15/07/2023", amount: 120.50, cashback: 2.41, items: "4 itens" },
      { id: 93, date: "10/07/2023", amount: 195.00, cashback: 3.90, items: "5 itens" }
    ],
    purchaseHistory: [
      { month: "Fev", value: 200 },
      { month: "Mar", value: 250 },
      { month: "Abr", value: 300 },
      { month: "Mai", value: 350 },
      { month: "Jun", value: 400 },
      { month: "Jul", value: 325 }
    ]
  },
  { 
    id: 5, 
    name: "Paulo Santos", 
    email: "paulo@email.com", 
    purchases: 3, 
    totalSpent: 245.00, 
    totalCashback: 4.90, 
    lastPurchase: "05/07/2023",
    transactions: [
      { id: 90, date: "05/07/2023", amount: 85.00, cashback: 1.70, items: "2 itens" },
      { id: 83, date: "28/06/2023", amount: 75.00, cashback: 1.50, items: "1 item" },
      { id: 78, date: "20/06/2023", amount: 85.00, cashback: 1.70, items: "2 itens" }
    ],
    purchaseHistory: [
      { month: "Fev", value: 0 },
      { month: "Mar", value: 0 },
      { month: "Abr", value: 0 },
      { month: "Mai", value: 0 },
      { month: "Jun", value: 160 },
      { month: "Jul", value: 85 }
    ]
  }
];

export default function MerchantCustomers() {
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Query to get customer data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/merchant/customers'],
  });

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  // Column configuration
  const columns = [
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Compras",
      accessorKey: "purchases",
    },
    {
      header: "Total Gasto",
      accessorKey: "totalSpent",
      cell: (row: any) => `R$ ${row.totalSpent.toFixed(2)}`,
    },
    {
      header: "Cashback",
      accessorKey: "totalCashback",
      cell: (row: any) => `R$ ${row.totalCashback.toFixed(2)}`,
    },
    {
      header: "Última Compra",
      accessorKey: "lastPurchase",
    },
  ];

  // Actions configuration
  const actions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewCustomer,
    },
  ];

  return (
    <DashboardLayout title="Clientes" type="merchant">
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>Informações sobre os clientes do seu estabelecimento</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data?.customers || customers}
            columns={columns}
            actions={actions}
            searchable={true}
            onSearch={(value) => console.log("Searching:", value)}
            pagination={{
              pageIndex: 0,
              pageSize: 10,
              pageCount: Math.ceil((data?.customers || customers).length / 10),
              onPageChange: (page) => console.log("Page:", page),
            }}
            exportable={true}
            onExport={() => toast({
              title: "Exportando dados",
              description: "Os dados dos clientes estão sendo exportados.",
            })}
          />
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o cliente
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Visão Geral</span>
                </TabsTrigger>
                <TabsTrigger value="purchases" className="flex items-center">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>Compras</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Análise</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium">{selectedCustomer.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Número de compras:</span>
                      <span className="font-medium">{selectedCustomer.purchases}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Total gasto:</span>
                      <span className="font-medium">R$ {selectedCustomer.totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Total de cashback:</span>
                      <span className="font-medium">R$ {selectedCustomer.totalCashback.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Última compra:</span>
                      <span className="font-medium">{selectedCustomer.lastPurchase}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/10 rounded-lg">
                    <h3 className="font-medium mb-2">Valor médio de compra</h3>
                    <div className="text-3xl font-bold text-accent">
                      R$ {(selectedCustomer.totalSpent / selectedCustomer.purchases).toFixed(2)}
                    </div>
                    
                    <h3 className="font-medium mt-4 mb-2">Taxa de conversão de cashback</h3>
                    <div className="text-3xl font-bold text-accent">
                      {((selectedCustomer.totalCashback / selectedCustomer.totalSpent) * 100).toFixed(2)}%
                    </div>
                    
                    <h3 className="font-medium mt-4 mb-2">Status do cliente</h3>
                    <Badge className="bg-accent">
                      {selectedCustomer.purchases > 10 ? "Cliente frequente" : 
                       selectedCustomer.purchases > 5 ? "Cliente regular" : "Cliente ocasional"}
                    </Badge>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="purchases" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Cashback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCustomer.transactions.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.id}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.items}</TableCell>
                        <TableCell className="text-right">R$ {transaction.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {transaction.cashback.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-4">
                <LineChartComponent
                  title="Histórico de Compras"
                  data={selectedCustomer.purchaseHistory}
                  lines={[
                    { dataKey: "value", name: "Valor Gasto (R$)" }
                  ]}
                  xAxisDataKey="month"
                  height={250}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <h3 className="text-muted-foreground text-sm">Frequência de Compra</h3>
                        <div className="text-2xl font-bold">
                          {(30 / (selectedCustomer.purchases || 1)).toFixed(1)} dias
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          entre compras em média
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <h3 className="text-muted-foreground text-sm">Itens por Compra</h3>
                        <div className="text-2xl font-bold">
                          {(selectedCustomer.transactions.reduce((acc: number, t: any) => acc + parseInt(t.items), 0) / selectedCustomer.transactions.length).toFixed(1)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          itens em média
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <h3 className="text-muted-foreground text-sm">Tendência</h3>
                        <div className="text-2xl font-bold text-green-600">
                          ↑ 12.5%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          aumento em compras
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
