import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Tipo do componente: pode ser select (normal) ou dropdown (para móvel)
type LanguageSelectorType = 'select' | 'dropdown';

interface LanguageSelectorProps {
  type?: LanguageSelectorType;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function LanguageSelector({ 
  type = 'select',
  variant = 'outline',
  size = 'default'
}: LanguageSelectorProps) {
  const { language, setLanguage, t, languages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Força atualização do componente quando o idioma mudar
  useEffect(() => {
    const handleLanguageChange = () => {
      // Força uma nova renderização
      setIsOpen(open => open);
    };
    
    window.addEventListener('language-changed', handleLanguageChange);
    return () => {
      window.removeEventListener('language-changed', handleLanguageChange);
    };
  }, []);

  // Mapeamento de códigos de idioma para emojis de bandeiras
  const flagEmojis: Record<string, string> = {
    pt: '🇧🇷',
    en: '🇺🇸',
    es: '🇪🇸'
  };

  // Versão Select
  if (type === 'select') {
    return (
      <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
        <SelectTrigger className="w-[180px] bg-white text-black border-2 border-primary font-bold shadow-md">
          <span className="flex items-center">
            <span className="text-xl mr-2">{flagEmojis[language]}</span>
            <span className="font-medium">{languages.find(lang => lang.code === language)?.name || t('common.language')}</span>
          </span>
        </SelectTrigger>
        <SelectContent className="bg-white border-2 border-primary">
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className={language === lang.code ? "bg-primary/10 font-bold" : ""}>
              <span className="flex items-center">
                <span className="text-xl mr-2">{flagEmojis[lang.code]}</span>
                <span className="font-medium">{lang.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Versão Dropdown (para móvel)
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} className="bg-white text-black border-2 border-primary shadow-md">
          <span className="flex items-center">
            <span className="text-xl mr-2">{flagEmojis[language]}</span>
            <span className="inline font-medium">{languages.find(lang => lang.code === language)?.name}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white text-black border-2 border-primary shadow-lg">
        <DropdownMenuLabel className="font-bold text-primary">{t('common.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code}
            onClick={() => {
              setLanguage(lang.code);
              setIsOpen(false);
            }}
            className={language === lang.code ? "bg-primary/10 font-bold" : ""}
          >
            <span className="text-xl mr-2">{flagEmojis[lang.code]}</span>
            <span className="font-medium">{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}