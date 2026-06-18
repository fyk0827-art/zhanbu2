import type { BirthData } from "./astrologyEngine";
import type { ReportTypeId } from "../types/reportTypes";
import { sha256Hex } from "./sha256";

/** 与 server/src/reportId.ts 保持相同规则 */
export async function computeReportId(
  birth: BirthData,
  reportType: ReportTypeId = "full"
): Promise<string> {
  const payload =
    reportType === "full"
      ? [
          birth.name ?? "",
          birth.year,
          birth.month,
          birth.day,
          birth.hour,
          birth.minute,
          birth.latitude,
          birth.longitude,
          birth.gender,
        ]
      : [
          reportType,
          birth.name ?? "",
          birth.year,
          birth.month,
          birth.day,
          birth.hour,
          birth.minute,
          birth.latitude,
          birth.longitude,
          birth.gender,
        ];
  const joined = payload.join("|");
  const hex = await sha256Hex(joined);
  return hex.slice(0, 32);
}
