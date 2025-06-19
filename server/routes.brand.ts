import { Request as ExpressRequest, Response, Express, NextFunction } from 'express';
import { db } from './db';
import { brandSettings, BrandSetting, InsertBrandSetting } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { fileUploadMiddleware, handleFileUpload, UPLOAD_DIRS, cleanupTempFiles } from './helpers/file-upload';
import { FileArray } from 'express-fileupload';

// Define o tipo Request para incluir a propriedade files
interface Request extends ExpressRequest {
  files?: FileArray;
}
import { isUserType } from './routes';
import fs from 'fs-extra';
import path from 'path';

// Função reutilizável para aplicar as alterações de marca
async function applyBrandChanges(currentSettings: BrandSetting) {
  const publicDir = path.join(process.cwd(), 'client/public');
  
  // Aplicar favicon se existir
  if (currentSettings.favicon_url) {
    const faviconSource = path.join(publicDir, currentSettings.favicon_url);
    if (await fs.pathExists(faviconSource)) {
      const extension = path.extname(faviconSource);
      await fs.copy(faviconSource, path.join(publicDir, `favicon${extension}`));
      
      // Se for SVG, atualizar favicon.svg
      if (extension === '.svg') {
        await fs.copy(faviconSource, path.join(publicDir, 'favicon.svg'));
      }
      
      // Se for PNG, atualizar favicon.png
      if (extension === '.png') {
        await fs.copy(faviconSource, path.join(publicDir, 'favicon.png'));
      }
      
      // Se for ICO, atualizar favicon.ico
      if (extension === '.ico') {
        await fs.copy(faviconSource, path.join(publicDir, 'favicon.ico'));
      }
    }
  }
  
  // Aplicar logo se existir
  if (currentSettings.logo_url) {
    const logoSource = path.join(publicDir, currentSettings.logo_url);
    if (await fs.pathExists(logoSource)) {
      const extension = path.extname(logoSource);
      
      // Se for SVG, atualizar valecashback-logo.svg
      if (extension === '.svg') {
        await fs.copy(logoSource, path.join(publicDir, 'valecashback-logo.svg'));
      }
      
      // Também atualizar o ícone do PWA se necessário
      // Isso requer uma ferramenta de conversão de imagem para gerar os diferentes tamanhos
      // Por simplicidade, apenas copiamos para os arquivos que já existem
      const iconSizes = [48, 72, 96, 144, 192, 384, 512];
      
      if (extension === '.png') {
        for (const size of iconSizes) {
          const iconPath = path.join(publicDir, 'icons', `icon-${size}x${size}.png`);
          if (await fs.pathExists(iconPath)) {
            // Em uma implementação real, redimensionaríamos o logo
            // Aqui apenas copiamos
            await fs.copy(logoSource, iconPath);
          }
        }
        
        // Atualizar também os ícones da raiz
        await fs.copy(logoSource, path.join(publicDir, 'icon-192x192.svg'));
        await fs.copy(logoSource, path.join(publicDir, 'icon-512.png'));
      }
    }
  }
  
  console.log('Alterações de marca aplicadas automaticamente');
  return true;
}

