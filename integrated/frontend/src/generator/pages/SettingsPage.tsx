import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, KeyRound, Thermometer, Hash, Save, Check, FileText, Lock, RotateCcw } from "lucide-react";
import { OrnateDivider } from "../components/CelestialDecorations";
import { P } from "../theme/prismColors";
import { getSettings, saveSettings, AVAILABLE_MODELS, type AppSettings } from "../services/volcEngineApi";
import { generatorPath } from "../utils/generatorNav";
import { getDefaultSystemPrompt } from "../services/reportPrompt";
import {
  fetchReportPrompts,
  saveReportPrompts,
  verifyReportPromptPassword,
  type ReportPromptType,
} from "../services/reportPromptApi";

const PROMPT_TABS: { key: ReportPromptType; label: string }[] = [
  { key: "full", label: "完整版" },
  { key: "simple", label: "简版" },
  { key: "marriage", label: "婚姻版" },
  { key: "career", label: "事业版" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("settings_auth") === "1";
  });
  const [passwordDigits, setPasswordDigits] = useState(["", "", "", "", "", ""]);
  const [passwordError, setPasswordError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [promptTab, setPromptTab] = useState<ReportPromptType>("full");
  const [promptDrafts, setPromptDrafts] = useState<Record<ReportPromptType, string>>({
    full: getDefaultSystemPrompt("full"),
    simple: getDefaultSystemPrompt("simple"),
    marriage: getDefaultSystemPrompt("marriage"),
    career: getDefaultSystemPrompt("career"),
  });
  const [promptSource, setPromptSource] = useState<Partial<Record<ReportPromptType, "db" | "default">>>({});
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  const loadPrompts = async () => {
    setLoadingPrompts(true);
    try {
      const data = await fetchReportPrompts(true);
      const nextDrafts = { ...promptDrafts };
      const nextSource: Partial<Record<ReportPromptType, "db" | "default">> = {};
      for (const tab of PROMPT_TABS) {
        const fromDb = data.prompts[tab.key]?.trim();
        if (fromDb) {
          nextDrafts[tab.key] = fromDb;
          nextSource[tab.key] = "db";
        } else {
          nextDrafts[tab.key] = getDefaultSystemPrompt(tab.key);
          nextSource[tab.key] = "default";
        }
      }
      setPromptDrafts(nextDrafts);
      setPromptSource(nextSource);
    } finally {
      setLoadingPrompts(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return;
    }
    void loadPrompts();
  }, [isAuthenticated]);

  const verifyAndLogin = async (entered: string) => {
    setVerifying(true);
    setPasswordError(false);
    try {
      await verifyReportPromptPassword(entered);
      sessionStorage.setItem("settings_auth", "1");
      sessionStorage.setItem("settings_password", entered);
      setIsAuthenticated(true);
    } catch {
      setPasswordError(true);
      setTimeout(() => {
        setPasswordDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }, 500);
    } finally {
      setVerifying(false);
    }
  };

  const handlePasswordChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value) || verifying) return;
    setPasswordError(false);
    const newDigits = [...passwordDigits];
    newDigits[index] = value;
    setPasswordDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const filledDigits = newDigits.map((d, i) => (i === index ? value : d));
    if (filledDigits.every(d => d !== "")) {
      void verifyAndLogin(filledDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !passwordDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPrompt = (type: ReportPromptType) => {
    setPromptDrafts(prev => ({
      ...prev,
      [type]: getDefaultSystemPrompt(type),
    }));
    setPromptSource(prev => ({ ...prev, [type]: "default" }));
  };

  const handleSave = async () => {
    setSaveError(null);
    const password = sessionStorage.getItem("settings_password") || "";
    if (!password) {
      setSaveError("会话已过期，请重新输入密码");
      sessionStorage.removeItem("settings_auth");
      setIsAuthenticated(false);
      return;
    }

    saveSettings(settings);

    const prompts: Partial<Record<ReportPromptType, string>> = {};
    for (const tab of PROMPT_TABS) {
      const draft = promptDrafts[tab.key].trim();
      const defaultText = getDefaultSystemPrompt(tab.key === "simple" ? "simple" : "full").trim();
      if (draft && draft !== defaultText) {
        prompts[tab.key] = draft;
      } else {
        prompts[tab.key] = "";
      }
    }

    try {
      await saveReportPrompts(password, prompts);
      await loadPrompts();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e));
    }
  };

  const activePrompt = promptDrafts[promptTab];
  const activeSource = promptSource[promptTab];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "transparent" }}>
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ background: P.headerBg, borderColor: P.cardBorder }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(generatorPath())}
            className="flex items-center gap-1.5 text-sm transition-colors p-2 -ml-2"
            style={{ color: 'var(--color-text-muted)' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-medium gold-text tracking-[0.15em] uppercase">设置</h1>
        </div>
      </header>

      {!isAuthenticated ? (
        <main className="relative z-10 max-w-lg mx-auto px-4 pt-12 pb-12">
          <div className="glass-card rounded-2xl p-8 sm:p-10 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(196,162,101,0.08)', border: '1px solid rgba(196,162,101,0.2)' }}>
              <Lock className="w-7 h-7" style={{ color: 'var(--color-gold)' }} />
            </div>
            <h2 className="text-lg font-light tracking-wider mb-2" style={{ color: 'var(--color-text)' }}>请输入访问密码</h2>
            <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>此页面受密码保护</p>

            <div className="flex justify-center gap-2.5 mb-4">
              {passwordDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={verifying}
                  onChange={e => handlePasswordChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-medium rounded-xl border-2 transition-all outline-none ${passwordError ? 'animate-pulse' : ''}`}
                  style={{
                    borderColor: passwordError ? 'rgba(220,80,80,0.5)' : digit ? 'rgba(196,162,101,0.5)' : 'var(--color-border)',
                    background: passwordError ? 'rgba(220,80,80,0.05)' : 'rgba(27,42,74,0.5)',
                    color: passwordError ? 'var(--color-rose)' : 'var(--color-text)',
                    caretColor: 'var(--color-gold)',
                  }}
                />
              ))}
            </div>

            {passwordError && (
              <p className="text-xs mb-3" style={{ color: 'var(--color-rose)' }}>密码错误，请重新输入</p>
            )}
            {verifying && (
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>验证中…</p>
            )}
            <p className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>输入6位数字密码自动验证</p>
          </div>
        </main>
      ) : (
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-12 space-y-4 sm:space-y-5">
        {/* API Key */}
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <label className="flex items-center gap-2 text-[11px] sm:text-xs tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--color-text-muted)' }}>
            <KeyRound className="w-3.5 h-3.5" style={{ color: 'var(--color-gold)' }} /> 火山方舟 API Key
          </label>
          <input type="password" value={settings.apiKey}
            onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
            placeholder="ark-xxxxxxxxxxxxxxxx"
            className="w-full crystal-input rounded-xl px-4 py-3 text-sm" />
          <p className="text-[10px] sm:text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
            从{" "}
            <a href="https://console.volcengine.com/ark/" target="_blank" rel="noopener noreferrer"
              className="hover:underline" style={{ color: 'var(--color-gold)' }}>火山方舟控制台</a>{" "}
            获取 API Key。用于生成"人生剧本"章节的个性化文案。
          </p>
        </div>

        <OrnateDivider />

        {/* Model */}
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <label className="flex items-center gap-2 text-[11px] sm:text-xs tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--color-text-muted)' }}>
            <Hash className="w-3.5 h-3.5" style={{ color: 'var(--color-gold)' }} /> AI 模型
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_MODELS.map(m => (
              <button key={m.value} onClick={() => setSettings({ ...settings, model: m.value })}
                className="py-2.5 rounded-xl text-sm transition-all border"
                style={settings.model === m.value
                  ? { borderColor: 'rgba(196,162,101,0.5)', color: 'var(--color-gold)', background: 'rgba(196,162,101,0.06)' }
                  : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={settings.model}
              onChange={e => setSettings({ ...settings, model: e.target.value })}
              className="flex-1 rounded-xl px-3 py-2 text-xs border"
              style={{ borderColor: 'var(--color-border)', background: 'rgba(27,42,74,0.5)', color: 'var(--color-text)' }}
              placeholder="或手动输入模型ID如 ep-20250115xxxx-yyyyy"
            />
          </div>
        </div>

        <OrnateDivider />

        {/* Temperature */}
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-[11px] sm:text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--color-text-muted)' }}>
              <Thermometer className="w-3.5 h-3.5" style={{ color: 'var(--color-gold)' }} /> 创作温度
            </label>
            <span className="text-sm font-medium" style={{ color: 'var(--color-gold)' }}>{settings.temperature.toFixed(1)}</span>
          </div>
          <input type="range" min="0" max="2" step="0.1" value={settings.temperature}
            onChange={e => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
            className="w-full accent-[var(--color-gold)]" />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--color-text-dim)' }}>
            <span>严谨（可复现）</span><span>平衡</span><span>创意（随机）</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-[11px] sm:text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--color-text-muted)' }}>
              <Hash className="w-3.5 h-3.5" style={{ color: 'var(--color-gold)' }} /> 最大长度
            </label>
            <span className="text-sm font-medium" style={{ color: 'var(--color-gold)' }}>{settings.maxTokens}</span>
          </div>
          <input type="range" min="1024" max="8192" step="1024" value={settings.maxTokens}
            onChange={e => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
            className="w-full accent-[var(--color-gold)]" />
        </div>

        <OrnateDivider />

        {/* Report prompts - stored in DB */}
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <label className="flex items-center gap-2 text-[11px] sm:text-xs tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--color-text-muted)' }}>
            <FileText className="w-3.5 h-3.5" style={{ color: 'var(--color-gold)' }} /> 报告生成提示词
          </label>
          <p className="text-[10px] sm:text-[11px] mb-3 leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
            按报告类型分别配置 System Prompt，保存后写入数据库，生成报告时自动读取。
          </p>

          <div className="flex gap-2 mb-3">
            {PROMPT_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setPromptTab(tab.key)}
                className="flex-1 py-2 rounded-xl text-xs transition-all border"
                style={promptTab === tab.key
                  ? { borderColor: 'rgba(196,162,101,0.5)', color: 'var(--color-gold)', background: 'rgba(196,162,101,0.06)' }
                  : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {loadingPrompts ? (
            <p className="text-xs py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>加载提示词…</p>
          ) : (
            <>
              <textarea
                value={activePrompt}
                onChange={e => setPromptDrafts(prev => ({ ...prev, [promptTab]: e.target.value }))}
                rows={12}
                className="w-full crystal-input rounded-xl px-4 py-3 text-sm resize-none leading-relaxed font-mono"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
                    {activeSource === "db" ? "当前：数据库配置" : "当前：代码默认（未保存到数据库）"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleResetPrompt(promptTab)}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <RotateCcw className="w-3 h-3" /> 恢复默认
                  </button>
                </div>
                <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>{activePrompt.length} 字</span>
              </div>
            </>
          )}
        </div>

        <OrnateDivider />

        {saveError && (
          <p className="text-xs text-center" style={{ color: 'var(--color-rose)' }}>{saveError}</p>
        )}

        {/* Save Button */}
        <button onClick={() => void handleSave()}
          className={`w-full py-3.5 rounded-xl text-sm font-medium tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2 border ${saved ? '' : 'active:scale-[0.98]'}`}
          style={saved
            ? { borderColor: 'rgba(34,197,94,0.4)', color: '#16a34a', background: 'rgba(34,197,94,0.06)' }
            : { borderColor: 'rgba(196,162,101,0.4)', color: 'var(--color-gold)', background: 'rgba(196,162,101,0.04)' }}>
          {saved ? <><Check className="w-4 h-4" /> 已保存</> : <><Save className="w-4 h-4" /> 保存设置</>}
        </button>

        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-8 sm:w-12" style={{ background: 'linear-gradient(to right, transparent, rgba(196,162,101,0.2))' }} />
          <p className="text-center text-[10px] tracking-[0.15em]" style={{ color: 'var(--color-text-dim)' }}>
            提示词保存在服务器数据库 · API Key 保存在浏览器本地
          </p>
          <div className="h-px w-8 sm:w-12" style={{ background: 'linear-gradient(to left, transparent, rgba(196,162,101,0.2))' }} />
        </div>
      </main>
      )}
    </div>
  );
}
