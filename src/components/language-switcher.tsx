'use client';
import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/use-i18n"

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant={locale === 'ru' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLocale('ru')}
      >
        Русский
      </Button>
      <Button
        variant={locale === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLocale('en')}
      >
        English
      </Button>
      <Button
        variant={locale === 'de' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLocale('de')}
      >
        Deutsch
      </Button>
    </div>
  )
}
