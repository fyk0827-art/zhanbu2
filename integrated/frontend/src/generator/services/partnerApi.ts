const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
const PREPAID_ORDER_KEY = "prepaid_order_id";

export interface PartnerOrderInfo {
  orderId: string;
  reportId: string;
  status: string;
  prepaid?: boolean;
  reportPending?: boolean;
  amount?: number;
  amountYuan?: string;
  title?: string;
}

export function getPrepaidOrderId(): string | null {
  return sessionStorage.getItem(PREPAID_ORDER_KEY);
}

export function setPrepaidOrderId(orderId: string | null) {
  if (orderId) {
    sessionStorage.setItem(PREPAID_ORDER_KEY, orderId);
  } else {
    sessionStorage.removeItem(PREPAID_ORDER_KEY);
  }
}

export async function fetchPartnerOrder(orderId: string): Promise<PartnerOrderInfo> {
  const res = await fetch(`${API_BASE}/api/partner/orders/${encodeURIComponent(orderId)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || `订单查询失败 ${res.status}`);
  }
  return data as PartnerOrderInfo;
}

export async function bindPrepaidReport(orderId: string, reportId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/partner/bind-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, reportId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || `绑定报告失败 ${res.status}`);
  }
}
