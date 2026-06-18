import type { ReportTypeId } from "../types/reportTypes";
import { parseReportTypeId } from "../types/reportTypes";

const STORAGE_KEY_TYPE = "taiji_report_type";

let globalReportType: ReportTypeId = "full";

export function getGlobalReportType(): ReportTypeId {
  return globalReportType;
}

export function setGlobalReportType(type: ReportTypeId): void {
  globalReportType = type;
  try {
    localStorage.setItem(STORAGE_KEY_TYPE, type);
  } catch {
    /* ignore */
  }
}

export function loadSavedReportType(): ReportTypeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TYPE);
    if (saved) globalReportType = parseReportTypeId(saved);
  } catch {
    /* ignore */
  }
  return globalReportType;
}

loadSavedReportType();
