import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface QRCodeResponse {
  id: number;
  code: string;
  amount: number;
  expiresAt: string;
}

interface UseQRCodeProps {
  onSuccess?: (data: QRCodeResponse) => void;
  onError?: (error: Error) => void;
}

export function useQRCode({ onSuccess, onError }: UseQRCodeProps = {}) {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQRCode] = useState<QRCodeResponse | null>(null);
  const { toast } = useToast();

  const generateQRCode = useCallback(async (amount: number, description?: string) => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/client/qr-code/generate', {
        amount,
        description,
      });
      
      const data = await response.json();
      setQRCode(data);
      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Erro ao gerar QR Code',
        description: err.message,
        variant: 'destructive',
      });
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [toast, onSuccess, onError]);

  const validateQRCode = useCallback(async (code: string, payment_method = 'cashback') => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/client/pay-qrcode', {
        code,
        payment_method
      });
      
      const data = await response.json();
      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'QR Code inválido',
        description: err.message,
        variant: 'destructive',
      });
      onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, onSuccess, onError]);

  // Função para processar QR code (usada pelo scanner do lojista)
  const processQrCode = useCallback(async (qrData: string) => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/merchant/process-qrcode', {
        qrData
      });
      
      const data = await response.json();
      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Erro ao processar QR Code',
        description: err.message,
        variant: 'destructive',
      });
      onError?.(err);
      throw err; // Propagar erro para o mutation
    } finally {
      setLoading(false);
    }
  }, [toast, onSuccess, onError]);

  return {
    loading,
    qrCode,
    generateQRCode,
    validateQRCode,
    processQrCode
  };
}
