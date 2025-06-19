import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/hooks/use-translation";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Check, Palette, Image, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function BrandSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const logoFormRef = useRef<HTMLFormElement>(null);
  const faviconFormRef = useRef<HTMLFormElement>(null);
  const backgroundFormRef = useRef<HTMLFormElement>(null);
  
  // Buscar as configurações atuais
  const { data: brandSettings, isLoading } = useQuery({
    queryKey: ["/api/brand-settings"],
    queryFn: async () => {
      const res = await fetch("/api/brand-settings");
      if (!res.ok) throw new Error("Erro ao carregar configurações");
      return res.json();
    },
  });

  // Mutation para atualizar as configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/admin/brand-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-settings"] });
      toast({
        title: "Configurações atualizadas",
        description: "As configurações de marca foram atualizadas com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message || "Ocorreu um erro ao atualizar as configurações",
        variant: "destructive",
      });
    },
  });

  // Mutation para fazer upload do logo
  const uploadLogoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/brand-settings/upload-logo", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao fazer upload do logo");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-settings"] });
      toast({
        title: "Logo atualizado",
        description: "O logo foi atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao fazer upload do logo",
        description: error.message || "Ocorreu um erro ao fazer upload do logo",
        variant: "destructive",
      });
    },
  });

  // Mutation para fazer upload do favicon
  const uploadFaviconMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/brand-settings/upload-favicon", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao fazer upload do favicon");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-settings"] });
      toast({
        title: "Favicon atualizado",
        description: "O favicon foi atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao fazer upload do favicon",
        description: error.message || "Ocorreu um erro ao fazer upload do favicon",
        variant: "destructive",
      });
    },
  });

  // Mutation para fazer upload da imagem de fundo
  const uploadBackgroundMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/brand-settings/upload-login-background", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao fazer upload da imagem de fundo");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-settings"] });
      toast({
        title: "Imagem de fundo atualizada",
        description: "A imagem de fundo foi atualizada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao fazer upload da imagem de fundo",
        description: error.message || "Ocorreu um erro ao fazer upload da imagem de fundo",
        variant: "destructive",
      });
    },
  });

  // Mutation para aplicar alterações aos arquivos reais
  const applyChangesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/brand-settings/apply-changes", {
        method: "POST",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao aplicar alterações");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Alterações aplicadas",
        description: "As alterações foram aplicadas com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aplicar alterações",
        description: error.message || "Ocorreu um erro ao aplicar alterações",
        variant: "destructive",
      });
    },
  });

  // Função para verificar se o formulário de configurações foi modificado
  const handleSettingsFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formObject = Object.fromEntries(formData.entries());
    
    // Converter o valor do auto_apply para boolean
    const auto_apply = formObject.auto_apply === "on";
    
    // Adicionar o ID para atualização
    const updateData = {
      ...formObject,
      auto_apply,
      id: brandSettings?.id,
    };
    
    updateSettingsMutation.mutate(updateData, {
      onSuccess: () => {
        // Se auto_apply estiver ativado, aplicar as alterações automaticamente
        if (auto_apply) {
          applyChangesMutation.mutate();
        }
      }
    });
  };

  // Função para lidar com o upload do logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    
    reader.readAsDataURL(file);
  };

  // Função para lidar com o upload do favicon
  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      setFaviconPreview(reader.result as string);
    };
    
    reader.readAsDataURL(file);
  };

  // Função para lidar com o upload da imagem de fundo
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      setBackgroundPreview(reader.result as string);
    };
    
    reader.readAsDataURL(file);
  };

  // Função para enviar o formulário de logo
  const submitLogoForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Verificar se há um arquivo para upload
    if (!logoInputRef.current?.files?.length) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione um arquivo para fazer upload",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("logo", logoInputRef.current.files[0]);
    
    uploadLogoMutation.mutate(formData, {
      onSuccess: () => {
        // Se auto_apply estiver ativado, aplicar as alterações automaticamente
        if (brandSettings?.auto_apply) {
          applyChangesMutation.mutate();
        }
      }
    });
  };

  // Função para enviar o formulário de favicon
  const submitFaviconForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Verificar se há um arquivo para upload
    if (!faviconInputRef.current?.files?.length) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione um arquivo para fazer upload",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("favicon", faviconInputRef.current.files[0]);
    
    uploadFaviconMutation.mutate(formData, {
      onSuccess: () => {
        // Se auto_apply estiver ativado, aplicar as alterações automaticamente
        if (brandSettings?.auto_apply) {
          applyChangesMutation.mutate();
        }
      }
    });
  };

  // Função para enviar o formulário de imagem de fundo
  const submitBackgroundForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Verificar se há um arquivo para upload
    if (!backgroundInputRef.current?.files?.length) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione um arquivo para fazer upload",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("background", backgroundInputRef.current.files[0]);
    
    uploadBackgroundMutation.mutate(formData, {
      onSuccess: () => {
        // Se auto_apply estiver ativado, aplicar as alterações automaticamente
        if (brandSettings?.auto_apply) {
          applyChangesMutation.mutate();
        }
      }
    });
  };

  // Lidar com aplicação das alterações
  const handleApplyChanges = () => {
    applyChangesMutation.mutate();
  };

  // Redefinir previews ao mudar de aba
  const handleTabChange = (value: string) => {
    if (value !== "images") {
      setLogoPreview(null);
      setFaviconPreview(null);
      setBackgroundPreview(null);
      
      if (logoFormRef.current) logoFormRef.current.querySelector('form')?.reset();
      if (faviconFormRef.current) faviconFormRef.current.querySelector('form')?.reset();
      if (backgroundFormRef.current) backgroundFormRef.current.querySelector('form')?.reset();
    }
  };

  return (
    <DashboardLayout title="Configurações de Marca" type="admin">
      <Helmet>
        <title>Configurações de Marca | Vale Cashback</title>
      </Helmet>

      <div className="container py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Configurações de Marca</h1>
          <p className="text-muted-foreground mt-2">
            Personalize a aparência da aplicação e os elementos de marca
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            <Tabs defaultValue="general" onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="images">Imagens</TabsTrigger>
                <TabsTrigger value="colors">Cores</TabsTrigger>
              </TabsList>
              
              {/* Configurações gerais */}
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações Gerais</CardTitle>
                    <CardDescription>
                      Configure as informações básicas da aplicação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form id="general-form" onSubmit={handleSettingsFormSubmit}>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="app_name">Nome da Aplicação</Label>
                          <Input
                            id="app_name"
                            name="app_name"
                            defaultValue={brandSettings?.app_name}
                            placeholder="Vale Cashback"
                            required
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="app_description">Descrição da Aplicação</Label>
                          <Textarea
                            id="app_description"
                            name="app_description"
                            defaultValue={brandSettings?.app_description}
                            placeholder="Aplicativo de cashback e fidelidade"
                            rows={3}
                          />
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="grid gap-2 mt-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="auto_apply">Aplicar alterações automaticamente</Label>
                            <Switch
                              id="auto_apply"
                              name="auto_apply"
                              defaultChecked={brandSettings?.auto_apply || false}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Se ativado, as alterações serão aplicadas automaticamente 
                            após o salvamento. Caso contrário, você precisará aplicá-las 
                            manualmente.
                          </p>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("general-form")?.reset()}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      form="general-form"
                      disabled={updateSettingsMutation.isPending}
                    >
                      {updateSettingsMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvar Configurações
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Imagens (logo, favicon, etc.) */}
              <TabsContent value="images">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Logo */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Logo</CardTitle>
                      <CardDescription>
                        Upload do logo principal da aplicação
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form 
                        id="logo-form" 
                        ref={logoFormRef}
                        onSubmit={submitLogoForm} 
                        className="grid gap-4"
                      >
                        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg">
                          {logoPreview ? (
                            <div className="relative w-40 h-40">
                              <img 
                                src={logoPreview} 
                                alt="Logo Preview" 
                                className="w-full h-full object-contain"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2"
                                onClick={() => {
                                  setLogoPreview(null);
                                  if (logoFormRef.current) logoFormRef.current.reset();
                                }}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : brandSettings?.logo_url ? (
                            <div className="relative w-40 h-40">
                              <img 
                                src={brandSettings.logo_url} 
                                alt="Current Logo" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Image className="h-12 w-12 mb-2" />
                              <p className="text-sm text-center">
                                Arraste e solte ou clique para fazer upload
                              </p>
                            </div>
                          )}
                          
                          <input
                            type="file"
                            id="logo"
                            name="logo"
                            ref={logoInputRef}
                            onChange={handleLogoUpload}
                            accept="image/png,image/jpeg,image/svg+xml"
                            className="hidden"
                          />
                          
                          {!logoPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-4"
                              onClick={() => logoInputRef.current?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Selecionar Arquivo
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Formatos permitidos: PNG, JPG, SVG</p>
                          <p>Tamanho máximo: 5MB</p>
                          <p>Dimensões recomendadas: 512x512 pixels</p>
                        </div>
                      </form>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        form="logo-form"
                        className="w-full"
                        disabled={!logoPreview || uploadLogoMutation.isPending}
                      >
                        {uploadLogoMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Enviar Logo
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Favicon */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Favicon</CardTitle>
                      <CardDescription>
                        Upload do ícone exibido nas abas do navegador
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form 
                        id="favicon-form" 
                        ref={faviconFormRef}
                        onSubmit={submitFaviconForm} 
                        className="grid gap-4"
                      >
                        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg">
                          {faviconPreview ? (
                            <div className="relative w-20 h-20">
                              <img 
                                src={faviconPreview} 
                                alt="Favicon Preview" 
                                className="w-full h-full object-contain"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2"
                                onClick={() => {
                                  setFaviconPreview(null);
                                  if (faviconFormRef.current) faviconFormRef.current.reset();
                                }}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : brandSettings?.favicon_url ? (
                            <div className="relative w-20 h-20">
                              <img 
                                src={brandSettings.favicon_url} 
                                alt="Current Favicon" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Image className="h-8 w-8 mb-2" />
                              <p className="text-sm text-center">
                                Arraste e solte ou clique para fazer upload
                              </p>
                            </div>
                          )}
                          
                          <input
                            type="file"
                            id="favicon"
                            name="favicon"
                            ref={faviconInputRef}
                            onChange={handleFaviconUpload}
                            accept="image/png,image/svg+xml,image/x-icon"
                            className="hidden"
                          />
                          
                          {!faviconPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-4"
                              onClick={() => faviconInputRef.current?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Selecionar Arquivo
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Formatos permitidos: PNG, ICO, SVG</p>
                          <p>Tamanho máximo: 1MB</p>
                          <p>Dimensões recomendadas: 64x64 pixels</p>
                        </div>
                      </form>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        form="favicon-form"
                        className="w-full"
                        disabled={!faviconPreview || uploadFaviconMutation.isPending}
                      >
                        {uploadFaviconMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Enviar Favicon
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Imagem de fundo */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Imagem de Fundo do Login</CardTitle>
                      <CardDescription>
                        Upload da imagem de fundo exibida na tela de login
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form 
                        id="background-form" 
                        ref={backgroundFormRef}
                        onSubmit={submitBackgroundForm} 
                        className="grid gap-4"
                      >
                        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg">
                          {backgroundPreview ? (
                            <div className="relative w-full h-40">
                              <img 
                                src={backgroundPreview} 
                                alt="Background Preview" 
                                className="w-full h-full object-cover rounded-md"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  setBackgroundPreview(null);
                                  if (backgroundFormRef.current) backgroundFormRef.current.reset();
                                }}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : brandSettings?.login_background_url ? (
                            <div className="relative w-full h-40">
                              <img 
                                src={brandSettings.login_background_url} 
                                alt="Current Background" 
                                className="w-full h-full object-cover rounded-md"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Image className="h-12 w-12 mb-2" />
                              <p className="text-sm text-center">
                                Arraste e solte ou clique para fazer upload
                              </p>
                            </div>
                          )}
                          
                          <input
                            type="file"
                            id="background"
                            name="background"
                            ref={backgroundInputRef}
                            onChange={handleBackgroundUpload}
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                          />
                          
                          {!backgroundPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-4"
                              onClick={() => backgroundInputRef.current?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Selecionar Arquivo
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Formatos permitidos: PNG, JPG, WEBP</p>
                          <p>Tamanho máximo: 5MB</p>
                          <p>Dimensões recomendadas: 1920x1080 pixels</p>
                        </div>
                      </form>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        form="background-form"
                        className="w-full"
                        disabled={!backgroundPreview || uploadBackgroundMutation.isPending}
                      >
                        {uploadBackgroundMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Enviar Imagem de Fundo
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Botão para aplicar alterações */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Aplicar Alterações</CardTitle>
                      <CardDescription>
                        Aplique as alterações para que sejam exibidas na aplicação
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Após fazer upload das imagens, é necessário aplicar as alterações para que os 
                        arquivos sejam atualizados em toda a aplicação. Isso vai atualizar o favicon, 
                        o logo e outros elementos visuais em todas as páginas.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={handleApplyChanges}
                        disabled={applyChangesMutation.isPending}
                      >
                        {applyChangesMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Aplicar Alterações
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Cores */}
              <TabsContent value="colors">
                <Card>
                  <CardHeader>
                    <CardTitle>Cores da Aplicação</CardTitle>
                    <CardDescription>
                      Configure as cores principais da aplicação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form id="colors-form" onSubmit={handleSettingsFormSubmit}>
                      <div className="grid gap-6">
                        <div className="grid gap-4">
                          <Label htmlFor="primary_color">Cor Primária</Label>
                          <div className="flex space-x-2">
                            <div 
                              className="w-10 h-10 rounded-md border" 
                              style={{ backgroundColor: brandSettings?.primary_color || "#0066B3" }}
                            />
                            <Input
                              id="primary_color"
                              name="primary_color"
                              type="color"
                              defaultValue={brandSettings?.primary_color || "#0066B3"}
                              className="w-16"
                            />
                            <Input
                              type="text"
                              value={brandSettings?.primary_color || "#0066B3"}
                              readOnly
                              className="flex-1"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Cor principal usada em botões, cabeçalhos e elementos de destaque
                          </p>
                        </div>
                        
                        <div className="grid gap-4">
                          <Label htmlFor="secondary_color">Cor de Destaque</Label>
                          <div className="flex space-x-2">
                            <div 
                              className="w-10 h-10 rounded-md border" 
                              style={{ backgroundColor: brandSettings?.secondary_color || "#FF7700" }}
                            />
                            <Input
                              id="secondary_color"
                              name="secondary_color"
                              type="color"
                              defaultValue={brandSettings?.secondary_color || "#FF7700"}
                              className="w-16"
                            />
                            <Input
                              type="text"
                              value={brandSettings?.secondary_color || "#FF7700"}
                              readOnly
                              className="flex-1"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Cor secundária usada em botões de ação e elementos de destaque
                          </p>
                        </div>
                        
                        <div className="grid gap-4">
                          <Label>Visualização</Label>
                          <div className="grid gap-4 p-4 border rounded-lg">
                            <div 
                              className="h-16 rounded-md flex items-center justify-center text-white font-medium"
                              style={{ backgroundColor: brandSettings?.primary_color || "#0066B3" }}
                            >
                              Cor Primária
                            </div>
                            <div 
                              className="h-16 rounded-md flex items-center justify-center text-white font-medium"
                              style={{ backgroundColor: brandSettings?.secondary_color || "#FF7700" }}
                            >
                              Cor de Destaque
                            </div>
                            <div className="flex gap-4">
                              <Button
                                type="button"
                                style={{ backgroundColor: brandSettings?.primary_color || "#0066B3" }}
                                className="flex-1"
                              >
                                Botão Primário
                              </Button>
                              <Button
                                type="button"
                                style={{ backgroundColor: brandSettings?.secondary_color || "#FF7700" }}
                                className="flex-1"
                              >
                                Botão de Destaque
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("colors-form")?.reset()}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      form="colors-form"
                      disabled={updateSettingsMutation.isPending}
                    >
                      {updateSettingsMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvar Configurações
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}