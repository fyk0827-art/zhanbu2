import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const footerNavItemClass =
  "inline-flex items-center text-sm text-white/60 transition-colors hover:text-white";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#2D2A26] px-6 py-16 text-white">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h3 className="mb-2 font-['Fredoka'] text-2xl text-[#E8C547]">{t("appName")}</h3>
            <p className="text-sm text-[#6B6560]">{t("tagline")}</p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className={footerNavItemClass}>
              {t("home")}
            </Link>
            <button
              type="button"
              onClick={() => document.getElementById("age-groups")?.scrollIntoView({ behavior: "smooth" })}
              className={footerNavItemClass}
            >
              {t("browse")}
            </button>
            <Link to="/admin" className={footerNavItemClass}>
              {t("adminLink")}
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-xs text-[#6B6560]">
            &copy; 2026 {t("appName")}. {t("footerRights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
