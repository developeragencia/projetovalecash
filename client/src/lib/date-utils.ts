/**
 * Utilitários robustos para formatação de datas
 * Evita erros "Invalid Date" em todo o sistema
 */

/**
 * Verifica se uma data é válida
 */
export function isValidDate(date: any): boolean {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Formatação segura de data para exibição no sistema
 */
export function formatSafeDate(dateInput: any, format: 'short' | 'full' | 'datetime' = 'short'): string {
  if (!dateInput) return 'Data não informada';
  
  try {
    const date = new Date(dateInput);
    
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo'
    };
    
    switch (format) {
      case 'short':
        options.day = '2-digit';
        options.month = '2-digit';
        options.year = 'numeric';
        break;
      case 'datetime':
        options.day = '2-digit';
        options.month = '2-digit';
        options.year = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = false;
        break;
      case 'full':
        options.weekday = 'long';
        options.day = '2-digit';
        options.month = 'long';
        options.year = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = false;
        break;
    }
    
    return date.toLocaleDateString('pt-BR', options);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

/**
 * Formatação de data para API (ISO string)
 */
export function formatDateForAPI(dateInput: any): string | null {
  if (!dateInput) return null;
  
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch (error) {
    console.error('Erro ao formatar data para API:', error);
    return null;
  }
}

/**
 * Calcula diferença entre datas em dias
 */
export function daysDifference(date1: any, date2: any): number {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    console.error('Erro ao calcular diferença de datas:', error);
    return 0;
  }
}

/**
 * Formatação específica para transações
 */
export function formatTransactionDateTime(dateInput: any): string {
  return formatSafeDate(dateInput, 'datetime');
}

/**
 * Formatação específica para relatórios administrativos
 */
export function formatReportDate(dateInput: any): string {
  return formatSafeDate(dateInput, 'short');
}