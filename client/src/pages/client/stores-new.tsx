import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Store, 
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  Tag,
  CreditCard,
  ShoppingBag,
  Calendar,
  ExternalLink,
  ArrowRight,
  Search,
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  Percent
} from "lucide-react";

interface StoreItem {
  id: number;
  userId?: number;
  user_id?: number;
  store_name?: string;
  name?: string;
  logo?: string | null;
  category?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  commissionRate?: string | number;
  rating?: number;
  createdAt: string;
  email?: string;
  phone?: string;
  transactions?: number;
  volume?: number;
}

export default function ClientStores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Query para buscar lojas
  const { data: stores = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/stores'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stores');
      if (!response.ok) {
        throw new Error('Erro ao buscar lojas');
      }
      const data = await response.json();
      console.log('🏪 Lojas carregadas:', data);
      return Array.isArray(data) ? data : [];
    },
  });

  // Filtrar lojas
  const filteredStores = stores.filter((store: StoreItem) => {
    const storeName = store.store_name || store.name || '';
    const category = store.category || '';
    
    const matchesSearch = storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
                           category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  // Obter categorias únicas
  const categories = Array.from(new Set(stores.map((store: StoreItem) => store.category || 'Geral')));

  const formatCommissionRate = (rate: string | number | undefined) => {
    if (!rate) return '2.0%';
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return `${numRate.toFixed(1)}%`;
  };

  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getCategoryIcon = (category: string = "") => {
    const cat = category.toLowerCase();
    if (cat.includes('restaurante') || cat.includes('comida')) return '🍽️';
    if (cat.includes('farmácia') || cat.includes('saúde')) return '💊';
    if (cat.includes('moda') || cat.includes('roupa')) return '👕';
    if (cat.includes('eletrônico') || cat.includes('tech')) return '📱';
    if (cat.includes('supermercado') || cat.includes('mercado')) return '🛒';
    if (cat.includes('combustível') || cat.includes('posto')) return '⛽';
    return '🏪';
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Lojas" type="client">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#3db54e]" />
          <span className="ml-2 text-muted-foreground">Carregando lojas...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Lojas" type="client">
      <div className="space-y-6">
        {/* Header com busca e filtros */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar lojas por nome ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className="whitespace-nowrap"
              >
                Todas ({stores.length})
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {getCategoryIcon(category)} {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de lojas */}
        {filteredStores.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma loja encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== "all" 
                  ? "Tente ajustar os filtros de busca" 
                  : "Ainda não há lojas cadastradas"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <Card 
                key={store.id} 
                className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:scale-105 cursor-pointer"
                onClick={() => {
                  setSelectedStore(store);
                  setIsDialogOpen(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-[#3db54e]/20">
                        <AvatarImage src={store.logo || undefined} />
                        <AvatarFallback className="bg-[#3db54e] text-white font-bold text-lg">
                          {getInitials(store.store_name || store.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg leading-tight group-hover:text-[#3db54e] transition-colors">
                          {store.store_name || store.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-[#3db54e]/10 text-[#3db54e] border-[#3db54e]/20"
                          >
                            {getCategoryIcon(store.category)} {store.category || 'Geral'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Informações principais */}
                  <div className="space-y-3">
                    {store.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-[#f58220]" />
                        <span className="truncate">
                          {store.address}
                          {store.city && `, ${store.city}`}
                          {store.state && `/${store.state}`}
                        </span>
                      </div>
                    )}
                    
                    {store.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 text-[#f58220]" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div className="text-center p-3 bg-[#3db54e]/5 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Percent className="h-4 w-4 text-[#3db54e]" />
                        <span className="text-lg font-bold text-[#3db54e]">
                          {formatCommissionRate(store.commissionRate)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Cashback</p>
                    </div>
                    
                    <div className="text-center p-3 bg-[#f58220]/5 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ShoppingBag className="h-4 w-4 text-[#f58220]" />
                        <span className="text-lg font-bold text-[#f58220]">
                          {store.transactions || 0}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Vendas</p>
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="pt-2">
                    <Button 
                      className="w-full bg-[#3db54e] hover:bg-[#3db54e]/90 text-white group"
                      size="sm"
                    >
                      Ver Detalhes
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de detalhes da loja */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedStore?.logo || undefined} />
                  <AvatarFallback className="bg-[#3db54e] text-white">
                    {getInitials(selectedStore?.store_name || selectedStore?.name)}
                  </AvatarFallback>
                </Avatar>
                {selectedStore?.store_name || selectedStore?.name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedStore && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                  <TabsTrigger value="contact">Contato</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-[#3db54e]" />
                      <span className="font-medium">Categoria:</span>
                      <Badge variant="secondary">{selectedStore.category || 'Geral'}</Badge>
                    </div>
                    
                    {selectedStore.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-[#f58220] mt-0.5" />
                        <div>
                          <span className="font-medium">Endereço:</span>
                          <p className="text-muted-foreground">
                            {selectedStore.address}
                            {selectedStore.city && `, ${selectedStore.city}`}
                            {selectedStore.state && `/${selectedStore.state}`}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#3db54e]" />
                      <span className="font-medium">Membro desde:</span>
                      <span className="text-muted-foreground">
                        {new Date(selectedStore.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="stats" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Percent className="h-8 w-8 text-[#3db54e] mx-auto mb-2" />
                        <div className="text-2xl font-bold text-[#3db54e]">
                          {formatCommissionRate(selectedStore.commissionRate)}
                        </div>
                        <p className="text-sm text-muted-foreground">Taxa de Cashback</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <ShoppingBag className="h-8 w-8 text-[#f58220] mx-auto mb-2" />
                        <div className="text-2xl font-bold text-[#f58220]">
                          {selectedStore.transactions || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Total de Vendas</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    {selectedStore.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-4 w-4 text-[#3db54e]" />
                        <div>
                          <span className="font-medium">Email:</span>
                          <p className="text-muted-foreground">{selectedStore.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedStore.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-4 w-4 text-[#f58220]" />
                        <div>
                          <span className="font-medium">Telefone:</span>
                          <p className="text-muted-foreground">{selectedStore.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}