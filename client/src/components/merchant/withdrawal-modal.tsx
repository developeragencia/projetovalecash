import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema para validação do formulário de saque
const withdrawalSchema = z.object({
  amount: z
    .string()
    .refine(
      (val) => {
        const num = parseFloat(val.replace(/,/g, "."));
        return !isNaN(num) && num >= 20; // Mínimo de $20 para saque
      },
      { message: "Valor mínimo para saque: $20" }
    ),
  bank_name: z.string().min(3, { message: "Nome do banco é obrigatório" }),
  account_number: z.string().min(5, { message: "Número da conta é obrigatório" }),
  account_type: z.string().min(1, { message: "Tipo de conta é obrigatório" }),
  payment_method: z.string().min(1, { message: "Método de pagamento é obrigatório" }),
  notes: z.string().optional(),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  withdrawalFee: number;
}

export function WithdrawalModal({
  isOpen,
  onClose,
  availableBalance,
  withdrawalFee
}: WithdrawalModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [finalAmount, setFinalAmount] = useState<number | null>(null);

  // Configurar formulário com react-hook-form
  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
      bank_name: "",
      account_number: "",
      account_type: "checking",
      payment_method: "bank_transfer",
      notes: "",
    },
  });

  // Mutation para criar solicitação de saque
  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalFormData) => {
      const response = await apiRequest("POST", "/api/merchant/withdrawal-requests", {
        ...data,
        amount: parseFloat(data.amount.replace(/,/g, ".")),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada com sucesso",
        description: "Sua solicitação de saque foi enviada e está em análise.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/salaries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/withdrawal-requests'] });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Calcular valor final após taxa
  const calculateFinalAmount = (value: string) => {
    const amount = parseFloat(value.replace(/,/g, "."));
    if (!isNaN(amount)) {
      const fee = amount * withdrawalFee;
      setFinalAmount(amount - fee);
    } else {
      setFinalAmount(null);
    }
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Submeter formulário
  const onSubmit = (data: WithdrawalFormData) => {
    const amount = parseFloat(data.amount.replace(/,/g, "."));
    
    // Verificar se tem saldo disponível
    if (amount > availableBalance) {
      toast({
        title: "Saldo insuficiente",
        description: `Seu saldo disponível é de ${formatCurrency(availableBalance)}`,
        variant: "destructive",
      });
      return;
    }
    
    // Enviar solicitação
    withdrawalMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Saque</DialogTitle>
          <DialogDescription>
            Preencha os dados para solicitar um saque da sua conta Vale Cashback.
            Taxa da plataforma: {(withdrawalFee * 100).toFixed(0)}%
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor a sacar</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input
                        {...field}
                        className="pl-8"
                        onChange={(e) => {
                          field.onChange(e);
                          calculateFinalAmount(e.target.value);
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Saldo disponível: {formatCurrency(availableBalance)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {finalAmount !== null && (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex justify-between items-center text-sm">
                  <span>Valor solicitado:</span>
                  <span>{formatCurrency(parseFloat(form.getValues().amount.replace(/,/g, ".")))}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-orange-600">
                  <span>Taxa da plataforma ({(withdrawalFee * 100).toFixed(0)}%):</span>
                  <span>-{formatCurrency(parseFloat(form.getValues().amount.replace(/,/g, ".")) * withdrawalFee)}</span>
                </div>
                <div className="flex justify-between items-center font-bold mt-1 pt-1 border-t border-border">
                  <span>Valor a receber:</span>
                  <span>{formatCurrency(finalAmount)}</span>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de pagamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Transferência bancária</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do banco</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do seu banco" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da conta</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Número da conta" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de conta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="checking">Corrente</SelectItem>
                        <SelectItem value="savings">Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Informações adicionais" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={withdrawalMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={withdrawalMutation.isPending}>
                {withdrawalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando
                  </>
                ) : (
                  "Solicitar Saque"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}