import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { WelcomeScreens } from "@/components/ui/welcome-screens";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ShieldCheck, User, Store, Loader2 } from "lucide-react";

// Tipos de usuário
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

export default function WelcomeLogin() {
  // Redirecionamento para a página de login após completar as telas de boas-vindas
  const handleCompleteWelcome = () => {
    window.location.href = '/login';
  };

  // Renderizamos diretamente o componente de telas de boas-vindas com estilo adicional para garantir visibilidade
  return (
    <div className="welcome-container w-full h-screen flex items-center justify-center bg-white" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      <WelcomeScreens onComplete={handleCompleteWelcome} />
    </div>
  );
}