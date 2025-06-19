import pt from './pt';
import en from './en';
import es from './es';

export type LanguageCode = 'pt' | 'en' | 'es';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
}

export const languages: LanguageOption[] = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' }
];

export const translations = {
  pt,
  en,
  es
};

export type TranslationKeys = keyof typeof pt;

export default translations;