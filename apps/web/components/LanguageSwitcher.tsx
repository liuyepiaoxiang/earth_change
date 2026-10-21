"use client";
import { useI18n } from "../lib/i18n";
export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value as "zh" | "en")}
      aria-label="Language" title="语言 / Language"
      style={{ background: "#0f172a", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>
      <option value="zh">中文</option>
      <option value="en">EN</option>
    </select>
  );
}
