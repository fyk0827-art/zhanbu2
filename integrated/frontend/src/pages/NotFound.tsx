import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FFFDF5] px-4">
      <div className="absolute right-4 top-4 md:right-6 md:top-6">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="font-['Fredoka'] text-4xl font-bold text-[#2D2A26]">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#6B6560]">{t("pageNotFound", "Page not found")}</p>
          <Button asChild className="w-full">
            <Link to="/">{t("backToHome", "Back to Home")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
