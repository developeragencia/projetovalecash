import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  User, 
  CreditCard,
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle2,
  Loader2,
  Search,
  ArrowRight,
  Gift,
  Users,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";

// Interfaces
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  referred_by: number | null;
  referral_code?: string;
}

interface Product {
  id: number;
  name: string;
  price: string | number;
  description?: string;
  category?: string;
  sku?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface SaleTransaction {
  id: number;
  customer_id: number;
  customer_name: string;
  date: string;
  items: number;
  amount: number;
  cashback: number;
  payment_method: string;
  status: string;
  description?: string;
  notes?: string;
}

// Constants
const CASHBACK_RATE = 0.02; // 2%
const REFERRAL_RATE = 0.01; // 1%

export default function MerchantSales() {
  // State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Customer search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchBy, setSearchBy] = useState<'name' | 'email' | 'phone'>('name');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Dialog states
  const [showCustomerDialog, setShowCustomerDialog] = useState<boolean>(false);
  const [showProductDialog, setShowProductDialog] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Load products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/merchant/products'],
    retry: 1,
    staleTime: 300000 // 5 minutes
  });

  // Load sales
  const { data: sales = [], isLoading: loadingSales, refetch: refetchSales } = useQuery<SaleTransaction[]>({
    queryKey: ['/api/merchant/sales'],
    retry: 1,
    staleTime: 30000 // 30 seconds
  });

  // Register sale mutation
  const registerSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      console.log("Enviando dados da venda:", saleData);
      const response = await apiRequest("POST", "/api/merchant/sales", saleData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Resposta da venda:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Venda registrada com sucesso:", data);
      toast({
        title: "Venda registrada com sucesso!",
        description: `Transação processada. Cliente receberá $${data.transaction?.cashback?.toFixed(2) || '0.00'} de cashback.`
      });
      
      resetForm();
      setIsProcessing(false);
      refetchSales();
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/dashboard'] });
    },
    onError: (error: any) => {
      console.error("Erro ao registrar venda:", error);
      toast({
        title: "Erro ao processar venda",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  // Customer search effect
  useEffect(() => {
    if (searchTerm.length < 2) {
      setCustomerResults([]);
      return;
    }

    setIsSearching(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await apiRequest("GET", `/api/merchant/customers?term=${encodeURIComponent(searchTerm)}&searchBy=${searchBy}`);
        const data = await response.json();
        setCustomerResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        setCustomerResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchBy]);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price.toString()) * item.quantity), 0);
  const finalAmount = cartItems.length > 0 ? Math.max(0, subtotal - discount) : Math.max(0, manualAmount - discount);
  const cashbackAmount = finalAmount * CASHBACK_RATE;
  const referralBonus = selectedCustomer?.referred_by ? finalAmount * REFERRAL_RATE : 0;

  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Data não disponível';
    
    try {
      // Check if it's already a formatted string from the API
      if (typeof dateValue === 'string' && dateValue.includes('/')) {
        return dateValue;
      }
      
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Data inválida';
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCartItems([]);
    setManualAmount(0);
    setPaymentMethod("cash");
    setDiscount(0);
    setNotes("");
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchTerm("");
    setCustomerResults([]);
    setShowCustomerDialog(false);
  };

  const handleAddToCart = (product: Product) => {
    const existingIndex = cartItems.findIndex(item => item.id === product.id);
    
    if (existingIndex >= 0) {
      const updatedItems = [...cartItems];
      updatedItems[existingIndex].quantity += 1;
      setCartItems(updatedItems);
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    setShowProductDialog(false);
  };

  const handleRemoveFromCart = (productId: number) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    
    setCartItems(cartItems.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleSubmitSale = () => {
    console.log("Iniciando validação da venda:");
    console.log("- Cliente selecionado:", selectedCustomer);
    console.log("- Valor final:", finalAmount);
    console.log("- Valor manual:", manualAmount);
    console.log("- Itens no carrinho:", cartItems.length);
    console.log("- Subtotal:", subtotal);

    if (!selectedCustomer) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione um cliente para processar a venda.",
        variant: "destructive"
      });
      return;
    }

    if (finalAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor da venda deve ser maior que zero. Adicione produtos ou insira um valor manual.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    const saleData = {
      customerId: selectedCustomer.id,
      total: finalAmount,
      paymentMethod: paymentMethod,
      notes: notes || undefined,
      items: cartItems.length > 0 ? cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price.toString())
      })) : undefined,
      discount: discount > 0 ? discount : 0,
      subtotal: cartItems.length > 0 ? subtotal : manualAmount,
      cashback: cashbackAmount,
      manualAmount: cartItems.length === 0 ? manualAmount : undefined
    };

    console.log("Dados da venda a serem enviados:", saleData);
    registerSaleMutation.mutate(saleData);
  };

  return (
    <DashboardLayout title="Vendas" type="merchant">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sistema de Vendas</h1>
            <p className="text-muted-foreground mt-1">
              Registre vendas e processe cashback para seus clientes
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              🇺🇸 Sistema em USD (Dólares)
            </Badge>
          </div>
        </div>

        {/* Header Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Vendas Hoje</p>
                  <p className="text-2xl font-bold">{sales.filter(sale => 
                    new Date(sale.date).toDateString() === new Date().toDateString()
                  ).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Faturamento Hoje</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(sales.filter(sale => 
                      new Date(sale.date).toDateString() === new Date().toDateString()
                    ).reduce((sum, sale) => sum + sale.amount, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Gift className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cashback Distribuído</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(sales.reduce((sum, sale) => sum + sale.cashback, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                  <p className="text-2xl font-bold">{sales.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sale Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Registrar Nova Venda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Cliente</Label>
                  {selectedCustomer ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-green-800">{selectedCustomer.name}</p>
                          <p className="text-sm text-green-600">{selectedCustomer.email}</p>
                          {selectedCustomer.phone && (
                            <p className="text-sm text-green-600">{selectedCustomer.phone}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(null)}
                          className="text-green-700 hover:text-green-800"
                        >
                          Alterar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Search className="h-4 w-4 mr-2" />
                          Buscar Cliente
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Buscar Cliente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Select value={searchBy} onValueChange={(value: 'name' | 'email' | 'phone') => setSearchBy(value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="name">Nome</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Telefone</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder={`Buscar por ${searchBy === 'name' ? 'nome' : searchBy === 'email' ? 'email' : 'telefone'}`}
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="flex-1"
                            />
                          </div>
                          
                          {isSearching ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : customerResults.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {customerResults.map((customer) => (
                                <div
                                  key={customer.id}
                                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                                  onClick={() => handleSelectCustomer(customer)}
                                >
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-sm text-gray-600">{customer.email}</p>
                                  {customer.phone && (
                                    <p className="text-sm text-gray-600">{customer.phone}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : searchTerm.length >= 2 ? (
                            <p className="text-center py-4 text-gray-500">Nenhum cliente encontrado</p>
                          ) : null}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <Separator />

                {/* Amount Input - Primary */}
                <div className="space-y-3">
                  <Label htmlFor="amount" className="text-base font-medium">Valor da Venda (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={cartItems.length > 0 ? finalAmount : (manualAmount || "")}
                    onChange={(e) => {
                      if (cartItems.length === 0) {
                        setManualAmount(parseFloat(e.target.value) || 0);
                      }
                    }}
                    disabled={cartItems.length > 0}
                    className="text-lg h-12 font-semibold"
                  />
                  {cartItems.length > 0 && (
                    <p className="text-sm text-blue-600">Valor calculado pelos produtos adicionados</p>
                  )}
                </div>

                {/* Advanced Options - Collapsible */}
                <div className="border rounded-lg p-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-800"
                  >
                    <span>Opções Avançadas (Produtos e Desconto)</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showAdvanced && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      {/* Product Selection */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Produtos Cadastrados</Label>
                          <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Selecionar Produtos</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                {products.map((product) => (
                                  <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardContent className="p-4" onClick={() => handleAddToCart(product)}>
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <h4 className="font-medium">{product.name}</h4>
                                          {product.description && (
                                            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                                          )}
                                          <p className="text-lg font-bold text-green-600 mt-2">
                                            {formatCurrency(parseFloat(product.price.toString()))}
                                          </p>
                                        </div>
                                        <Plus className="h-5 w-5 text-gray-400" />
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {/* Cart Items */}
                        {cartItems.length > 0 && (
                          <div className="space-y-2">
                            {cartItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-600">{formatCurrency(parseFloat(item.price.toString()))}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveFromCart(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="font-medium">Subtotal:</span>
                              <span className="font-bold">{formatCurrency(subtotal)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Discount */}
                      <div className="space-y-2">
                        <Label htmlFor="discount" className="text-sm">Desconto (USD)</Label>
                        <Input
                          id="discount"
                          type="number"
                          step="0.01"
                          min="0"
                          max={cartItems.length > 0 ? subtotal : manualAmount}
                          placeholder="0.00"
                          value={discount || ""}
                          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Método de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Dinheiro</SelectItem>
                      <SelectItem value="credit_card">💳 Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">💳 Cartão de Débito</SelectItem>
                      <SelectItem value="pix">📱 PIX</SelectItem>
                      <SelectItem value="bank_transfer">🏦 Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (Opcional)</Label>
                  <Input
                    id="notes"
                    placeholder="Observações sobre a venda..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Sale Summary */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <h3 className="font-medium text-gray-900">Resumo da Venda</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Valor Total:</span>
                      <span className="font-medium">{formatCurrency(finalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Cashback Cliente (2%):</span>
                      <span className="font-medium">{formatCurrency(cashbackAmount)}</span>
                    </div>
                    {referralBonus > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Bônus Indicação (1%):</span>
                        <span className="font-medium">{formatCurrency(referralBonus)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmitSale} 
                  className="w-full h-12 text-lg"
                  disabled={isProcessing || !selectedCustomer || finalAmount <= 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Finalizar Venda
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sales */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Vendas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSales ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : sales.length > 0 ? (
                  <div className="space-y-3">
                    {sales.slice(0, 10).map((sale) => (
                      <div key={sale.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{sale.customer_name}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(sale.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(sale.amount)}</p>
                            <p className="text-sm text-green-600">
                              +{formatCurrency(sale.cashback)} cashback
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma venda registrada ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}