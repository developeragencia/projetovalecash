import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Users, BarChart3, Store, ChevronRight } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  showHero?: boolean;
}

export function AuthLayout({
  children,
  title,
  description,
  footer,
  showHero = true,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Helmet>
        <title>{title} | Vale Cashback</title>
      </Helmet>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Lado esquerdo - Hero (só aparece em desktop) */}
        <div className="hidden md:flex bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 py-8 px-6 flex-1 flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')] opacity-20"></div>
          
          <div className="relative z-10 max-w-xl mx-auto text-white">
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <img 
                  src="/LOGO-VALE-CASHBACK.SEM-FUNDO.png" 
                  alt="Vale Cashback Logo" 
                  className="h-52 w-auto"
                  style={{ 
                    maxWidth: '100%',
                    filter: 'brightness(0) invert(1)'
                  }}
                />
              </div>
              <div className="h-1 w-20 bg-orange-400 rounded-full mb-6"></div>
            </div>
            
            <h2 className="text-3xl font-bold mb-4">
              Programa de cashback e fidelidade completo
            </h2>
            <p className="text-blue-100 mb-10 text-lg">
              Conectamos lojistas e clientes em uma plataforma de fidelidade com cashback, referências e muito mais.
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex items-center bg-white/10 p-4 rounded-lg backdrop-blur-sm transition-all hover:bg-white/20">
                <div className="bg-orange-400 p-3 rounded-full text-white mr-4">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Cashback em todas as compras</h3>
                  <p className="text-blue-100">
                    Ganhe dinheiro de volta em todas as compras nas lojas participantes.
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-white/10 p-4 rounded-lg backdrop-blur-sm transition-all hover:bg-white/20">
                <div className="bg-orange-400 p-3 rounded-full text-white mr-4">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Sistema de indicação com bonificações</h3>
                  <p className="text-blue-100">
                    Indique amigos e ganhe bônus de cashback em cada indicação.
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-white/10 p-4 rounded-lg backdrop-blur-sm transition-all hover:bg-white/20">
                <div className="bg-orange-400 p-3 rounded-full text-white mr-4">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Plataforma para lojistas</h3>
                  <p className="text-blue-100">
                    Ferramentas completas para gerenciar vendas e fidelizar clientes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center bg-white/10 p-4 rounded-lg backdrop-blur-sm transition-all hover:bg-white/20">
                <div className="bg-orange-400 p-3 rounded-full text-white mr-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Relatórios e análises detalhadas</h3>
                  <p className="text-blue-100">
                    Acompanhe seu saldo e suas transações com relatórios completos.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-blue-200">
              © Vale Cashback {new Date().getFullYear()} - Todos os direitos reservados
            </div>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <Card className="w-full max-w-md shadow-lg border-0">
            {/* Logo Vale Cashback - Aparece apenas na versão mobile */}
            <div className="md:hidden flex justify-center items-center mt-4 mb-2">
              <img 
                src="/LOGO-VALE-CASHBACK.SEM-FUNDO.png" 
                alt="Vale Cashback Logo" 
                className="h-24 w-auto"
              />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-center text-gray-800">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-center text-gray-500 text-base">
                  {description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>{children}</CardContent>
            {footer && (
              <CardFooter className="border-t border-gray-100 pt-4 text-center flex flex-col">
                {footer}
              </CardFooter>
            )}
            

          </Card>
        </div>
      </div>
    </div>
  );
}
