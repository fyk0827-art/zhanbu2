import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { Shield, Loader2 } from "lucide-react";
import { authApi } from "@/services/api";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem("adminToken", data.token);
      window.location.href = "/admin/dashboard";
    },
    onError: (err: Error) => {
      setError(err.message || t("invalidCredentials"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) return;
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FFFDF5] px-4">
      <div className="absolute right-4 top-4 md:right-6 md:top-6">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-[#E8E4DC] bg-white p-10 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8C547]/15">
            <Shield size={28} className="text-[#E8C547]" />
          </div>
          <h1 className="font-['Fredoka'] text-2xl text-[#2D2A26]">{t("adminLogin")}</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[#E07A5F]/10 px-4 py-3 text-sm text-[#E07A5F]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2D2A26]">{t("username")}</label>
            <input
              type="text"
              name="admin-login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              className="w-full rounded-lg border border-[#E8E4DC] bg-white px-4 py-3 text-sm text-[#2D2A26] outline-none transition-colors focus:border-[#E8C547]"
              placeholder={t("username")}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2D2A26]">{t("password")}</label>
            <input
              type="password"
              name="admin-login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-[#E8E4DC] bg-white px-4 py-3 text-sm text-[#2D2A26] outline-none transition-colors focus:border-[#E8C547]"
              placeholder={t("password")}
            />
          </div>
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-full bg-[#E8C547] px-6 py-3.5 font-['Fredoka'] font-medium text-[#2D2A26] transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {loginMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {t("login")}...
              </span>
            ) : (
              t("login")
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-[#6B6560] transition-colors hover:text-[#E8C547]"
          >
            &larr; {t("home")}
          </button>
        </div>
      </div>
    </div>
  );
}
