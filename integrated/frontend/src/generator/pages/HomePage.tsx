import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Settings, ChevronDown } from "lucide-react";
import PrismBackground from "@/components/prism/PrismBackground";
import PrismBrandSymbol from "@/components/prism/PrismBrandSymbol";
import PrismAnalysisAnimation from "@/components/prism/PrismAnalysisAnimation";
import type { BirthData } from "../services/astrologyEngine";
import { setGlobalReportType } from "../services/reportSession";
import { fetchPartnerOrder, setPrepaidOrderId } from "../services/partnerApi";
import { generatorPath } from "../utils/generatorNav";
import BirthDatePicker from "../components/BirthDatePicker";
import "@/styles/prism.css";

interface Props {
  onGenerate: (data: BirthData) => void;
  isLoading: boolean;
  charCount?: number;
}

interface CountryOption { code: string; nameZh: string; nameEn: string; }
interface ProvinceOption { id: number; nameZh: string; nameEn: string; }
interface CityOption { id: number; nameZh: string; nameEn: string; latitude: number; longitude: number; timezone: number; }

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "";

export default function HomePage({ onGenerate, isLoading, charCount = 0 }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [prepaidBanner, setPrepaidBanner] = useState<string | null>(null);
  const [prepaidError, setPrepaidError] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");
  const [customTz, setCustomTz] = useState("8");
  const [useCustomCoords, setUseCustomCoords] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(true);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const countryRef = useRef<HTMLDivElement>(null);
  const provinceRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/world/countries`)
      .then((r) => r.json())
      .then((res) => { setCountries(res?.data ?? res ?? []); setLoadingCountries(false); })
      .catch(() => setLoadingCountries(false));
  }, []);

  const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
    country: countryRef,
    province: provinceRef,
    city: cityRef,
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      setOpenDropdown((current) => {
        if (!current) return current;
        const ref = refMap[current];
        if (ref?.current && !ref.current.contains(e.target as Node)) {
          return null;
        }
        return current;
      });
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setSelectedProvince("");
    setProvinces([]);
    setSelectedCity(null);
    setCities([]);
    if (!selectedCountry) return;
    fetch(`${API_BASE}/api/world/provinces?countryCode=${encodeURIComponent(selectedCountry)}`)
      .then((r) => r.json())
      .then((res) => setProvinces(res?.data ?? res ?? []));
  }, [selectedCountry]);

  useEffect(() => {
    setSelectedCity(null);
    setCities([]);
    if (!selectedProvince) return;
    const province = provinces.find((p) => p.nameZh === selectedProvince || String(p.id) === selectedProvince);
    if (!province) return;
    fetch(`${API_BASE}/api/world/cities?provinceId=${province.id}`)
      .then((r) => r.json())
      .then((res) => setCities(res?.data ?? res ?? []));
  }, [selectedProvince, provinces]);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId) return;
    setPrepaidOrderId(orderId);
    fetchPartnerOrder(orderId)
      .then((order) => {
        if (order.prepaid && order.reportPending) {
          setPrepaidBanner(`您已完成支付（订单 ${order.orderId}），请填写出生信息生成报告`);
        } else if (order.prepaid) {
          setPrepaidBanner(`订单 ${order.orderId} 已支付，请继续填写信息`);
        }
      })
      .catch((err) => {
        setPrepaidError(err instanceof Error ? err.message : "订单验证失败");
      });
  }, [searchParams]);

  const handleSubmit = useCallback(() => {
    const errors: Record<string, boolean> = {};
    if (!birthDate) errors.birthDate = true;
    if (!useCustomCoords && !selectedCity) errors.city = true;
    if (useCustomCoords && (!customLat || !customLng)) errors.coords = true;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    let lat: number, lng: number, tz: number;
    if (useCustomCoords) {
      lat = parseFloat(customLat) || 39.9;
      lng = parseFloat(customLng) || 116.4;
      tz = parseFloat(customTz) || 8;
    } else if (selectedCity) {
      lat = selectedCity.latitude;
      lng = selectedCity.longitude;
      tz = selectedCity.timezone;
    } else {
      lat = 39.9; lng = 116.4; tz = 8;
    }
    const [year, month, day] = birthDate.split("-").map(Number);
    const [hour, minute] = birthTime.split(":").map(Number);
    setGlobalReportType("full");
    const countryName = countries.find((c) => c.code === selectedCountry)?.nameZh || "";
    const provinceName = selectedProvince || "";
    const cityName = selectedCity?.nameZh || "";
    const locationStr = [countryName, provinceName, cityName].filter(Boolean).join(" · ");
    try { sessionStorage.setItem("birth_location", locationStr); } catch {}
    onGenerate({ year, month, day, hour, minute, latitude: lat, longitude: lng, timezone: tz, gender, name: name || undefined });
  }, [birthDate, birthTime, selectedCountry, selectedProvince, selectedCity, countries, gender, name, onGenerate, useCustomCoords, customLat, customLng, customTz]);

  if (isLoading) {
    return (
      <div className="prism-root min-h-screen relative overflow-hidden">
        <PrismBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <PrismAnalysisAnimation charCount={charCount} />
        </div>
      </div>
    );
  }

  return (
    <div className="prism-root min-h-screen relative overflow-x-hidden overflow-y-auto">
      <PrismBackground />

      <div className="fixed top-0 right-0 z-50 p-4">
        <button
          onClick={() => navigate(generatorPath("settings"))}
          className="p-2.5 rounded-full transition-all"
          style={{ border: "1px solid rgba(232,185,81,0.2)", background: "rgba(13,27,42,0.6)", color: "var(--prism-gold)" }}
          title="设置"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[480px] mx-auto px-5 py-10 min-h-screen flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 prism-fade-in">
            <PrismBrandSymbol size={48} />
          </div>
          <div className="prism-font-display text-sm font-semibold tracking-[8px] uppercase mb-1" style={{ color: "var(--prism-gold)" }}>
            PRISM
          </div>
          <div className="prism-font-serif text-[11px] tracking-[4px] mb-6" style={{ color: "rgba(232,185,81,0.45)" }}>
            人 生 剧 本
          </div>
          <h1 className="prism-font-serif text-[22px] font-bold leading-relaxed mb-2" style={{ color: "var(--prism-cream)" }}>
            你的答案已揭示了<span style={{ color: "var(--prism-gold)" }}>灵魂的轮廓</span>
          </h1>
          <p className="text-[13px] leading-loose" style={{ color: "rgba(250,246,240,0.4)" }}>
            现在，请交出你降临人间的时刻<br />让星盘印证一切
          </p>
        </div>

        {(prepaidBanner || prepaidError) && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm text-center"
            style={{
              background: prepaidError ? "rgba(217,79,79,0.1)" : "rgba(232,185,81,0.08)",
              border: prepaidError ? "1px solid rgba(217,79,79,0.3)" : "1px solid rgba(232,185,81,0.2)",
              color: prepaidError ? "#f87171" : "var(--prism-cream)",
            }}
          >
            {prepaidError || prepaidBanner}
          </div>
        )}

        {/* Birth form */}
        <div className="prism-birth-form">
          {/* Name (optional) */}
          <div className="mb-5 text-left">
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <span className="prism-font-serif text-[13px] font-semibold tracking-wide" style={{ color: "rgba(250,246,240,0.7)" }}>
                你的名字
              </span>
              <span className="text-[11px] italic" style={{ color: "rgba(232,185,81,0.35)" }}>可选</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入你的名字…"
              className="prism-input"
            />
          </div>

          {/* Gender */}
          <div className="mb-5 text-left">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="prism-font-serif text-[13px] font-semibold tracking-wide" style={{ color: "rgba(250,246,240,0.7)" }}>
                你是
              </span>
              <span className="text-[11px] italic" style={{ color: "rgba(232,185,81,0.35)" }}>决定解读视角</span>
            </div>
            <div className="flex gap-3">
              {(["female", "male"] as const).map((g) => (
                <div key={g} className="prism-gender-opt flex-1 relative">
                  <input type="radio" name="gender" id={`g-${g}`} value={g} checked={gender === g} onChange={() => setGender(g)} />
                  <label htmlFor={`g-${g}`}>{g === "female" ? "♀ 女" : "♂ 男"}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1 text-left">
              <div className="mb-2">
                <span className="prism-font-serif text-[13px] font-semibold" style={{ color: "rgba(250,246,240,0.7)" }}>
                  你降临人间的日期 <span style={{ color: "var(--prism-gold)" }}>*</span>
                </span>
              </div>
              <BirthDatePicker
                value={birthDate}
                onChange={(v) => { setBirthDate(v); setFieldErrors((p) => ({ ...p, birthDate: false })); }}
                className="prism-input"
                error={fieldErrors.birthDate}
                placeholder="年 / 月 / 日"
              />
            </div>
            <div className="flex-1 text-left">
              <div className="mb-2">
                <span className="prism-font-serif text-[13px] font-semibold" style={{ color: "rgba(250,246,240,0.7)" }}>
                  降临时刻 <span style={{ color: "var(--prism-gold)" }}>*</span>
                </span>
              </div>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="prism-input"
              />
              <p className="text-[10px] mt-1 italic" style={{ color: "rgba(232,185,81,0.35)" }}>精确到分钟，决定上升星座</p>
            </div>
          </div>

          {/* Place */}
          <div className="mb-2 text-left">
            <div className="flex items-baseline gap-2 mb-3 flex-wrap">
              <span className="prism-font-serif text-[13px] font-semibold" style={{ color: "rgba(250,246,240,0.7)" }}>
                降临之地 <span style={{ color: "var(--prism-gold)" }}>*</span>
              </span>
              <span className="text-[11px] italic" style={{ color: "rgba(232,185,81,0.35)" }}>经纬度决定你的宫位</span>
            </div>

            {!useCustomCoords ? (
              <div className="space-y-2.5">
                <div className="relative" ref={countryRef}>
                  <button type="button" onClick={() => setOpenDropdown(openDropdown === "country" ? null : "country")}
                    className={`prism-input w-full text-left flex items-center justify-between ${fieldErrors.city ? "error" : ""}`}>
                    <span style={{ color: selectedCountry ? "var(--prism-cream)" : "rgba(250,246,240,0.25)" }}>
                      {selectedCountry ? countries.find((c) => c.code === selectedCountry)?.nameZh || selectedCountry : "1. 选择国家"}
                    </span>
                    <ChevronDown size={14} style={{ color: "rgba(232,185,81,0.25)" }} />
                  </button>
                  {openDropdown === "country" && (
                    <div className="prism-city-dropdown mt-1 max-h-[32vh] overflow-y-auto">
                      {loadingCountries ? (
                        <div className="px-4 py-3 text-sm text-center" style={{ color: "rgba(250,246,240,0.3)" }}>加载中…</div>
                      ) : countries.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-center" style={{ color: "rgba(250,246,240,0.3)" }}>暂无数据</div>
                      ) : (
                        countries.map((c) => (
                          <div key={c.code} className="prism-city-opt" onClick={() => { setSelectedCountry(c.code); setOpenDropdown(null); setFieldErrors((p) => ({ ...p, city: false })); }}>
                            {c.nameZh}
                            <span className="text-[11px] ml-2" style={{ color: "rgba(250,246,240,0.25)" }}>{c.nameEn}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="relative" ref={provinceRef}>
                  <button type="button" onClick={() => { if (provinces.length > 0) setOpenDropdown(openDropdown === "province" ? null : "province"); }}
                    className="prism-input w-full text-left flex items-center justify-between">
                    <span style={{ color: selectedProvince ? "var(--prism-cream)" : "rgba(250,246,240,0.25)" }}>
                      {selectedProvince || "2. 选择省份/州"}
                    </span>
                    <ChevronDown size={14} style={{ color: "rgba(232,185,81,0.25)" }} />
                  </button>
                  {openDropdown === "province" && (
                    <div className="prism-city-dropdown mt-1 max-h-[32vh] overflow-y-auto">
                      {provinces.map((p) => (
                        <div key={p.id} className="prism-city-opt" onClick={() => { setSelectedProvince(p.nameZh); setOpenDropdown(null); }}>
                          {p.nameZh}
                          <span className="text-[11px] ml-2" style={{ color: "rgba(250,246,240,0.25)" }}>{p.nameEn}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={cityRef}>
                  <button type="button" onClick={() => { if (cities.length > 0) setOpenDropdown(openDropdown === "city" ? null : "city"); }}
                    className={`prism-input w-full text-left flex items-center justify-between ${fieldErrors.city ? "error" : ""}`}>
                    <span style={{ color: selectedCity ? "var(--prism-cream)" : "rgba(250,246,240,0.25)" }}>
                      {selectedCity ? `${selectedCity.nameZh}` : "3. 选择城市"}
                    </span>
                    <ChevronDown size={14} style={{ color: "rgba(232,185,81,0.25)" }} />
                  </button>
                  {openDropdown === "city" && (
                    <div className="prism-city-dropdown mt-1 max-h-[32vh] overflow-y-auto">
                      {cities.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-center" style={{ color: "rgba(250,246,240,0.3)" }}>请先选择国家与省份</div>
                      ) : (
                        cities.map((c) => (
                          <div key={c.id} className="prism-city-opt" onClick={() => { setSelectedCity(c); setOpenDropdown(null); setFieldErrors((p) => ({ ...p, city: false })); }}>
                            {c.nameZh}
                            <span className="text-[11px] ml-2" style={{ color: "rgba(250,246,240,0.25)" }}>{c.nameEn}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input type="number" step="0.01" value={customLat} onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="纬度" className={`prism-input ${fieldErrors.coords ? "error" : ""}`} />
                  <input type="number" step="0.01" value={customLng} onChange={(e) => setCustomLng(e.target.value)}
                    placeholder="经度" className={`prism-input ${fieldErrors.coords ? "error" : ""}`} />
                </div>
                <input type="number" step="0.5" value={customTz} onChange={(e) => setCustomTz(e.target.value)}
                  placeholder="时区" className="prism-input" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setUseCustomCoords(!useCustomCoords)}
              className="text-[11px] mt-3 hover:underline"
              style={{ color: "var(--prism-gold)" }}
            >
              {useCustomCoords ? "使用城市列表" : "手动输入经纬度"}
            </button>
          </div>

          <button
            type="button"
            className="prism-btn-gold w-full mt-7"
            onClick={handleSubmit}
          >
            连 接 星 盘
          </button>
        </div>

        <p className="text-center text-[10px] tracking-[3px] mt-6" style={{ color: "rgba(250,246,240,0.2)" }}>
          瑞士星历 · 高精度天文计算
        </p>
      </div>
    </div>
  );
}
