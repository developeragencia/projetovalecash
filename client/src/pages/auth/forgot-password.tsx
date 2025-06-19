import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Mail, KeyRound, ArrowLeft } from "lucide-react";

// Esquemas de validação
const emailFormSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
});

const resetFormSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  newPassword: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "Confirme a senha" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function ForgotPassword() {
  const [step, setStep] = useState<"email" | "reset" | "success">("email");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Formulário para inserir email
  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  // Formulário para redefinir senha
  const resetForm = useForm<z.infer<typeof resetFormSchema>>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Ir direto para redefinição assim que o email for digitado
  const handleEmailChange = (email: string) => {
    if (email && email.includes("@") && email.includes(".")) {
      setUserEmail(email);
      resetForm.setValue("email", email);
      setStep("reset");
      toast({
        title: "Email confirmado",
        description: "Agora defina sua nova senha.",
      });
    }
  };

  // Manter função original para compatibilidade
  const onEmailSubmit = async (values: z.infer<typeof emailFormSchema>) => {
    handleEmailChange(values.email);
  };
  
  // Redefinir senha diretamente
  const onResetSubmit = async (values: z.infer<typeof resetFormSchema>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          newPassword: values.newPassword,
        }),
      });

      if (response.ok) {
        setStep("success");
        toast({
          title: "Senha redefinida",
          description: "Sua senha foi alterada com sucesso. Você já pode fazer login.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro",
          description: errorData.message || "Erro ao redefinir senha.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao redefinir senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={step === "email" ? "Redefinir Senha" : step === "reset" ? "Nova Senha" : "Sucesso"} 
      description={step === "email" ? "Digite seu email para redefinir sua senha" : step === "reset" ? "Defina sua nova senha" : "Senha alterada com sucesso"}
      showHero={true}
    >
      {step === "email" && (
        <div className="space-y-6">
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Digite seu email para redefinir senha" 
                        className="h-11 px-4"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleEmailChange(e.target.value);
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full h-11 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Verificando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Mail className="mr-2 h-5 w-5" />
                    <span>Continuar</span>
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}

      {step === "reset" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("email")}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">Email: {userEmail}</span>
          </div>

          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Digite sua nova senha" 
                        className="h-11 px-4"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Digite novamente sua nova senha" 
                        className="h-11 px-4"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full h-11 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Atualizando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <KeyRound className="mr-2 h-5 w-5" />
                    <span>Atualizar Senha</span>
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}

      {step === "success" && (
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-4">
            <KeyRound className="h-16 w-16 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-green-600">Senha Atualizada!</h3>
          <p className="text-gray-600">
            Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
          </p>
          <Button 
            onClick={() => navigate("/auth/login")}
            className="w-full h-11 bg-green-600 hover:bg-green-700"
          >
            Fazer Login
          </Button>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Voltar para Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}