// Rota para configurações de marca/personalização do aplicativo
export function addBrandRoutes(app: Express) {
  // Middleware para processar uploads de arquivos
  app.use(fileUploadMiddleware);
  app.use(cleanupTempFiles);

  // Rota para obter todas as configurações de marca
  app.get('/api/brand-settings', async (req: Request, res: Response) => {
    try {
      const settings = await db.select().from(brandSettings);
      
      if (settings.length === 0) {
        // Se não houver configurações, criar um registro default
        const defaultSettings: InsertBrandSetting = {
          app_name: 'Vale Cashback',
          primary_color: '#0066B3',
          secondary_color: '#FF7700',
          app_description: 'Aplicativo de cashback e gerenciamento de fidelidade',
          auto_apply: false,
        };
        
        const [newSettings] = await db.insert(brandSettings)
          .values(defaultSettings)
          .returning();
          
        return res.status(200).json(newSettings);
      }
      
      return res.status(200).json(settings[0]);
    } catch (error) {
      console.error('Erro ao buscar configurações de marca:', error);
      return res.status(500).json({ 
        message: 'Erro ao buscar configurações de marca',
        error: (error as Error).message 
      });
    }
  });

  // Rota para atualizar as configurações de marca (apenas administradores)
  app.patch('/api/admin/brand-settings', 
    isUserType('admin'),
    async (req: Request, res: Response) => {
      try {
        const { id, ...updateData } = req.body;
        
        if (!id) {
          return res.status(400).json({ message: 'ID das configurações não fornecido' });
        }
        
        // Converter auto_apply para boolean se estiver presente
        if (updateData.auto_apply !== undefined) {
          updateData.auto_apply = updateData.auto_apply === true || updateData.auto_apply === 'true';
        }
        
        // Armazenar se auto_apply está ativado para aplicar mudanças automaticamente
        const shouldApplyChanges = updateData.auto_apply === true;
        
        // Atualiza os dados no banco
        const [updatedSettings] = await db.update(brandSettings)
          .set({
            ...updateData,
            updated_at: new Date(),
            updated_by: req.user?.id
          })
          .where(eq(brandSettings.id, id))
          .returning();
          
        if (!updatedSettings) {
          return res.status(404).json({ message: 'Configurações não encontradas' });
        }
        
        // Se auto_apply estiver ativado, aplicar as alterações automaticamente
        if (shouldApplyChanges) {
          await applyBrandChanges(updatedSettings);
        }
        
        return res.status(200).json(updatedSettings);
      } catch (error) {
        console.error('Erro ao atualizar configurações de marca:', error);
        return res.status(500).json({ 
          message: 'Erro ao atualizar configurações de marca',
          error: (error as Error).message 
        });
      }
    }
  );

  // Rota para upload de logo (apenas administradores)
  app.post('/api/admin/brand-settings/upload-logo', 
    isUserType('admin'),
    async (req: Request, res: Response) => {
      try {
        // Obter as configurações atuais
        const settings = await db.select().from(brandSettings);
        
        if (settings.length === 0) {
          return res.status(404).json({ message: 'Configurações não encontradas' });
        }
        
        const currentSettings = settings[0];
        
        // Processar o upload
        const result = await handleFileUpload(req, res, {
          directory: UPLOAD_DIRS.brand,
          field: 'logo',
          allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml']
        });
        
        if (!result.success) {
          return res.status(400).json({ message: result.error });
        }
        
        // Se houver um logo anterior, remover
        if (currentSettings.logo_url) {
          const oldPath = path.join(process.cwd(), 'client/public', currentSettings.logo_url);
          if (await fs.pathExists(oldPath)) {
            await fs.remove(oldPath);
          }
        }
        
        // Atualizar o caminho do logo no banco de dados
        const [updatedSettings] = await db.update(brandSettings)
          .set({
            logo_url: result.filePath,
            updated_at: new Date(),
            updated_by: req.user?.id
          })
          .where(eq(brandSettings.id, currentSettings.id))
          .returning();
        
        // Se auto_apply estiver ativado, aplicar as alterações automaticamente
        if (updatedSettings.auto_apply) {
          await applyBrandChanges(updatedSettings);
        }
          
        return res.status(200).json({
          message: 'Logo atualizado com sucesso',
          settings: updatedSettings
        });
      } catch (error) {
        console.error('Erro ao atualizar logo:', error);
        return res.status(500).json({ 
          message: 'Erro ao atualizar logo',
          error: (error as Error).message 
        });
      }
    }
  );
  
  // Rota para upload de favicon (apenas administradores)
  app.post('/api/admin/brand-settings/upload-favicon', 
    isUserType('admin'),
    async (req: Request, res: Response) => {
      try {
        // Obter as configurações atuais
        const settings = await db.select().from(brandSettings);
        
        if (settings.length === 0) {
          return res.status(404).json({ message: 'Configurações não encontradas' });
        }
        
        const currentSettings = settings[0];
        
        // Processar o upload
        const result = await handleFileUpload(req, res, {
          directory: UPLOAD_DIRS.brand,
          field: 'favicon',
          allowedTypes: ['image/png', 'image/x-icon', 'image/svg+xml']
        });
        
        if (!result.success) {
          return res.status(400).json({ message: result.error });
        }
        
        // Se houver um favicon anterior, remover
        if (currentSettings.favicon_url) {
          const oldPath = path.join(process.cwd(), 'client/public', currentSettings.favicon_url);
          if (await fs.pathExists(oldPath)) {
            await fs.remove(oldPath);
          }
        }
        
        // Atualizar o caminho do favicon no banco de dados
        const [updatedSettings] = await db.update(brandSettings)
          .set({
            favicon_url: result.filePath,
            updated_at: new Date(),
            updated_by: req.user?.id
          })
          .where(eq(brandSettings.id, currentSettings.id))
          .returning();
        
        // Se auto_apply estiver ativado, aplicar as alterações automaticamente
        if (updatedSettings.auto_apply) {
          await applyBrandChanges(updatedSettings);
        }
          
        return res.status(200).json({
          message: 'Favicon atualizado com sucesso',
          settings: updatedSettings
        });
      } catch (error) {
        console.error('Erro ao atualizar favicon:', error);
        return res.status(500).json({ 
          message: 'Erro ao atualizar favicon',
          error: (error as Error).message 
        });
      }
    }
  );
  
  // Rota para upload de imagem de fundo do login (apenas administradores)
  app.post('/api/admin/brand-settings/upload-login-background', 
    isUserType('admin'),
    async (req: Request, res: Response) => {
      try {
        // Obter as configurações atuais
        const settings = await db.select().from(brandSettings);
        
        if (settings.length === 0) {
          return res.status(404).json({ message: 'Configurações não encontradas' });
        }
        
        const currentSettings = settings[0];
        
        // Processar o upload
        const result = await handleFileUpload(req, res, {
          directory: UPLOAD_DIRS.brand,
          field: 'background',
          allowedTypes: ['image/png', 'image/jpeg', 'image/webp']
        });
        
        if (!result.success) {
          return res.status(400).json({ message: result.error });
        }
        
        // Se houver uma imagem de fundo anterior, remover
        if (currentSettings.login_background_url) {
          const oldPath = path.join(process.cwd(), 'client/public', currentSettings.login_background_url);
          if (await fs.pathExists(oldPath)) {
            await fs.remove(oldPath);
          }
        }
        
        // Atualizar o caminho da imagem de fundo no banco de dados
        const [updatedSettings] = await db.update(brandSettings)
          .set({
            login_background_url: result.filePath,
            updated_at: new Date(),
            updated_by: req.user?.id
          })
          .where(eq(brandSettings.id, currentSettings.id))
          .returning();
        
        // Se auto_apply estiver ativado, aplicar as alterações automaticamente
        if (updatedSettings.auto_apply) {
          await applyBrandChanges(updatedSettings);
        }
          
        return res.status(200).json({
          message: 'Imagem de fundo atualizada com sucesso',
          settings: updatedSettings
        });
      } catch (error) {
        console.error('Erro ao atualizar imagem de fundo:', error);
        return res.status(500).json({ 
          message: 'Erro ao atualizar imagem de fundo',
          error: (error as Error).message 
        });
      }
    }
  );
  
  // Rota para aplicar as alterações aos arquivos reais
  app.post('/api/admin/brand-settings/apply-changes', 
    isUserType('admin'),
    async (req: Request, res: Response) => {
      try {
        // Obter as configurações atuais
        const settings = await db.select().from(brandSettings);
        
        if (settings.length === 0) {
          return res.status(404).json({ message: 'Configurações não encontradas' });
        }
        
        const currentSettings = settings[0];
        const publicDir = path.join(process.cwd(), 'client/public');
        
        // Aplicar favicon se existir
        if (currentSettings.favicon_url) {
          const faviconSource = path.join(publicDir, currentSettings.favicon_url);
          if (await fs.pathExists(faviconSource)) {
            const extension = path.extname(faviconSource);
            await fs.copy(faviconSource, path.join(publicDir, `favicon${extension}`));
            
            // Se for SVG, atualizar favicon.svg
            if (extension === '.svg') {
              await fs.copy(faviconSource, path.join(publicDir, 'favicon.svg'));
            }
            
            // Se for PNG, atualizar favicon.png
            if (extension === '.png') {
              await fs.copy(faviconSource, path.join(publicDir, 'favicon.png'));
            }
            
            // Se for ICO, atualizar favicon.ico
            if (extension === '.ico') {
              await fs.copy(faviconSource, path.join(publicDir, 'favicon.ico'));
            }
          }
        }
        
        // Aplicar logo se existir
        if (currentSettings.logo_url) {
          const logoSource = path.join(publicDir, currentSettings.logo_url);
          if (await fs.pathExists(logoSource)) {
            const extension = path.extname(logoSource);
            
            // Se for SVG, atualizar valecashback-logo.svg
            if (extension === '.svg') {
              await fs.copy(logoSource, path.join(publicDir, 'valecashback-logo.svg'));
            }
            
            // Também atualizar o ícone do PWA se necessário
            // Isso requer uma ferramenta de conversão de imagem para gerar os diferentes tamanhos
            // Por simplicidade, apenas copiamos para os arquivos que já existem
            const iconSizes = [48, 72, 96, 144, 192, 384, 512];
            
            if (extension === '.png') {
              for (const size of iconSizes) {
                const iconPath = path.join(publicDir, 'icons', `icon-${size}x${size}.png`);
                if (await fs.pathExists(iconPath)) {
                  // Em uma implementação real, redimensionaríamos o logo
                  // Aqui apenas copiamos
                  await fs.copy(logoSource, iconPath);
                }
              }
              
              // Atualizar também os ícones da raiz
              await fs.copy(logoSource, path.join(publicDir, 'icon-192x192.svg'));
              await fs.copy(logoSource, path.join(publicDir, 'icon-512.png'));
            }
          }
        }
        
        return res.status(200).json({
          message: 'Alterações aplicadas com sucesso',
          settings: currentSettings
        });
      } catch (error) {
        console.error('Erro ao aplicar alterações:', error);
        return res.status(500).json({ 
          message: 'Erro ao aplicar alterações',
          error: (error as Error).message 
        });
      }
    }
  );
}