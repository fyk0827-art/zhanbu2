import type { NatalChart } from "./astrologyEngine";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

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

export interface FetchReportResponse {
  reportId: string;
  hasReport: boolean;
  unlocked: boolean;
  displayName?: string;
  reportText?: string;
  chartJson?: NatalChart;
  orderId?: string;
  paidAt?: number;
  orders?: ReportOrderInfo[];
  paidOrders?: ReportOrderInfo[];
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `请求失败 ${res.status}`);
  }
  return data as T;
}

/** 将报告正文同步到服务器（生成确认后调用） */
export async function saveReportToServer(params: {
  reportId: string;
  reportText: string;
  chartJson?: NatalChart | null;
  displayName?: string;
  /** 后端接入多报告类型后写入 reports.report_type */
  reportType?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(params.reportId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reportText: params.reportText,
      chartJson: params.chartJson ?? undefined,
      displayName: params.displayName,
      reportType: params.reportType,
    }),
  });
  await parseJson(res);
}

/** 从服务器拉取报告（已付费时返回全文，可换设备恢复） */
export async function fetchReportFromServer(reportId: string): Promise<FetchReportResponse | null> {
  const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(reportId)}`);
  if (res.status === 404) {
    return { reportId, hasReport: false, unlocked: false };
  }
  return parseJson(res);
}
