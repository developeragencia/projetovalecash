import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
  fileUrl: string;
  fileName: string;
  className?: string;
  buttonText?: string;
}

/**
 * Componente para forçar o download de um arquivo mesmo em dispositivos móveis
 * que geralmente apenas abrem o arquivo no navegador
 */
export function DownloadButton({ 
  fileUrl, 
  fileName, 
  className = "w-full gap-2 bg-blue-600 hover:bg-blue-700", 
  buttonText = "Baixar Aplicativo" 
}: DownloadButtonProps) {
  // Função para forçar o download através do fetch API
  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    console.log(`Iniciando download de ${fileName} a partir de ${fileUrl}`);
    
    // Usar o Fetch API para ter mais controle sobre o processo de download
    fetch(fileUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro de rede: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Criar um URL temporário com o blob (dados do arquivo)
        const url = window.URL.createObjectURL(blob);
        
        // Criar um link invisível
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        
        // Adicionar à página, simular clique e remover
        document.body.appendChild(a);
        a.click();
        
        // Limpar recursos
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`Download de ${fileName} concluído com sucesso`);
      })
      .catch(error => {
        console.error('Erro durante o download:', error);
        // Fallback: tentar abrir o link diretamente
        window.open(fileUrl, '_blank');
      });
  };

  return (
    <a 
      href={fileUrl} 
      download={fileName}
      onClick={handleDownload}
      className="w-full" 
    >
      <Button className={className}>
        <Download size={16} />
        {buttonText}
      </Button>
    </a>
  );
}