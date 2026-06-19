const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

/** 报告页付费墙：未支付仅预览前半，支付后解锁全文 */
export const PAYMENT_DISABLED = false;

export type PaymentMode = "mock" | "alipay" | "wechat" | "paypal" | "disabled";
export type PaymentChannel = "alipay" | "wechat" | "paypal";

export function getPaymentLabels(mode: PaymentMode | null | undefined, t?: (key: string) => string) {
  const tn = (key: string) => (t ? t(key) : key);
  switch (mode) {
    case "wechat":
      return { name: tn("paymentWechat"), paying: tn("paymentWechatPaying"), button: tn("paymentWechatButton"), buttonColor: "#07c160" };
    case "alipay":
      return { name: tn("paymentAlipay"), paying: tn("paymentAlipayPaying"), button: tn("paymentAlipayButton"), buttonColor: "#1677ff" };
    case "paypal":
      return { name: "PayPal", paying: tn("paymentPaypalPaying"), button: tn("paymentPaypalButton"), buttonColor: "#0070BA" };
    default:
      return { name: tn("paymentMock"), paying: tn("paymentMockPaying"), button: tn("paymentMockButton"), buttonColor: "#5B3A8C" };
  }
}

export interface UnlockStatus {
  unlocked: boolean;
  reportId: string;
  hasReport?: boolean;
  orderId?: string;
  paidAt?: number;
  tradeNo?: string;
  payerContact?: string;
}

export interface ReportOrderInfo {
  orderId: string;
  reportId: string;
  status: "pending" | "paid" | "closed";
  amount?: number;
  amountYuan?: string;
  title?: string;
  tradeNo?: string;
  payerContact?: string;
  createdAt?: number;
  paidAt?: number;
}

export interface CreateOrderResponse {
  orderId?: string;
  reportId: string;
  amount?: number;
  amountYuan?: string;
  title?: string;
  payUrl?: string;
  channel?: PaymentChannel;
  paymentMode?: PaymentMode;
  alreadyUnlocked?: boolean;
  wechatInApp?: boolean;
  hint?: string;
  error?: string;
}

export interface OrderStatusResponse {
  orderId: string;
  reportId: string;
  status: "pending" | "paid" | "closed";
  unlocked: boolean;
  paidAt?: number;
  amount?: number;
  amountYuan?: string;
  tradeNo?: string;
  payerContact?: string;
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const payload = data as { error?: string; message?: string };
    const msg = payload.error || payload.message;
    if (res.status === 500 && !msg) {
      throw new Error(
        "支付服务异常（500）。请确认后端已启动，且 orders/reports/unlocks 表已创建（重启后端可自动建表）"
      );
    }
    throw new Error(msg || `请求失败 ${res.status}`);
  }
  return data as T;
}

export async function checkUnlock(reportId: string): Promise<UnlockStatus> {
  const res = await fetch(`${API_BASE}/api/unlock/${encodeURIComponent(reportId)}`);
  return parseJson(res);
}

export async function createOrder(
  reportId: string,
  options?: { payerContact?: string; reportType?: string; location?: string }
): Promise<CreateOrderResponse> {
  const client = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop";
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reportId,
      client,
      payerContact: options?.payerContact,
      reportType: options?.reportType,
      location: options?.location,
      eventSourceUrl: window.location.href,
    }),
  });
  return parseJson(res);
}

export async function listReportOrders(reportId: string): Promise<{
  reportId: string;
  unlocked: boolean;
  orderId?: string;
  orders: ReportOrderInfo[];
}> {
  const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(reportId)}/orders`);
  return parseJson(res);
}

export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}`);
  return parseJson(res);
}

/** 支付宝同步回跳：验签并标记订单已支付（本地无公网 notify 时依赖此接口） */
export async function confirmAlipayReturn(
  alipayParams: Record<string, string>
): Promise<{ ok: boolean; orderId: string; reportId: string; unlocked: boolean }> {
  const res = await fetch(`${API_BASE}/api/alipay/confirm-return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alipayParams),
  });
  return parseJson(res);
}

/** PayPal 回跳确认 */
export async function confirmPaypalReturn(
  payload: { token: string; orderId?: string }
): Promise<{ ok: boolean; orderId: string; reportId: string; unlocked: boolean }> {
  const res = await fetch(`${API_BASE}/api/paypal/confirm-return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

/** 微信 H5 回跳：主动查单（notify 延迟时的兜底） */
export async function confirmWechatReturn(
  payload: { orderId: string }
): Promise<{ ok: boolean; orderId: string; reportId: string; unlocked: boolean }> {
  const res = await fetch(`${API_BASE}/api/wechat/confirm-return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export interface HealthResponse {
  ok: boolean;
  paymentMode?: PaymentMode;
  wechatConfigured?: boolean;
  alipayConfigured?: boolean;
  database?: string;
  runtime?: string;
}

export async function ensurePaymentSchema(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/dev/ensure-schema`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const payload = data as { error?: string; message?: string };
    throw new Error(payload.error || payload.message || `建表失败 ${res.status}`);
  }
}

export async function mockCompleteOrder(orderId: string): Promise<{ ok: boolean; unlocked: boolean; orderId: string; reportId: string }> {
  const res = await fetch(`${API_BASE}/api/dev/mock-pay/${encodeURIComponent(orderId)}/instant`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  return parseJson(res);
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/health`);
  return parseJson(res);
}
