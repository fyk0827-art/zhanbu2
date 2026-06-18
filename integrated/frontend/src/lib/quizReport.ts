export interface QuizReportAnswer {
  questionId: number;
  title: string;
  description?: string;
  selectedKey: string;
  selectedText: string;
}

export interface QuizReportData {
  userAge: string;
  ageGroupName: string;
  ageGroupId: number;
  language: string;
  answers: QuizReportAnswer[];
  completedAt: string;
}

export const QUIZ_REPORT_STORAGE_KEY = "qaQuizReport";

export function saveQuizReport(data: QuizReportData) {
  sessionStorage.setItem(QUIZ_REPORT_STORAGE_KEY, JSON.stringify(data));
}

export function loadQuizReport(): QuizReportData | null {
  const raw = sessionStorage.getItem(QUIZ_REPORT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QuizReportData;
  } catch {
    return null;
  }
}
