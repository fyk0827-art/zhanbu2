import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Menu, X, Shield } from "lucide-react";
import { languages } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const navItemClass =
  "inline-flex h-10 items-center text-[15px] font-medium text-[#2D2A26] transition-colors hover:text-[#E8C547]";

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#E8E4DC] bg-[#FFFDF5]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <Link to="/" className="font-['Fredoka'] text-xl font-semibold text-[#2D2A26] transition-colors hover:text-[#E8C547]">
          {t("appName")}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className={navItemClass}>
            {t("home")}
          </Link>
          <button
            type="button"
            onClick={() => document.getElementById("age-groups")?.scrollIntoView({ behavior: "smooth" })}
            className={navItemClass}
          >
            {t("browse")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className={`${navItemClass} gap-1.5 text-[#6B6560]`}
          >
            <Shield size={16} />
            {t("adminLink")}
          </button>

          <LanguageSwitcher buttonClassName={`${navItemClass} gap-1.5 px-3 hover:bg-[#E8C547]/10`} />
        </nav>

        {/* Mobile Menu */}
        <button className="text-[#2D2A26] md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#E8E4DC] bg-[#FFFDF5] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-[#2D2A26]">
              {t("home")}
            </Link>
            <button
              onClick={() => {
                document.getElementById("age-groups")?.scrollIntoView({ behavior: "smooth" });
                setMobileOpen(false);
              }}
              className="text-left text-lg font-medium text-[#2D2A26]"
            >
              {t("browse")}
            </button>
            <button
              onClick={() => { navigate("/admin"); setMobileOpen(false); }}
              className="flex items-center gap-2 text-lg font-medium text-[#6B6560]"
            >
              <Shield size={18} />
              {t("adminLink")}
            </button>
            <div className="border-t border-[#E8E4DC] pt-4">
              <p className="mb-2 text-sm font-medium text-[#6B6560]">{t("language")}</p>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setMobileOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      i18n.language === lang.code
                        ? "bg-[#E8C547]/15 font-medium text-[#2D2A26]"
                        : "text-[#6B6560] hover:bg-[#E8C547]/5"
                    }`}
                  >
                    {lang.native}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
