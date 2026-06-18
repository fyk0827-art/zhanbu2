/** 兼容 HashRouter：查询参数在 #/path?query 中，而非 location.search */
export function getRouterSearchParams(): URLSearchParams {
  const hash = window.location.hash;
  const qIndex = hash.indexOf("?");
  if (qIndex >= 0) {
    return new URLSearchParams(hash.slice(qIndex + 1));
  }
  return new URLSearchParams(window.location.search);
}

const PAYMENT_QUERY_KEYS = [
  "orderId",
  "reportId",
  "reportType",
  "paid",
  "charset",
  "out_trade_no",
  "method",
  "total_amount",
  "sign",
  "trade_no",
  "auth_app_id",
  "version",
  "app_id",
  "sign_type",
  "seller_id",
  "timestamp",
];

export function getAlipayReturnParams(): Record<string, string> | null {
  const params = getRouterSearchParams();
  const tradeNo = params.get("trade_no");
  const sign = params.get("sign");
  if (!tradeNo || !sign) return null;
  const out: Record<string, string> = {};
  params.forEach((v, k) => {
    if (k !== "orderId" && k !== "reportId" && k !== "paid" && v) out[k] = v;
  });
  if (!out.out_trade_no) {
    const orderId = params.get("orderId");
    if (orderId) out.out_trade_no = orderId;
  }
  return out;
}

export function stripRouterPaymentParams(): void {
  const hash = window.location.hash;
  const qIndex = hash.indexOf("?");
  if (qIndex >= 0) {
    const path = hash.slice(0, qIndex);
    const params = new URLSearchParams(hash.slice(qIndex + 1));
    for (const k of PAYMENT_QUERY_KEYS) params.delete(k);
    const rest = params.toString();
    window.location.hash = rest ? `${path}?${rest}` : path;
    return;
  }
  const url = new URL(window.location.href);
  for (const k of PAYMENT_QUERY_KEYS) url.searchParams.delete(k);
  window.history.replaceState({}, "", url.pathname + url.search);
}
