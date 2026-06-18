export interface AgeGroup {
  id: number;
  name: string;
  minAge: number;
  maxAge: number;
  price: number;
  sortOrder: number;
}

export interface OptionDTO {
  key: string;
  text: string;
}

export interface TranslationDTO {
  languageCode: string;
  title: string;
  description: string;
}

export interface QuestionDTO {
  id: number;
  ageGroupId: number;
  title: string;
  description: string;
  isActive: boolean;
  options: OptionDTO[];
  ageGroup?: AgeGroup;
}

export interface AdminQuestionDTO {
  id: number;
  ageGroupId: number;
  ageGroupName: string;
  isActive: boolean;
  translations: TranslationDTO[];
  options: OptionDTO[];
}

export interface AnswerDTO {
  id: number;
  questionId: number;
  respondentAge: number;
  selectedOption: string;
  questionTitle?: string;
  createdAt?: string;
}

export interface PageDTO<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
}

export interface SubmitAnswerRequest {
  questionId: number;
  respondentAge: number;
  selectedOption: string;
}

export interface CreateQuestionRequest {
  ageGroupId: number;
  isActive: boolean;
  translations: TranslationDTO[];
  options: OptionDTO[];
}

export interface UpdateQuestionRequest extends CreateQuestionRequest {
  id: number;
}

export interface PaymentRequest {
  questionId: number;
}

export interface PaymentVerifyRequest {
  paymentToken: string;
}

export interface PaymentCreateRequest {
  questionId: number;
}

export interface PaymentCreateResponse {
  tradeNo: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentCompleteRequest {
  tradeNo: string;
}

export interface PaymentCompleteResponse {
  tradeNo: string;
  status: string;
  orderId: string;
  frontendUrl: string;
}

export interface PublicSettings {
  quizQuestionCount: number;
}

export interface AdminSettings {
  quizQuestionCount: number;
  paymentMode: "mock" | "live";
}

export interface UpdateSettingsRequest {
  quizQuestionCount?: number;
  paymentMode?: "mock" | "live";
}

/** @deprecated use PaymentCreateResponse */
export interface PaymentResponse {
  paymentToken: string;
  amount: number;
  status: string;
}

export interface PartnerConfirmRequest {
  tradeNo: string;
  amount?: number;
  payerContact?: string;
}

export interface PartnerConfirmResponse {
  ok: boolean;
  alreadyConfirmed?: boolean;
  orderId: string;
  prepaid?: boolean;
  reportPending?: boolean;
  frontendUrl: string;
  amount?: number;
  amountDisplay?: string;
  hint?: string;
  tradeNo?: string;
}
