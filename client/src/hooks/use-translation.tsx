import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations, { LanguageCode, languages } from '@/i18n';

type Path<T> = T extends object ? {
  [K in keyof T]: `${K & string}${Path<T[K]> extends never ? '' : `.${Path<T[K]>}`}`;
}[keyof T] : never;

type TranslationPath = Path<typeof translations.pt>;

interface TranslationContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: typeof languages;
}

const defaultLanguage: LanguageCode = 'pt';

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const getNestedValue = (obj: any, path: string) => {
  if (!path || typeof path !== 'string') return undefined;
  return path.split('.').reduce((prev, curr) => {
    return prev && prev[curr] !== undefined ? prev[curr] : undefined;
  }, obj);
};

const replaceParams = (text: string, params?: Record<string, string | number>) => {
  if (!params) return text;
  
  let result = text;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  
  return result;
};

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // Tenta recuperar o idioma salvo do localStorage
    const savedLanguage = localStorage.getItem('language') as LanguageCode;
    return savedLanguage && Object.keys(translations).includes(savedLanguage) 
      ? savedLanguage 
      : defaultLanguage;
  });

  useEffect(() => {
    // Salva a preferência de idioma no localStorage
    localStorage.setItem('language', language);
    // Atualiza o atributo lang da página para acessibilidade
    document.documentElement.lang = language;
    // Força uma atualização de renderização quando o idioma muda
    window.dispatchEvent(new Event('language-changed'));
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    if (translations[lang]) {
      setLanguageState(lang);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translatedValue = getNestedValue(translations[language], key);
    
    if (translatedValue === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    if (typeof translatedValue === 'string') {
      return replaceParams(translatedValue, params);
    }
    
    return key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};