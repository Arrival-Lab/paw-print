import client from '../../../shared/api/client';

export type Urgency = 'IMMEDIATE' | 'WITHIN_24H' | 'OBSERVE' | 'UNCLEAR';

export interface Reference {
  name: string;
  url: string;
}

export interface PossibleCause {
  name: string;
  probability: number;
  description: string;
  /** MSD Veterinary Manual 검색 URL — Apple Guideline 1.4.1 대응 citation. */
  referenceUrl: string;
}

export interface SymptomCheckResponse {
  urgency: Urgency;
  urgencyReason: string;
  possibleCauses: PossibleCause[];
  recommendedActions: string[];
  emergencyKeywordDetected: string | null;
  disclaimer: string;
  remainingFreeChecks: number | null;
  /** 응답마다 항상 채워지는 공인 수의 정보원 리스트. 결과 화면 하단에 노출. */
  references: Reference[];
}

export interface SymptomCheckRequest {
  petId?: number;
  symptoms: string;
  durationHours?: number;
  additionalInfo?: string;
  acknowledgedDisclaimer: boolean;
}

export type ChatRole = 'USER' | 'ASSISTANT';

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface SymptomFollowupRequest {
  petId?: number;
  originalSymptoms: string;
  originalDurationHours?: number;
  history: ChatTurn[];
  question: string;
}

export interface SymptomFollowupResponse {
  answer: string;
  emergencyKeywordDetected: string | null;
  disclaimer: string;
  references: Reference[];
}

export const symptomApi = {
  check: (req: SymptomCheckRequest) =>
    client.post<SymptomCheckResponse>('/api/ai/symptom-check', req),
  followup: (req: SymptomFollowupRequest) =>
    client.post<SymptomFollowupResponse>('/api/ai/symptom-check/followup', req),
};
