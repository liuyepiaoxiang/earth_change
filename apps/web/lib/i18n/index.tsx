/** 轻量 i18n——Context + hook + 字典切换 */
"use client";
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { zh, type TranslationKey } from "./zh";
import { en } from "./en";

export type Locale = "zh" | "en";
const DICTS: Record<Locale, Record<TranslationKey, string>> = { zh, en };

interface I18nContextType {
  locale: Locale;
  t: (key: TranslationKey) => string;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextType>({
  locale: "zh", t: (k) => zh[k], setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  useEffect(() => {
    const saved = localStorage.getItem("fe-locale") as Locale | null;
    const url = new URL(window.location.href);
    const urlLang = url.searchParams.get("lang");
    if (urlLang === "en" || urlLang === "zh") setLocaleState(urlLang);
    else if (saved === "en" || saved === "zh") setLocaleState(saved);
  }, []);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("fe-locale", l);
    document.documentElement.lang = l === "en" ? "en" : "zh-CN";
  }, []);
  const t = useCallback((key: TranslationKey) => DICTS[locale][key] ?? zh[key] ?? key, [locale]);
  return <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n() { return useContext(I18nContext); }
export { zh, en, type TranslationKey };
