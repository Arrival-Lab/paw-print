import client from '../../../shared/api/client';

export type Urgency = 'IMMEDIATE' | 'WITHIN_24H' | 'OBSERVE' | 'UNCLEAR';

export interface PossibleCause {
  name: string;
  probability: number;
  description: string;
}

export interface SymptomCheckResponse {
  urgency: Urgency;
  urgencyReason: string;
  possibleCauses: PossibleCause[];
  recommendedActions: string[];
  emergencyKeywordDetected: string | null;
  disclaimer: string;
  remainingFreeChecks: number | null;
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
}

export const symptomApi = {
  check: (req: SymptomCheckRequest) =>
    client.post<SymptomCheckResponse>('/api/ai/symptom-check', req),
  followup: (req: SymptomFollowupRequest) =>
    client.post<SymptomFollowupResponse>('/api/ai/symptom-check/followup', req),
};
