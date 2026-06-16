import i18n from '../../../shared/i18n';

export interface MedicalTerm {
  key: string;
  term: string;
  aliases: string[];
  category: string;
  definition: string;
  normalRange?: { dog?: string; cat?: string };
  tip?: string;
}

// 검색 키·정상범위·카테고리 코드는 코드 보유. 표시 문자열(term/aliases/definition/tip)은 i18n glossary.terms.{key}.
type CategoryCode = 'blood' | 'cbc' | 'urine' | 'imaging' | 'diagnosis' | 'prescription' | 'other';

interface MedicalTermMeta {
  key: string;
  categoryCode: CategoryCode;
  normalRange?: { dog?: string; cat?: string };
}

const MEDICAL_TERM_META: MedicalTermMeta[] = [
  { key: 'BUN', categoryCode: 'blood', normalRange: { dog: '7~27 mg/dL', cat: '17~33 mg/dL' } },
  { key: 'CREATININE', categoryCode: 'blood', normalRange: { dog: '0.5~1.8 mg/dL', cat: '0.8~2.4 mg/dL' } },
  { key: 'ALT', categoryCode: 'blood', normalRange: { dog: '10~125 U/L', cat: '12~130 U/L' } },
  { key: 'AST', categoryCode: 'blood', normalRange: { dog: '0~50 U/L', cat: '0~48 U/L' } },
  { key: 'ALB', categoryCode: 'blood', normalRange: { dog: '2.3~4.0 g/dL', cat: '2.3~3.9 g/dL' } },
  { key: 'TP', categoryCode: 'blood', normalRange: { dog: '5.4~7.5 g/dL', cat: '5.7~7.8 g/dL' } },
  { key: 'GLU', categoryCode: 'blood', normalRange: { dog: '74~143 mg/dL', cat: '71~159 mg/dL' } },
  { key: 'TBIL', categoryCode: 'blood', normalRange: { dog: '0.0~0.4 mg/dL', cat: '0.0~0.2 mg/dL' } },
  { key: 'CHOL', categoryCode: 'blood', normalRange: { dog: '110~320 mg/dL', cat: '65~225 mg/dL' } },
  { key: 'WBC', categoryCode: 'cbc', normalRange: { dog: '5.0~14.1 ×10³/µL', cat: '5.5~19.5 ×10³/µL' } },
  { key: 'RBC', categoryCode: 'cbc', normalRange: { dog: '5.5~8.5 ×10⁶/µL', cat: '5.0~10.0 ×10⁶/µL' } },
  { key: 'HGB', categoryCode: 'cbc', normalRange: { dog: '12~18 g/dL', cat: '8~15 g/dL' } },
  { key: 'HCT', categoryCode: 'cbc', normalRange: { dog: '37~55%', cat: '24~45%' } },
  { key: 'PLT', categoryCode: 'cbc', normalRange: { dog: '200~500 ×10³/µL', cat: '300~800 ×10³/µL' } },
  { key: 'USG', categoryCode: 'urine', normalRange: { dog: '1.015~1.045', cat: '1.035~1.060' } },
  { key: 'PRO_URINE', categoryCode: 'urine' },
  { key: 'CKD', categoryCode: 'diagnosis' },
  { key: 'IBD', categoryCode: 'diagnosis' },
  { key: 'FLUTD', categoryCode: 'diagnosis' },
  { key: 'DM', categoryCode: 'diagnosis' },
  { key: 'HW', categoryCode: 'diagnosis' },
  { key: 'NSAID', categoryCode: 'prescription' },
  { key: 'STEROID', categoryCode: 'prescription' },
];

/** 수록 용어 개수 (i18n 로드와 무관한 정적 값). */
export const MEDICAL_TERM_COUNT = MEDICAL_TERM_META.length;

/** 현재 언어 기준으로 표시 문자열을 채운 용어 리스트. 언어 변경 시 다시 호출해야 함. */
export function getMedicalTerms(): MedicalTerm[] {
  return MEDICAL_TERM_META.map((m) => {
    const tx = i18n.t(`glossary.terms.${m.key}`, { returnObjects: true }) as {
      term: string;
      aliases: string[];
      definition: string;
      tip?: string;
    };
    return {
      key: m.key,
      term: tx.term,
      aliases: tx.aliases ?? [],
      category: i18n.t(`glossary.category.${m.categoryCode}`),
      definition: tx.definition,
      normalRange: m.normalRange,
      tip: tx.tip,
    };
  });
}

export function findTerm(query: string): MedicalTerm | undefined {
  const q = query.trim().toLowerCase();
  return getMedicalTerms().find(
    (t) =>
      t.key.toLowerCase() === q ||
      t.term.toLowerCase().includes(q) ||
      t.aliases.some((a) => a.toLowerCase().includes(q)),
  );
}

export function searchTerms(query: string): MedicalTerm[] {
  const all = getMedicalTerms();
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.key.toLowerCase().includes(q) ||
      t.aliases.some((a) => a.toLowerCase().includes(q)) ||
      t.definition.toLowerCase().includes(q),
  );
}
