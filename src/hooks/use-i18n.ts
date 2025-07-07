'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';
import de from '@/locales/de.json';

const translations = { en, ru, de };

type Locale = keyof typeof translations;

const I18N_STORAGE_KEY = 'i18nLocale';

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('ru');

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(I18N_STORAGE_KEY) as Locale | null;
      if (savedLocale && translations[savedLocale]) {
        setLocale(savedLocale);
      }
    } catch (error) {
      console.error("Failed to load locale from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(I18N_STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    } catch (error) {
      console.error("Failed to save locale to localStorage", error);
    }
  }, [locale]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let text: string = (translations[locale] as Record<string, string>)[key] ?? key;
    if (params) {
      Object.keys(params).forEach(paramKey => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
        text = text.replace(new RegExp(`\\$\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
      });
    }
    return text;
  }, [locale]);

  return React.createElement(I18nContext.Provider, { value: { locale, setLocale, t } }, children);
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
