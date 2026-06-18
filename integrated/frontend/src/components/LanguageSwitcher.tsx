import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { languages } from "@/i18n";

type LanguageSwitcherProps = {
  className?: string;
  buttonClassName?: string;
  /** compact: icon + flag only; default: same as header */
  variant?: "default" | "compact";
};

export default function LanguageSwitcher({
  className = "",
  buttonClassName = "",
  variant = "default",
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t("language")}
        aria-expanded={open}
        className={
          buttonClassName ||
          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#2D2A26] transition-colors hover:bg-[#E8C547]/10"
        }
      >
        <Globe size={16} />
        {variant === "compact" ? (
          <span className="text-xs font-semibold">{currentLang.flag}</span>
        ) : (
          <span>{currentLang.flag}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[210]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-[220] mt-2 w-52 overflow-hidden rounded-xl border border-[#E8E4DC] bg-white py-1 shadow-lg">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#FFFDF5] ${
                  i18n.language === lang.code
                    ? "bg-[#E8C547]/10 font-medium text-[#2D2A26]"
                    : "text-[#6B6560]"
                }`}
              >
                <span className="text-xs">{lang.flag}</span>
                <span>{lang.native}</span>
                {i18n.language === lang.code && (
                  <span className="ml-auto text-[#E8C547]">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
