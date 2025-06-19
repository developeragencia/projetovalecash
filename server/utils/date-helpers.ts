/**
 * Utilitários para formatação segura de datas no backend
 * Garante que todas as datas enviadas para o frontend sejam válidas
 */

/**
 * Formata data de forma segura para envio via API
 */
export function formatDateForResponse(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toISOString();
  } catch (error) {
    console.error('Erro ao formatar data para resposta:', error);
    return null;
  }
}

/**
 * Processa objeto removendo datas inválidas e formatando corretamente
 */
export function sanitizeDatesInObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeDatesInObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Detectar campos de data comuns
      if (key.includes('_at') || key.includes('date') || key === 'created' || key === 'updated') {
        sanitized[key] = formatDateForResponse(value as any);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeDatesInObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Valida se uma string de data é válida
 */
export function isValidDateString(dateString: any): boolean {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}