import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Share2, AlertCircle } from "lucide-react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  title?: string;
  description?: string;
  amount?: number;
  expiresAt?: Date;
  downloadable?: boolean;
  shareable?: boolean;
  loading?: boolean;
}

export function QRCodeDisplay({
  value,
  size = 200,
  title,
  description,
  amount,
  expiresAt,
  downloadable = true,
  shareable = true,
  loading = false,
}: QRCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [qrError, setQrError] = useState<boolean>(false);
  
  // Validar se o valor do QR Code é válido
  useEffect(() => {
    if (!value || value.trim() === '') {
      setQrError(true);
    } else {
      setQrError(false);
    }
  }, [value]);
  
  // Calculate time left if expiresAt is provided
  useEffect(() => {
    if (!expiresAt) return;
    
    const calculateTimeLeft = () => {
      try {
        const now = new Date();
        const difference = expiresAt.getTime() - now.getTime();
        
        if (difference <= 0) {
          setTimeLeft("Expirado");
          return;
        }
        
        const minutes = Math.floor(difference / 1000 / 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } catch (error) {
        console.error("Erro ao calcular tempo restante:", error);
        setTimeLeft("--:--");
      }
    };
    
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  // Handle download QR Code as PNG
  const handleDownload = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Handle share QR Code
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, 'image/png');
        });
        
        const file = new File([blob], 'qrcode.png', { type: 'image/png' });
        
        await navigator.share({
          title: title || 'QR Code Vale Cashback',
          text: description,
          files: [file],
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Compartilhamento não é suportado pelo seu navegador');
    }
  };

  return (
    <Card className="overflow-hidden">
      {title && (
        <CardHeader>
          <CardTitle className="text-center">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="flex flex-col items-center justify-center p-6">
        {loading ? (
          <Skeleton className="rounded-md" style={{ width: size, height: size }} />
        ) : qrError ? (
          <div 
            className="flex flex-col items-center justify-center bg-muted rounded-md" 
            style={{ width: size, height: size }}
          >
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              QR Code não disponível
            </p>
          </div>
        ) : (
          <>
            <QRCodeCanvas
              id="qr-code-canvas"
              value={value || "https://valecashback.com"}
              size={size}
              level="H"
              includeMargin={true}
              fgColor="#004B8D"
              className="rounded-md"
            />
            
            {amount && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Valor:</p>
                <p className="text-2xl font-bold">R$ {amount.toFixed(2)}</p>
              </div>
            )}
            
            {description && (
              <p className="mt-2 text-sm text-center text-muted-foreground">{description}</p>
            )}
            
            {expiresAt && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Válido por:</p>
                <p className="text-lg font-medium">{timeLeft}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      {(downloadable || shareable) && !loading && !qrError && (
        <CardFooter className="flex justify-center gap-2 pb-6">
          {downloadable && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              disabled={!value || value.trim() === ''}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </Button>
          )}
          {shareable && typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              disabled={!value || value.trim() === ''}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
