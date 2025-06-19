import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth.tsx";
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
import { Loader2, User, Store, ShieldCheck, Mail, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";

type UserTypeOption = "client" | "merchant" | "admin";

interface UserTypeConfig {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  hoverBgColor: string;
  activeBgColor: string;
  textColor: string;
  activeTextColor: string;
  borderColor: string;
  buttonColor: string;
}

export default function Login() {
  const [userType, setUserType] = useState<UserTypeOption>("client");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Esquema do formulário com validações
  const formSchema = z.object({
    email: z.string().email({ message: t('errors.invalidEmail') }),
    password: z.string().min(6, { message: t('errors.passwordLength') }),
  });

  // Esquema para redefinição de senha
  const resetFormSchema = z.object({
    email: z.string().email({ message: "Email inválido" }),
    newPassword: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
    confirmPassword: z.string().min(6, { message: "Confirme a senha" }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
  
  // Configurações do formulário
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Formulário de redefinição de senha
  const resetForm = useForm({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Detectar email válido automaticamente
  const handleEmailChange = async (email: string) => {
    if (email && email.includes("@") && email.includes(".")) {
      try {
        // Verificar se o email já teve a senha atualizada
        const response = await fetch(`/api/check-password-updated/${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data.userExists && !data.passwordUpdated) {
          setResetEmail(email);
          resetForm.setValue("email", email);
          setShowPasswordReset(true);
          toast({
            title: "Redefinir senha",
            description: "Digite sua nova senha abaixo para atualizar.",
          });
        } else {
          setShowPasswordReset(false);
          setResetEmail("");
          resetForm.reset();
        }
      } catch (error) {
        console.error("Erro ao verificar status da senha:", error);
        setShowPasswordReset(false);
        setResetEmail("");
        resetForm.reset();
      }
    } else {
      setShowPasswordReset(false);
      setResetEmail("");
      resetForm.reset();
    }
  };

  // Função de envio do formulário
  const onSubmit = async (values: any) => {
    try {
      await login(values.email, values.password, userType);
    } catch (error) {
      console.error("Login error:", error);
      form.setError("root", { 
        type: "manual",
        message: t('errors.loginFailed')
      });
    }
  };

  // Redefinir senha diretamente
  const onResetSubmit = async (values: z.infer<typeof resetFormSchema>) => {
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          newPassword: values.newPassword
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Senha atualizada com sucesso! Faça login com a nova senha.",
        });
        setShowPasswordReset(false);
        setResetEmail("");
        form.setValue("email", values.email);
        form.setValue("password", "");
        resetForm.reset();
        setTimeout(() => {
          form.setFocus("password");
        }, 100);
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao redefinir senha",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao redefinir senha",
        variant: "destructive",
      });
    }
  };
  
  // Adicionar link para telas de boas-vindas
  const handleGoToWelcomeScreens = () => {
    window.location.href = "/welcome";
  };

  // Configurações dos tipos de usuário com tradução - usando cores Vale Cashback
  const userTypeConfigs: Record<UserTypeOption, UserTypeConfig> = {
    client: {
      icon: <User className="h-5 w-5" />,
      label: t('auth.clientLogin'),
      bgColor: "bg-white",
      hoverBgColor: "hover:bg-gray-50",
      activeBgColor: "bg-[#3db54e]", // Verde Vale Cashback
      textColor: "text-[#3db54e]",
      activeTextColor: "text-white",
      borderColor: "border-[#3db54e]/30",
      buttonColor: "bg-[#3db54e] hover:bg-[#36a146]"
    },
    merchant: {
      icon: <Store className="h-5 w-5" />,
      label: t('auth.merchantLogin'),
      bgColor: "bg-white",
      hoverBgColor: "hover:bg-gray-50",
      activeBgColor: "bg-[#f58220]", // Laranja Vale Cashback
      textColor: "text-[#f58220]",
      activeTextColor: "text-white",
      borderColor: "border-[#f58220]/30",
      buttonColor: "bg-[#f58220] hover:bg-[#e37718]"
    },
    admin: {
      icon: <ShieldCheck className="h-5 w-5" />,
      label: t('auth.adminLogin'),
      bgColor: "bg-white",
      hoverBgColor: "hover:bg-gray-50",
      activeBgColor: "bg-blue-600",
      textColor: "text-blue-600",
      activeTextColor: "text-white",
      borderColor: "border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    }
  };

  const config = userTypeConfigs[userType];

  return (
    <AuthLayout title={t('auth.loginTitle')} description={t('auth.loginDescription')}>
      <div className="mb-8">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Object.entries(userTypeConfigs).map(([type, typeConfig]) => {
            const isActive = type === userType;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setUserType(type as UserTypeOption)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-300 ${
                  isActive 
                    ? `${typeConfig.activeBgColor} ${typeConfig.activeTextColor} border-transparent shadow-md` 
                    : `${typeConfig.bgColor} ${typeConfig.textColor} ${typeConfig.borderColor} ${typeConfig.hoverBgColor}`
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBackground"
                    className="absolute inset-0 rounded-lg"
                    initial={false}
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`rounded-full p-2 mb-2 ${isActive ? 'bg-white/20' : 'bg-white'}`}>
                    {typeConfig.icon}
                  </div>
                  <span className="text-sm font-medium">{typeConfig.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-600">{t('auth.email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder=""
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-gray-600">{t('auth.password')}</FormLabel>
                  <Link href="/auth/forgot-password" className="text-sm text-[#f58220] hover:underline">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder=""
                    className="h-11 px-4"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <div className="text-sm text-red-500 font-medium mt-2 text-center">
              {form.formState.errors.root.message}
            </div>
          )}

          <Button
            type="submit"
            className={`w-full h-11 mt-5 transition-all duration-300 ${config.buttonColor}`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>{t('auth.processing')}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span>{t('auth.loginAs')} {config.label}</span>
              </div>
            )}
          </Button>
        </form>
      </Form>

      {/* Seção de Redefinição de Senha Automática */}
      {showPasswordReset && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 p-6 border border-orange-200 rounded-lg bg-orange-50"
        >
          <div className="flex items-center mb-4">
            <Mail className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-orange-800">
              Redefinir Senha para: {resetEmail}
            </h3>
          </div>
          
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua nova senha"
                          className="h-11 px-4 pr-12"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
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
                    <FormLabel className="text-gray-700">Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirme sua nova senha"
                        className="h-11 px-4"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Atualizar Senha
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setResetEmail("");
                    resetForm.reset();
                  }}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          {t('auth.noAccount')} <Link href="/auth/register" className="text-[#3db54e] font-medium hover:underline transition-colors">{t('auth.signUp')}</Link>
        </p>
        <button 
          onClick={handleGoToWelcomeScreens} 
          className="mt-4 text-sm text-[#f58220] hover:underline cursor-pointer transition-colors"
        >
          Ver telas de boas-vindas
        </button>
      </div>
    </AuthLayout>
  );
}
