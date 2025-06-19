import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Verifica se o dispositivo é móvel com base no user agent
 * @returns true se for dispositivo móvel, false caso contrário
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );
}

/**
 * Formata um valor para moeda dólar americano (USD)
 * @param value Valor a ser formatado
 * @param showSymbol Se true, exibe o símbolo $ antes do valor (padrão: true)
 * @returns String formatada em dólar americano
 */
export function formatCurrency(value: number | string | null | undefined, showSymbol = true): string {
  if (value === null || value === undefined) {
    return showSymbol ? '$0.00' : '0.00';
  }
  
  let numValue: number;
  
  if (typeof value === 'string') {
    // Remover possíveis caracteres de moeda e espaços da string antes de converter
    const cleanValue = value.replace(/[$,\s]/g, '');
    numValue = parseFloat(cleanValue);
  } else {
    numValue = value;
  }
  
  if (isNaN(numValue)) {
    return showSymbol ? '$0.00' : '0.00';
  }
  
  // Formatação para dólar americano com 2 casas decimais
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numValue);
  
  return showSymbol ? formattedValue : formattedValue.replace('$', '').trim();
}

/**
 * Formata uma data como string legível usando o padrão brasileiro
 * @param date Data a ser formatada
 * @param showTime Se true, inclui o horário junto com a data
 * @returns String formatada com a data (e hora, se showTime=true) no formato brasileiro
 */
export function formatDate(date: Date | string | null | undefined, showTime: boolean = true): string {
  if (!date) return 'Data não informada';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }
    
    // Opções de formatação para a data no formato brasileiro
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Sao_Paulo', // Fuso horário de São Paulo (BRT/BRST)
      ...(showTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Formato 24h usado no Brasil
      })
    };
    
    return dateObj.toLocaleDateString('pt-BR', options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Data inválida';
  }
}

/**
 * Formata data de transação de forma segura
 * @param dateString String da data vinda do servidor
 * @param format Formato de saída: 'short' (dd/MM) ou 'full' (dd/MM/yyyy às HH:mm)
 * @returns String formatada ou mensagem de erro
 */
export function formatTransactionDate(dateString: string | null | undefined, format: 'short' | 'full' = 'short'): string {
  if (!dateString) return 'Data não informada';
  
  try {
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    if (format === 'short') {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      }).replace(',', ' às');
    }
  } catch (error) {
    console.error("Error formatting transaction date:", error);
    return 'Data inválida';
  }
}
