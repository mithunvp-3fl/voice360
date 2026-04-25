export type Verdict = 'majorly_comply' | 'partial_comply' | 'not_complied' | 'na';

export type ResponseSource = 'tap' | 'voice';

export type AuditStatus = 'scheduled' | 'in_progress' | 'draft' | 'submitted';

export type Industry = 'food' | 'pharma' | 'retail';

export type UserRole = 'admin' | 'auditor';

export interface ChecklistQuestion {
  id: string;
  text: string;
  isMandatory: boolean;
  responseOptions: Verdict[];
  order: number;
  /** Optional embedding stored at audit start — populated by mobile, not the seed. */
  embedding?: number[];
}

export interface ChecklistSection {
  id: string;
  name: string;
  order: number;
  questions: ChecklistQuestion[];
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  industry: Industry;
  version: number;
  isActive: boolean;
  sections: ChecklistSection[];
}

export interface Vendor {
  id: string;
  name: string;
  type: string;
  address: string;
  contactName?: string;
  contactPhone?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Audit {
  id: string;
  vendorId: string;
  templateId: string;
  templateSnapshot: ChecklistTemplate;
  auditorId: string;
  status: AuditStatus;
  scheduledAt: string;
  startedAt?: string;
  submittedAt?: string;
}

export interface AuditResponse {
  id: string;
  auditId: string;
  questionId: string;
  verdict?: Verdict;
  comment?: string;
  confidence?: number;
  source: ResponseSource;
  updatedAt: string;
}

export interface PhotoRef {
  id: string;
  responseId: string;
  storagePath: string;
}

export interface Utterance {
  startMs: number;
  endMs: number;
  text: string;
  matchedQuestionId?: string;
  matchedVerdict?: Verdict;
  confidence?: number;
}

export interface Transcript {
  id: string;
  auditId: string;
  fullText: string;
  utterances: Utterance[];
}
