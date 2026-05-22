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

export const symptomApi = {
  check: (req: SymptomCheckRequest) =>
    client.post<SymptomCheckResponse>('/api/ai/symptom-check', req),
};
