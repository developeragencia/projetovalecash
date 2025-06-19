import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Store, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  TrendingUp,
  ArrowRight,
  ShoppingBag,
  Utensils,
  ShirtIcon,
  Gamepad2,
  Book,
  Heart,
  Home,
  Car,
  Gift,
  Loader2
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

  // Buscar lojas
  const { data: storesData, isLoading } = useQuery<StoreItem[]>({
    queryKey: ["/api/merchants/stores"]
  });

  // Filtrar lojas
  const filteredStores = storesData ? storesData.filter((store: StoreItem) => {
    const matchesSearch = searchTerm === "" || 
      (store.store_name || store.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.city || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      (store.category || "Geral") === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) : [];

  // Obter categorias únicas
  const categories = Array.from(new Set(storesData?.map((store: StoreItem) => store.category || 'Geral') || []));
  
  // Abrir o modal de detalhes da loja
  const handleOpenStoreDetails = (store: StoreItem) => {
    setSelectedStore(store);
    setIsDialogOpen(true);
  };

  // Função para formatar taxa de cashback
  const formatCashbackRate = (rate: string | number | undefined) => {
    if (!rate) return '2.0%';
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return `${numRate.toFixed(1)}%`;
  };

  // Ícones de categoria
  const getCategoryIcon = (category: string = "") => {
    switch (category.toLowerCase()) {
      case 'alimentação':
      case 'restaurante':
        return <Utensils className="h-4 w-4" />;
      case 'moda':
      case 'roupas':
        return <ShirtIcon className="h-4 w-4" />;
      case 'eletrônicos':
      case 'tecnologia':
        return <Gamepad2 className="h-4 w-4" />;
      case 'livros':
      case 'educação':
        return <Book className="h-4 w-4" />;
      case 'saúde':
      case 'farmácia':
        return <Heart className="h-4 w-4" />;
      case 'casa':
      case 'decoração':
        return <Home className="h-4 w-4" />;
      case 'automotivo':
        return <Car className="h-4 w-4" />;
      case 'presentes':
        return <Gift className="h-4 w-4" />;
      default:
        return <Store className="h-4 w-4" />;
    }
  };

  // Classes de cor por categoria
  const getCategoryClass = (category: string = "") => {
    switch (category.toLowerCase()) {
      case 'alimentação':
      case 'restaurante':
        return 'bg-gradient-to-br from-orange-400 to-red-500';
      case 'moda':
      case 'roupas':
        return 'bg-gradient-to-br from-pink-400 to-purple-500';
      case 'eletrônicos':
      case 'tecnologia':
        return 'bg-gradient-to-br from-blue-400 to-cyan-500';
      case 'livros':
      case 'educação':
        return 'bg-gradient-to-br from-green-400 to-emerald-500';
      case 'saúde':
      case 'farmácia':
        return 'bg-gradient-to-br from-red-400 to-pink-500';
      case 'casa':
      case 'decoração':
        return 'bg-gradient-to-br from-yellow-400 to-orange-500';
      case 'automotivo':
        return 'bg-gradient-to-br from-gray-400 to-slate-500';
      case 'presentes':
        return 'bg-gradient-to-br from-purple-400 to-indigo-500';
      default:
        return 'bg-gradient-to-br from-primary to-primary/80';
    }
  };

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DashboardLayout title="Lojas Parceiras" type="client">
      <div className="space-y-6">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Pesquisar lojas, categorias ou cidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de lojas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Lojas Disponíveis ({filteredStores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Carregando lojas...</span>
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || selectedCategory !== "all" 
                    ? "Nenhuma loja encontrada com os filtros aplicados" 
                    : "Nenhuma loja cadastrada ainda"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredStores.map((store: StoreItem) => (
                  <div 
                    key={store.id} 
                    className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer"
                    onClick={() => handleOpenStoreDetails(store)}
                  >
                    {/* Banner da categoria */}
                    <div className={`h-20 w-full ${getCategoryClass(store.category)} relative`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
                      <div className="absolute top-3 left-3 flex items-center gap-2 text-white">
                        {getCategoryIcon(store.category)}
                        <Badge className="bg-white/20 text-white border-none backdrop-blur-sm">
                          {store.category || "Geral"}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                        <span className="text-white text-xs font-medium">
                          {formatCashbackRate(store.commissionRate)} cashback
                        </span>
                      </div>
                    </div>

                    {/* Avatar da loja */}
                    <div className="absolute top-12 left-6 z-10">
                      <Avatar className="h-14 w-14 border-4 border-white dark:border-gray-800 shadow-md">
                        <AvatarImage src={store.logo || undefined} />
                        <AvatarFallback className="bg-primary text-white font-semibold">
                          {getInitials(store.store_name || store.name || "L")}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Conteúdo */}
                    <div className="pt-8 p-6">
                      <div className="mb-3">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                          {store.store_name || store.name}
                        </h3>
                        {store.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {store.description}
                          </p>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="space-y-2 mb-4">
                        {(store.city || store.state) && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-3.5 w-3.5 mr-2" />
                            {store.city}{store.city && store.state && ', '}{store.state}
                          </div>
                        )}
                        
                        {store.rating && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 mr-2" />
                            {store.rating.toFixed(1)} estrelas
                          </div>
                        )}

                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-500">
                          <Clock className="h-3.5 w-3.5 mr-2" />
                          Desde {new Date(store.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      {/* Estatísticas */}
                      {(store.transactions || store.volume) && (
                        <div className="flex items-center justify-between mb-4 text-xs">
                          {store.transactions && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {store.transactions} vendas
                            </div>
                          )}
                          {store.volume && (
                            <div className="text-gray-600 dark:text-gray-400">
                              R$ {store.volume.toLocaleString('pt-BR')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botão de ação */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          Ganhe {formatCashbackRate(store.commissionRate)}
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white font-medium px-4 rounded-full shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStoreDetails(store);
                          }}
                        >
                          Ver detalhes
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de detalhes da loja */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            {selectedStore && (
              <div className="space-y-6">
                {/* Header do modal */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedStore.logo || undefined} />
                    <AvatarFallback className="bg-primary text-white text-lg font-bold">
                      {getInitials(selectedStore.store_name || selectedStore.name || "L")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedStore.store_name || selectedStore.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="secondary">
                        {selectedStore.category || "Geral"}
                      </Badge>
                      {selectedStore.rating && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                          {selectedStore.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cashback destacado */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {formatCashbackRate(selectedStore.commissionRate)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Cashback em todas as compras
                  </p>
                </div>

                {/* Informações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Sobre a Loja
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {selectedStore.description || "Descrição não disponível"}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Informações de Contato
                    </h3>
                    <div className="space-y-2">
                      {selectedStore.email && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 mr-2" />
                          {selectedStore.email}
                        </div>
                      )}
                      {selectedStore.phone && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4 mr-2" />
                          {selectedStore.phone}
                        </div>
                      )}
                      {(selectedStore.address || selectedStore.city || selectedStore.state) && (
                        <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                          <div>
                            {selectedStore.address && <div>{selectedStore.address}</div>}
                            {(selectedStore.city || selectedStore.state) && (
                              <div>{selectedStore.city}{selectedStore.city && selectedStore.state && ', '}{selectedStore.state}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button className="flex-1">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Comprar e Ganhar Cashback
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Heart className="h-4 w-4 mr-2" />
                    Favoritar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}