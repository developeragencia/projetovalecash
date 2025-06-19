import { Request as ExpressRequest, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs-extra';
import fileUpload, { UploadedFile, FileArray } from 'express-fileupload';

// Estender a interface Request para incluir a propriedade files
export interface Request extends ExpressRequest {
  files?: FileArray;
}
import { v4 as uuidv4 } from 'uuid';

// Configuração para o fileUpload
export const fileUploadMiddleware = fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  preserveExtension: true,
});

// Tipo de arquivos permitidos
const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'image/x-icon': 'ico',
};

// Diretórios de upload configuráveis
export const UPLOAD_DIRS = {
  brand: path.join(process.cwd(), 'client/public/uploads/brand'),
  users: path.join(process.cwd(), 'client/public/uploads/users'),
};

// Interface para configuração do upload
interface UploadOptions {
  directory: string;
  field: string;
  allowedTypes?: string[];
  maxFileSize?: number;
}

// Função para validar e processar o upload
export async function handleFileUpload(
  req: Request, 
  res: Response, 
  options: UploadOptions
): Promise<{ success: boolean; filePath?: string; fileName?: string; error?: string }> {
  try {
    // Verificar se há arquivos no request
    if (!req.files || Object.keys(req.files).length === 0 || !req.files[options.field]) {
      return { success: false, error: 'Nenhum arquivo foi enviado.' };
    }

    // Obter o arquivo enviado
    const file = req.files[options.field];
    const uploadedFile = Array.isArray(file) ? file[0] : file;
    
    // Verificar o tipo MIME do arquivo
    const mimeType = uploadedFile.mimetype;
    const allowedTypes = options.allowedTypes || Object.keys(ALLOWED_MIME_TYPES);
    
    if (!allowedTypes.includes(mimeType)) {
      return { 
        success: false, 
        error: `Tipo de arquivo não permitido. Tipos permitidos: ${allowedTypes.join(', ')}` 
      };
    }
    
    // Gerar nome de arquivo único
    const fileExt = ALLOWED_MIME_TYPES[mimeType as keyof typeof ALLOWED_MIME_TYPES] || 'bin';
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Diretório de destino
    const uploadDir = options.directory;
    await fs.ensureDir(uploadDir);
    
    const filePath = path.join(uploadDir, fileName);
    const relativePath = `/uploads/${options.directory.split('/').pop()}/${fileName}`;
    
    // Mover o arquivo para o diretório de destino
    await uploadedFile.mv(filePath);
    
    return { 
      success: true, 
      filePath: relativePath,
      fileName: fileName
    };
  } catch (error) {
    console.error('Erro no upload de arquivo:', error);
    return { 
      success: false, 
      error: `Erro ao processar o upload: ${(error as Error).message}` 
    };
  }
}

// Middleware para limpar arquivos temporários após o processamento
export function cleanupTempFiles(req: Request, res: Response, next: NextFunction) {
  res.on('finish', async () => {
    if (req.files) {
      const files = req.files;
      
      // Limpar todos os arquivos temporários
      for (const key in files) {
        const file = files[key];
        if (Array.isArray(file)) {
          for (const f of file) {
            if (f.tempFilePath && await fs.pathExists(f.tempFilePath)) {
              await fs.remove(f.tempFilePath).catch(console.error);
            }
          }
        } else if (file.tempFilePath && await fs.pathExists(file.tempFilePath)) {
          await fs.remove(file.tempFilePath).catch(console.error);
        }
      }
    }
  });
  
  next();
}