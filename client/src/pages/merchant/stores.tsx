import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, 
  MapPin,
  Phone,
  Mail,
  Star,
  Calendar,
  Tag,
  Landmark,
  BarChart2,
  ShoppingBag,
  Users,
  ArrowUpRight,
  CreditCard,
  Search,
  Loader2
} from "lucide-react";

export default function MerchantStores() {
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Buscar todas as lojas
  const { data: storesData, isLoading } = useQuery({
    queryKey: ['/api/merchant/stores'],
  });
  
  // Filtrar lojas com base na busca e categoria
  const filteredStores = storesData ? storesData.filter((store: any) => {
    const matchesSearch = searchTerm === "" || 
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.category && store.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || store.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }) : [];
  
  // Abrir o modal de detalhes da loja
  const handleOpenStoreDetails = (store: any) => {
    setSelectedStore(store);
    setIsDialogOpen(true);
  };
  
  // Formatar a data de criação
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Iniciais para o Avatar
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  // Opções para categorias de lojas
  const categoryOptions = [
    { label: "Todas as Categorias", value: "all" },
    { label: "Supermercado", value: "supermarket" },
    { label: "Farmácia", value: "pharmacy" },
    { label: "Restaurante", value: "restaurant" },
    { label: "Posto de Combustível", value: "gas_station" },
    { label: "Loja de Roupas", value: "clothing" },
    { label: "Livraria", value: "books" },
    { label: "Eletrônicos", value: "electronics" },
    { label: "Beleza e Cosméticos", value: "beauty" },
    { label: "Outros", value: "other" },
  ];
  
  // Classes para os cards de lojas
  const getCategoryClass = (category: string) => {
    const categoryMap: Record<string, string> = {
      supermarket: "bg-green-50 border-green-200",
      pharmacy: "bg-red-50 border-red-200",
      restaurant: "bg-yellow-50 border-yellow-200",
      gas_station: "bg-blue-50 border-blue-200",
      clothing: "bg-purple-50 border-purple-200",
      books: "bg-indigo-50 border-indigo-200",
      electronics: "bg-gray-50 border-gray-200",
      beauty: "bg-pink-50 border-pink-200",
      other: "bg-orange-50 border-orange-200"
    };
    
    return categoryMap[category] || "bg-slate-50 border-slate-200";
  };
  
  // Componente para a exibição das estrelas na avaliação
  const RatingStars = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
          />
        ))}
        <span className="ml-1 text-sm font-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <DashboardLayout title="Lojas Parceiras" type="merchant">
      <div className="space-y-6">
        {/* Cabeçalho com estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Parceiros</p>
                  <h3 className="text-2xl font-bold mt-1">{storesData?.length || 0}</h3>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Store className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Parceiros Ativos</p>
                  <h3 className="text-2xl font-bold mt-1">{storesData?.filter((s: any) => s.transactions > 0).length || 0}</h3>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Transações Totais</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {storesData?.reduce((acc: number, store: any) => acc + (store.transactions || 0), 0)}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Volume Financeiro</p>
                  <h3 className="text-2xl font-bold mt-1">
                    R$ {storesData?.reduce((acc: number, store: any) => acc + (store.volume || 0), 0).toFixed(2)}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Landmark className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Parceiros Vale Cashback</CardTitle>
            <CardDescription>
              Conheça outras lojas da rede e estabeleça parcerias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium block mb-2">Pesquisar</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Nome, categoria, etc"
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium block mb-2">Categoria</label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as Categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium block mb-2">Ordenar por</label>
                <Select defaultValue="name">
                  <SelectTrigger>
                    <SelectValue placeholder="Nome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="rating">Avaliação</SelectItem>
                    <SelectItem value="transactions">Volume de Transações</SelectItem>
                    <SelectItem value="newest">Mais Recentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Lista de lojas */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-10">
                <Store className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
                <h3 className="mt-4 text-lg font-medium">Nenhuma loja encontrada</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                  Não encontramos nenhuma loja com os filtros selecionados. Tente ajustar sua busca ou voltar mais tarde.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStores.map((store: any) => (
                  <div
                    key={store.id}
                    className={`border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer ${getCategoryClass(store.category)}`}
                    onClick={() => handleOpenStoreDetails(store)}
                  >
                    <div className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={store.logo} alt={store.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(store.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold truncate">{store.name}</h3>
                          <p className="text-sm text-muted-foreground">{store.category}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        {store.address && (
                          <div className="flex items-start text-sm">
                            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                            <span className="truncate">{store.address}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <RatingStars rating={store.rating || 0} />
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {store.transactions} vendas
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-background/90 p-2 flex justify-between items-center border-t">
                      <span className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Desde {formatDate(store.createdAt)}
                      </span>
                      <Button variant="ghost" size="sm" className="text-xs h-7">
                        Detalhes
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de detalhes da loja */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedStore && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedStore.logo} alt={selectedStore.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedStore.name)}
                    </AvatarFallback>
                  </Avatar>
                  {selectedStore.name}
                </DialogTitle>
                <DialogDescription>
                  Detalhes e informações sobre o parceiro
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="info">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">
                    <Store className="h-4 w-4 mr-2" />
                    Informações
                  </TabsTrigger>
                  <TabsTrigger value="performance">
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Desempenho
                  </TabsTrigger>
                  <TabsTrigger value="partnership">
                    <Users className="h-4 w-4 mr-2" />
                    Parceria
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Sobre a Loja</h3>
                            <RatingStars rating={selectedStore.rating || 0} />
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-4">
                            {selectedStore.description || `${selectedStore.name} é uma loja parceira do Vale Cashback desde ${formatDate(selectedStore.createdAt)}.`}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">Endereço</span>
                                <p className="text-sm text-muted-foreground">
                                  {selectedStore.address ? 
                                    `${selectedStore.address}, ${selectedStore.city}/${selectedStore.state}` : 
                                    "Endereço não informado"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <Phone className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">Telefone</span>
                                <p className="text-sm text-muted-foreground">
                                  {selectedStore.phone || "Não informado"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <Mail className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">Email</span>
                                <p className="text-sm text-muted-foreground">
                                  {selectedStore.email || "Não informado"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">Na plataforma desde</span>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(selectedStore.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Informações Adicionais</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-primary/5 rounded-lg">
                              <p className="text-xs text-muted-foreground">Categoria</p>
                              <p className="font-medium">{selectedStore.category || "Não categorizado"}</p>
                            </div>
                            
                            <div className="p-3 bg-primary/5 rounded-lg">
                              <p className="text-xs text-muted-foreground">Proprietário</p>
                              <p className="font-medium">{selectedStore.owner}</p>
                            </div>
                            
                            <div className="p-3 bg-primary/5 rounded-lg">
                              <p className="text-xs text-muted-foreground">Total de Vendas</p>
                              <p className="font-medium">{selectedStore.transactions} transações</p>
                            </div>
                            
                            <div className="p-3 bg-primary/5 rounded-lg">
                              <p className="text-xs text-muted-foreground">Volume Financeiro</p>
                              <p className="font-medium">R$ {Number(selectedStore.volume).toFixed(2)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div>
                      <Card className="bg-gradient-to-br from-blue-50 to-primary/5 border-primary/20">
                        <CardHeader>
                          <CardTitle className="text-base">Oportunidades de Parceria</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="bg-white rounded-md p-3 shadow-sm">
                            <Badge className="mb-2" variant="outline">Promo</Badge>
                            <h4 className="font-medium text-sm">Promoção Conjunta</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Crie promoções em parceria com esta loja para atrair mais clientes.
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-md p-3 shadow-sm">
                            <h4 className="font-medium text-sm">Compartilhar Clientes</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Ofereça descontos especiais para os clientes desta loja.
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-md p-3 shadow-sm">
                            <h4 className="font-medium text-sm">Evento Conjunto</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Organize eventos ou feiras para promover ambos os negócios.
                            </p>
                          </div>
                          
                          <Button variant="default" className="w-full" onClick={() => alert("Funcionalidade será implementada em breve!")}>
                            Entrar em Contato
                            <Mail className="h-4 w-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="performance" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Desempenho no Vale Cashback</CardTitle>
                      <CardDescription>
                        Estatísticas de vendas e transações
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-primary/5 rounded-lg text-center">
                          <ShoppingBag className="h-8 w-8 mx-auto text-primary mb-2" />
                          <h3 className="text-2xl font-bold">{selectedStore.transactions || 0}</h3>
                          <p className="text-sm text-muted-foreground">Transações</p>
                        </div>
                        
                        <div className="p-4 bg-primary/5 rounded-lg text-center">
                          <Landmark className="h-8 w-8 mx-auto text-primary mb-2" />
                          <h3 className="text-2xl font-bold">R$ {Number(selectedStore.volume || 0).toFixed(2)}</h3>
                          <p className="text-sm text-muted-foreground">Volume Total</p>
                        </div>
                        
                        <div className="p-4 bg-primary/5 rounded-lg text-center">
                          <CreditCard className="h-8 w-8 mx-auto text-primary mb-2" />
                          <h3 className="text-2xl font-bold">{selectedStore.commissionRate}%</h3>
                          <p className="text-sm text-muted-foreground">Taxa de Cashback</p>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="font-medium mb-4">Transações Recentes</h4>
                        {selectedStore.recentTransactions && selectedStore.recentTransactions.length > 0 ? (
                          <div className="space-y-2">
                            {selectedStore.recentTransactions.map((transaction: any) => (
                              <div key={transaction.id} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium">Venda #{transaction.id}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">R$ {Number(transaction.amount).toFixed(2)}</p>
                                  <Badge variant="outline" className={`text-xs ${transaction.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                    {transaction.status === 'completed' ? 'Concluída' : 'Pendente'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-6">
                            Não há transações recentes para exibir.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="partnership" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Oportunidades de Parceria</CardTitle>
                      <CardDescription>
                        Explore formas de colaborar com {selectedStore.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-primary/5 transition cursor-pointer">
                            <div className="flex items-start space-x-3">
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Tag className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">Promoção Cruzada</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Ofereça descontos aos clientes desta loja e vice-versa para aumentar a base de clientes.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-primary/5 transition cursor-pointer">
                            <div className="flex items-start space-x-3">
                              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">Compartilhamento de Clientes</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Crie um programa de fidelidade conjunto para incentivar compras em ambas as lojas.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-primary/5 transition cursor-pointer">
                            <div className="flex items-start space-x-3">
                              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">Produtos Complementares</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Identifique produtos que complementam os seus e promova-os conjuntamente.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-primary/5 transition cursor-pointer">
                            <div className="flex items-start space-x-3">
                              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <BarChart2 className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">Marketing Conjunto</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Compartilhe custos de marketing para promover ambos os negócios.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Como Iniciar uma Parceria</h4>
                          <ol className="list-decimal pl-5 space-y-2 text-sm">
                            <li>Entre em contato com o proprietário através do email: {selectedStore.email}</li>
                            <li>Explique sua proposta de parceria e como ambos podem se beneficiar</li>
                            <li>Defina objetivos claros e métricas para medir o sucesso da parceria</li>
                            <li>Formalize o acordo através da plataforma Vale Cashback</li>
                          </ol>
                        </div>
                        
                        <div className="flex justify-center">
                          <Button 
                            className="w-full md:w-1/2"
                            onClick={() => alert("Funcionalidade será implementada em breve!")}
                          >
                            Iniciar Proposta de Parceria
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}