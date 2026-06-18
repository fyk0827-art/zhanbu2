import { useState, useEffect, useCallback } from "react";
import {
  checkUnlock,
  checkHealth,
  createOrder,
  getOrderStatus,
  confirmAlipayReturn,
  confirmWechatReturn,
  confirmPaypalReturn,
  mockCompleteOrder,
  ensurePaymentSchema,
  PAYMENT_DISABLED,
  type PaymentMode,
} from "../services/paymentApi";
import type { ReportTypeId } from "../types/reportTypes";
import {
  getRouterSearchParams,
  getAlipayReturnParams,
  stripRouterPaymentParams,
} from "../utils/routerQuery";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 30;

export function useReportUnlock(
  reportId: string | null,
  options?: { reportType?: ReportTypeId }
) {
  const [isUnlocked, setIsUnlocked] = useState(PAYMENT_DISABLED);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paidAt, setPaidAt] = useState<number | null>(null);
  const [tradeNo, setTradeNo] = useState<string | null>(null);
  const [loading, setLoading] = useState(!PAYMENT_DISABLED);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wechatHint, setWechatHint] = useState<string | null>(null);
  const [confirmingReturn, setConfirmingReturn] = useState(false);
  const [pollExhausted, setPollExhausted] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(
    PAYMENT_DISABLED ? "disabled" : null
  );

  const isWeChatInApp = typeof navigator !== "undefined" && /MicroMessenger/i.test(navigator.userAgent);

  useEffect(() => {
    if (PAYMENT_DISABLED) return;
    checkHealth()
      .then((h) => {
        const mode = h.paymentMode ?? "mock";
        setPaymentMode(mode);
        if (mode === "disabled") {
          setIsUnlocked(true);
          setLoading(false);
        }
      })
      .catch(() => setPaymentMode("mock"));
  }, []);

  const refresh = useCallback(async () => {
    if (PAYMENT_DISABLED) {
      setIsUnlocked(true);
      setLoading(false);
      return;
    }
    if (!reportId) {
      setLoading(false);
      return;
    }
    try {
      const res = await checkUnlock(reportId);
      setIsUnlocked(res.unlocked || paymentMode === "disabled");
      setOrderId(res.orderId ?? null);
      setPaidAt(res.paidAt ?? null);
      setTradeNo(res.tradeNo ?? null);
    } catch {
      if (!PAYMENT_DISABLED) setIsUnlocked(false);
    } finally {
      setLoading(false);
    }
  }, [reportId, paymentMode]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (PAYMENT_DISABLED) return;
    const params = getRouterSearchParams();
    const pendingOrderId = params.get("orderId") || params.get("out_trade_no");
    if (!pendingOrderId) return;

    let cancelled = false;
    setPollExhausted(false);

    (async () => {
      let mode: PaymentMode = "mock";
      try {
        const health = await checkHealth();
        mode = health.paymentMode ?? "mock";
        if (!cancelled) setPaymentMode(mode);
      } catch {
        mode = "mock";
      }

      const alipayReturn = getAlipayReturnParams();
      if (alipayReturn && mode === "alipay") {
        setConfirmingReturn(true);
        try {
          const confirmed = await confirmAlipayReturn(alipayReturn);
          if (!cancelled && confirmed.unlocked) {
            setIsUnlocked(true);
            setOrderId(confirmed.orderId);
            stripRouterPaymentParams();
            setConfirmingReturn(false);
            return;
          }
        } catch (e) {
          if (!cancelled) {
            setError(
              e instanceof Error
                ? e.message
                : "支付回跳确认失败，请确认后端已启动且 PAYMENT_MODE=alipay"
            );
          }
        } finally {
          if (!cancelled) setConfirmingReturn(false);
        }
      }

      if (mode === "paypal") {
        const paypalToken = params.get("token");
        if (paypalToken) {
          setConfirmingReturn(true);
          try {
            const confirmed = await confirmPaypalReturn({ token: paypalToken, orderId: pendingOrderId });
            if (!cancelled && confirmed.unlocked) {
              setIsUnlocked(true);
              setOrderId(confirmed.orderId);
              stripRouterPaymentParams();
              setConfirmingReturn(false);
              return;
            }
          } catch {
            /* 由轮询兜底 */
          } finally {
            if (!cancelled) setConfirmingReturn(false);
          }
        }
      }

      if (mode === "wechat") {
        setConfirmingReturn(true);
        try {
          const confirmed = await confirmWechatReturn({ orderId: pendingOrderId });
          if (!cancelled && confirmed.unlocked) {
            setIsUnlocked(true);
            setOrderId(confirmed.orderId);
            stripRouterPaymentParams();
            setConfirmingReturn(false);
            return;
          }
        } catch {
          /* notify 延迟时由轮询兜底 */
        } finally {
          if (!cancelled) setConfirmingReturn(false);
        }
      }

      for (let i = 0; i < POLL_MAX_ATTEMPTS && !cancelled; i++) {
        try {
          const o = await getOrderStatus(pendingOrderId);
          if (o.unlocked || o.status === "paid") {
            setIsUnlocked(true);
            setOrderId(o.orderId);
            setPaidAt(o.paidAt ?? null);
            stripRouterPaymentParams();
            return;
          }
        } catch (e) {
          if (i === 0 && !cancelled) {
            setError(
              e instanceof Error
                ? e.message
                : "无法连接支付服务，请确认后端（端口 3001）已启动"
            );
          }
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
      if (!cancelled) setPollExhausted(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const startPay = useCallback(async () => {
    if (PAYMENT_DISABLED) return;
    if (!reportId) {
      setError("无法识别报告，请返回「文字报告确认」页重新进入，或重新填写出生信息");
      return;
    }
    setPaying(true);
    setError(null);
    setWechatHint(null);
    setPollExhausted(false);
    try {
      let location = "";
      try { location = sessionStorage.getItem("birth_location") || ""; } catch {}
      let res;
      try {
        res = await createOrder(reportId, { reportType: options?.reportType, payerContact: undefined, location: location || undefined });
      } catch (firstErr) {
        const msg = firstErr instanceof Error ? firstErr.message : "";
        if (/orders|unlocks|数据库|Database|500/.test(msg)) {
          await ensurePaymentSchema();
          res = await createOrder(reportId, { reportType: options?.reportType, location: location || undefined });
        } else {
          throw firstErr;
        }
      }
      const mode = res.paymentMode ?? paymentMode ?? "mock";
      if (res.paymentMode) setPaymentMode(res.paymentMode);
      if (res.alreadyUnlocked) {
        setIsUnlocked(true);
        if (res.orderId) setOrderId(res.orderId);
        return;
      }
      const channel = res.channel ?? mode;
      if (res.wechatInApp && channel === "alipay") {
        setWechatHint(
          res.hint ?? "微信内无法直接唤起支付宝。请点击右上角「···」→「在浏览器中打开」，再点击支付。"
        );
        return;
      }
      if (!res.orderId) throw new Error("未获取订单号");

      // 模拟模式：直接完成支付，无需跳转 localhost:8880 收银台
      if (mode === "mock") {
        const paid = await mockCompleteOrder(res.orderId);
        if (paid.unlocked) {
          setIsUnlocked(true);
          setOrderId(paid.orderId);
          await refresh();
        }
        return;
      }

      if (!res.payUrl) throw new Error("未获取支付链接");
      window.location.href = res.payUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建订单失败，请确认支付服务已启动");
    } finally {
      setPaying(false);
    }
  }, [reportId, paymentMode, options?.reportType, refresh]);

  return {
    isUnlocked,
    orderId,
    paidAt,
    tradeNo,
    loading,
    paying,
    error,
    wechatHint,
    isWeChatInApp,
    paymentMode,
    confirmingReturn,
    pollExhausted,
    startPay,
    refresh,
  };
}
