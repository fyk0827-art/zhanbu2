import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";

const ITEM_HEIGHT = 44;
const WHEEL_PADDING = ITEM_HEIGHT * 2;
const MIN_YEAR = 1920;

interface BirthDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  maxYear?: number;
  className?: string;
  error?: boolean;
  placeholder?: string;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parseValue(value: string) {
  const now = new Date();
  if (!value) {
    return { year: 1990, month: 1, day: 1 };
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return { year: 1990, month: 1, day: 1 };
  }
  const maxDay = daysInMonth(year, month);
  return { year, month, day: Math.min(day, maxDay) };
}

function formatDisplay(value: string) {
  if (!value) return "";
  const { year, month, day } = parseValue(value);
  return `${year}年${month}月${day}日`;
}

function toValue(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function WheelColumn({
  items,
  value,
  onChange,
  formatItem,
}: {
  items: number[];
  value: number;
  onChange: (value: number) => void;
  formatItem: (value: number) => string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToValue = useCallback((target: number, smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    const index = items.indexOf(target);
    if (index < 0) return;
    el.scrollTo({ top: index * ITEM_HEIGHT, behavior: smooth ? "smooth" : "auto" });
  }, [items]);

  useEffect(() => {
    scrollToValue(value);
  }, [value, items, scrollToValue]);

  const handleScroll = () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const index = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_HEIGHT)));
      const next = items[index];
      if (next !== value) onChange(next);
      scrollToValue(next, true);
    }, 80);
  };

  return (
    <div className="relative flex-1 min-w-0">
      <div
        className="pointer-events-none absolute inset-x-1 top-1/2 z-10 -translate-y-1/2 rounded-lg border-y"
        style={{ height: ITEM_HEIGHT, borderColor: "rgba(196,162,101,0.35)", background: "rgba(196,162,101,0.06)" }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16"
        style={{ background: "linear-gradient(to bottom, var(--color-surface-solid), transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16"
        style={{ background: "linear-gradient(to top, var(--color-surface-solid), transparent)" }}
      />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="wheel-column-scroll h-[220px] overflow-y-auto"
        style={{ paddingTop: WHEEL_PADDING, paddingBottom: WHEEL_PADDING }}
      >
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              onChange(item);
              scrollToValue(item, true);
            }}
            className="wheel-item flex w-full items-center justify-center text-sm transition-colors"
            style={{
              height: ITEM_HEIGHT,
              color: item === value ? "var(--color-gold)" : "var(--color-text-muted)",
              fontWeight: item === value ? 600 : 400,
            }}
          >
            {formatItem(item)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BirthDatePicker({
  value,
  onChange,
  maxYear,
  className = "crystal-input rounded-xl px-4 py-2.5 sm:py-3 text-sm",
  error = false,
  placeholder: placeholderProp,
}: BirthDatePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const upperYear = maxYear ?? new Date().getFullYear();
  const parsed = parseValue(value);
  const [draftYear, setDraftYear] = useState(parsed.year);
  const [draftMonth, setDraftMonth] = useState(parsed.month);
  const [draftDay, setDraftDay] = useState(parsed.day);
  const placeholder = placeholderProp ?? t('datePickerTitle');

  const years = useMemo(
    () => Array.from({ length: upperYear - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i),
    [upperYear]
  );
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(() => {
    const count = daysInMonth(draftYear, draftMonth);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [draftYear, draftMonth]);

  useEffect(() => {
    if (!open) return;
    const next = parseValue(value);
    setDraftYear(next.year);
    setDraftMonth(next.month);
    setDraftDay(next.day);
  }, [open, value]);

  useEffect(() => {
    const maxDay = daysInMonth(draftYear, draftMonth);
    if (draftDay > maxDay) setDraftDay(maxDay);
  }, [draftYear, draftMonth, draftDay]);

  const handleConfirm = () => {
    onChange(toValue(draftYear, draftMonth, draftDay));
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full text-left flex items-center justify-between ${className}${error ? " error" : ""}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <span style={{ color: value ? "var(--color-text, var(--prism-cream))" : "var(--color-text-dim, rgba(250,246,240,0.25))" }}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar className="w-4 h-4 shrink-0" style={{ color: "var(--prism-gold, var(--color-gold))" }} />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent
          className="mx-auto w-full max-w-lg border-t rounded-t-2xl"
          style={{ background: "var(--color-surface-solid)", borderColor: "var(--color-border)" }}
        >
          <DrawerHeader className="border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
            <DrawerTitle className="text-center text-base" style={{ color: "var(--color-text)" }}>
              你降临人间的日期
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex items-stretch px-2 py-2">
            <WheelColumn
              items={years}
              value={draftYear}
              onChange={setDraftYear}
              formatItem={(y) => t('datePickerYear', { year: y })}
            />
            <WheelColumn
              items={months}
              value={draftMonth}
              onChange={setDraftMonth}
              formatItem={(m) => t('datePickerMonth', { month: m })}
            />
            <WheelColumn
              items={days}
              value={draftDay}
              onChange={setDraftDay}
              formatItem={(d) => t('datePickerDay', { day: d })}
            />
          </div>

          <DrawerFooter className="flex-row gap-3 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
            <DrawerClose asChild>
              <button
                type="button"
                className="flex-1 rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
              >
                {t('datePickerCancel')}
              </button>
            </DrawerClose>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: "var(--color-gold)", color: "#fff" }}
            >
              {t('datePickerConfirm')}
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
