import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Eye, Edit, Package, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

// Interface para produtos
interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  inventory: number;
  active: boolean;
}

// Array vazio para quando não há produtos
const emptyProducts: Product[] = [];

export default function MerchantProducts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    inventory: "",
    active: true
  });

  // Query to get products
  const { data, isLoading } = useQuery({
    queryKey: ['/api/merchant/products'],
    placeholderData: { products: [] }
  });

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        category: product.category || "",
        price: product.price.toString(),
        inventory: product.inventory?.toString() || "",
        active: product.active
      });
      setSelectedProduct(product);
    } else {
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        inventory: "",
        active: true
      });
      setSelectedProduct(null);
    }
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.price) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const endpoint = selectedProduct 
        ? `/api/merchant/products/${selectedProduct.id}` 
        : "/api/merchant/products";
      
      const method = selectedProduct ? "PATCH" : "POST";
      
      // Fazer a chamada real à API
      await apiRequest(
        method,
        endpoint,
        {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          inventory: formData.inventory ? parseInt(formData.inventory) : null,
          active: formData.active
        }
      );
      
      toast({
        title: selectedProduct ? "Produto atualizado" : "Produto adicionado",
        description: `${formData.name} foi ${selectedProduct ? "atualizado" : "adicionado"} com sucesso.`,
      });
      
      // Close dialog and refresh products
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/products'] });
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao ${selectedProduct ? "atualizar" : "adicionar"} o produto.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    
    setIsSubmitting(true);
    
    try {
      // Fazer chamada à API para excluir o produto
      await apiRequest(
        "DELETE",
        `/api/merchant/products/${selectedProduct.id}`
      );
      
      toast({
        title: "Produto removido",
        description: `${selectedProduct.name} foi removido com sucesso.`,
      });
      
      // Close dialog and refresh products
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/products'] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover o produto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Column configuration
  const columns = [
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "Categoria",
      accessorKey: "category",
    },
    {
      header: "Preço",
      accessorKey: "price",
      cell: (row: any) => formatCurrency(row.price),
    },
    {
      header: "Estoque",
      accessorKey: "inventory",
    },
    {
      header: "Status",
      accessorKey: "active",
      cell: (row: any) => (
        <Badge variant={row.active ? "success" : "secondary"}>
          {row.active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
  ];

  // Actions configuration
  const actions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: (product: any) => {
        toast({
          title: product.name,
          description: product.description || "Sem descrição disponível",
        });
      },
    },
    {
      label: "Editar",
      icon: <Edit className="h-4 w-4" />,
      onClick: handleOpenDialog,
    },
    {
      label: "Excluir",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleOpenDeleteDialog,
    },
  ];

  return (
    <DashboardLayout title="Produtos/Serviços" type="merchant">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Catálogo de Produtos</CardTitle>
            <CardDescription>Gerencie os produtos e serviços do seu estabelecimento</CardDescription>
          </div>
          <Button className="bg-accent" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data?.products || emptyProducts}
            columns={columns}
            actions={actions}
            searchable={true}
            onSearch={(value) => console.log("Searching:", value)}
            filters={[
              {
                name: "Categoria",
                options: [
                  { label: "Todas as categorias", value: "all" },
                  { label: "Alimentos", value: "Alimentos" },
                  { label: "Bebidas", value: "Bebidas" },
                  { label: "Laticínios", value: "Laticínios" },
                  { label: "Higiene", value: "Higiene" },
                  { label: "Limpeza", value: "Limpeza" },
                ],
                onChange: (value) => console.log("Category filter:", value),
              },
              {
                name: "Status",
                options: [
                  { label: "Todos", value: "all" },
                  { label: "Ativos", value: "active" },
                  { label: "Inativos", value: "inactive" },
                ],
                onChange: (value) => console.log("Status filter:", value),
              },
            ]}
            pagination={{
              pageIndex: 0,
              pageSize: 10,
              pageCount: Math.ceil((data?.products || emptyProducts).length / 10),
              onPageChange: (page) => console.log("Page:", page),
            }}
            exportable={true}
            onExport={() => console.log("Exporting products")}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? "Editar Produto" : "Adicionar Produto"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do produto abaixo
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome do produto"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descrição do produto"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Categoria"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Preço ($) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0,00"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inventory">Estoque</Label>
                <Input
                  id="inventory"
                  name="inventory"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.inventory}
                  onChange={handleInputChange}
                  placeholder="Quantidade em estoque"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  disabled={isSubmitting}
                />
                <Label htmlFor="active">Produto ativo</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-accent"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {selectedProduct ? "Atualizando..." : "Salvando..."}
                  </>
                ) : (
                  <>
                    {selectedProduct ? "Atualizar" : "Salvar"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto "{selectedProduct?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
