export interface MedicalTerm {
  key: string;
  term: string;
  aliases: string[];
  category: '혈액검사' | 'CBC' | '소변검사' | '영상검사' | '진단' | '처방' | '기타';
  definition: string;
  normalRange?: { dog?: string; cat?: string };
  tip?: string;
}

export const MEDICAL_TERMS: MedicalTerm[] = [
  {
    key: 'BUN',
    term: 'BUN',
    aliases: ['blood urea nitrogen', '혈중요소질소', '요소질소'],
    category: '혈액검사',
    definition: '단백질이 분해되면서 생긴 노폐물(요소)의 혈중 농도. 신장 기능을 가늠하는 가장 흔한 지표.',
    normalRange: { dog: '7~27 mg/dL', cat: '17~33 mg/dL' },
    tip: '식사 직후엔 일시적으로 오를 수 있어요. 탈수 시에도 상승.',
  },
  {
    key: 'CREATININE',
    term: '크레아티닌 (CREA)',
    aliases: ['CREA', 'creatinine'],
    category: '혈액검사',
    definition: '근육에서 만들어져 신장으로 배출되는 노폐물. BUN보다 식사 영향을 덜 받아 신장 기능 평가에 더 신뢰됩니다.',
    normalRange: { dog: '0.5~1.8 mg/dL', cat: '0.8~2.4 mg/dL' },
    tip: 'BUN과 CREA가 동시에 오르면 신장 문제 가능성이 큼.',
  },
  {
    key: 'ALT',
    term: 'ALT (GPT)',
    aliases: ['GPT', 'alanine aminotransferase', '간수치'],
    category: '혈액검사',
    definition: '간세포에 들어 있는 효소. 간세포가 손상되면 혈중으로 흘러나와 수치가 오릅니다.',
    normalRange: { dog: '10~125 U/L', cat: '12~130 U/L' },
    tip: '간 손상 외에도 약물·당뇨·갑상선 문제로도 오를 수 있어요.',
  },
  {
    key: 'AST',
    term: 'AST (GOT)',
    aliases: ['GOT', 'aspartate aminotransferase'],
    category: '혈액검사',
    definition: '간·근육·심장에 분포한 효소. ALT와 함께 보면서 간 손상 정도를 가늠합니다.',
    normalRange: { dog: '0~50 U/L', cat: '0~48 U/L' },
  },
  {
    key: 'ALB',
    term: '알부민 (ALB)',
    aliases: ['albumin'],
    category: '혈액검사',
    definition: '간에서 만드는 가장 흔한 혈장 단백질. 만성 간질환·신장 단백뇨·장 질환에서 낮아집니다.',
    normalRange: { dog: '2.3~4.0 g/dL', cat: '2.3~3.9 g/dL' },
  },
  {
    key: 'TP',
    term: '총단백 (TP)',
    aliases: ['total protein', 'TPRO'],
    category: '혈액검사',
    definition: '혈중 모든 단백질의 합. 탈수 시 높아지고, 영양 흡수·간·신장 문제에서 변동합니다.',
    normalRange: { dog: '5.4~7.5 g/dL', cat: '5.7~7.8 g/dL' },
  },
  {
    key: 'GLU',
    term: '혈당 (GLU)',
    aliases: ['glucose', '글루코스'],
    category: '혈액검사',
    definition: '혈중 포도당 농도. 지속적으로 높으면 당뇨, 낮으면 저혈당.',
    normalRange: { dog: '74~143 mg/dL', cat: '71~159 mg/dL' },
    tip: '고양이는 스트레스만으로도 일시 상승하니 단발성 수치로 당뇨 진단은 안 합니다.',
  },
  {
    key: 'TBIL',
    term: '총빌리루빈 (TBIL)',
    aliases: ['total bilirubin', '빌리루빈'],
    category: '혈액검사',
    definition: '적혈구가 분해될 때 나오는 색소. 간·담도·용혈성 빈혈에서 상승합니다. 황달의 직접 원인.',
    normalRange: { dog: '0.0~0.4 mg/dL', cat: '0.0~0.2 mg/dL' },
  },
  {
    key: 'CHOL',
    term: '콜레스테롤 (CHOL)',
    aliases: ['cholesterol'],
    category: '혈액검사',
    definition: '혈중 콜레스테롤. 갑상선저하증·당뇨·신증후군 등에서 상승.',
    normalRange: { dog: '110~320 mg/dL', cat: '65~225 mg/dL' },
  },
  {
    key: 'WBC',
    term: '백혈구 (WBC)',
    aliases: ['white blood cell'],
    category: 'CBC',
    definition: '감염·염증과 싸우는 세포. 감염·스트레스로 오르고, 골수 억제·중증감염 후기에는 낮아집니다.',
    normalRange: { dog: '5.0~14.1 ×10³/µL', cat: '5.5~19.5 ×10³/µL' },
  },
  {
    key: 'RBC',
    term: '적혈구 (RBC)',
    aliases: ['red blood cell'],
    category: 'CBC',
    definition: '산소를 운반하는 세포. 낮으면 빈혈을 의심합니다.',
    normalRange: { dog: '5.5~8.5 ×10⁶/µL', cat: '5.0~10.0 ×10⁶/µL' },
  },
  {
    key: 'HGB',
    term: '헤모글로빈 (HGB)',
    aliases: ['hemoglobin', '혈색소'],
    category: 'CBC',
    definition: '적혈구 안에서 산소를 직접 운반하는 단백질. 빈혈 평가의 핵심 지표.',
    normalRange: { dog: '12~18 g/dL', cat: '8~15 g/dL' },
  },
  {
    key: 'HCT',
    term: 'HCT / PCV (적혈구용적률)',
    aliases: ['hematocrit', 'PCV', 'packed cell volume'],
    category: 'CBC',
    definition: '혈액 중 적혈구가 차지하는 비율. 빈혈/탈수 평가에 사용됩니다.',
    normalRange: { dog: '37~55%', cat: '24~45%' },
  },
  {
    key: 'PLT',
    term: '혈소판 (PLT)',
    aliases: ['platelet'],
    category: 'CBC',
    definition: '출혈을 막는 세포 조각. 너무 낮으면 점상 출혈·잇몸 출혈이 생길 수 있어요.',
    normalRange: { dog: '200~500 ×10³/µL', cat: '300~800 ×10³/µL' },
  },
  {
    key: 'USG',
    term: 'USG (소변비중)',
    aliases: ['urine specific gravity', '비중'],
    category: '소변검사',
    definition: '소변이 얼마나 농축됐는지를 보는 값. 신장이 물을 잘 농축하는지 가늠합니다.',
    normalRange: { dog: '1.015~1.045', cat: '1.035~1.060' },
    tip: '신장 기능이 떨어지면 비중이 1.012 근처로 묽어집니다 (isosthenuria).',
  },
  {
    key: 'PRO_URINE',
    term: '소변 단백 (PRO)',
    aliases: ['urine protein', '요단백'],
    category: '소변검사',
    definition: '소변에서 검출되는 단백질. 신장 손상·요로 감염·고혈압의 단서.',
    tip: 'UPC (소변 단백/크레아티닌 비)로 정량화하는 게 더 정확합니다.',
  },
  {
    key: 'CKD',
    term: '만성 신장 질환 (CKD)',
    aliases: ['chronic kidney disease', '만성신부전'],
    category: '진단',
    definition: '신장 기능이 서서히 떨어지는 진행성 질환. IRIS 1~4기로 분류됩니다.',
    tip: '저단백·저인 식이 + 충분한 수분 섭취가 핵심. 정기 혈액·소변 검사 필수.',
  },
  {
    key: 'IBD',
    term: 'IBD (염증성 장질환)',
    aliases: ['inflammatory bowel disease'],
    category: '진단',
    definition: '장에 만성 염증이 생기는 질환군. 만성 설사·구토·체중 감소가 흔한 증상.',
  },
  {
    key: 'FLUTD',
    term: 'FLUTD (고양이 하부요로질환)',
    aliases: ['feline lower urinary tract disease'],
    category: '진단',
    definition: '고양이의 방광·요도에 생기는 다양한 문제(특발성 방광염·결석·요도 폐색 등)의 총칭.',
    tip: '수컷에서 요도 폐색은 24시간 내 응급. 소변을 못 보면 바로 병원.',
  },
  {
    key: 'DM',
    term: '당뇨병 (DM)',
    aliases: ['diabetes mellitus'],
    category: '진단',
    definition: '인슐린 부족·저항으로 혈당이 만성적으로 높은 상태. 음수·배뇨 증가, 체중 감소가 흔합니다.',
  },
  {
    key: 'HW',
    term: '심장사상충 (HW)',
    aliases: ['heartworm', '심장사상충증'],
    category: '진단',
    definition: '모기를 통해 감염되는 기생충. 심장·폐혈관에 자리잡아 기침·운동 불내성을 유발.',
    tip: '월 1회 예방약이 표준. 감염 후 치료는 위험·고비용.',
  },
  {
    key: 'NSAID',
    term: 'NSAID (비스테로이드 소염제)',
    aliases: ['nonsteroidal anti-inflammatory', '소염제'],
    category: '처방',
    definition: '통증·염증을 줄이는 약. 멜록시캄·카프로펜·로베나코시브 등이 대표적.',
    tip: '신장·위장관 부작용 가능. 사람용(이부프로펜·아세트아미노펜)은 절대 금기.',
  },
  {
    key: 'STEROID',
    term: '스테로이드',
    aliases: ['프레드니솔론', 'prednisolone', 'corticosteroid'],
    category: '처방',
    definition: '강한 항염·면역억제 효과를 가진 약. 알러지·자가면역·일부 종양에 사용.',
    tip: '장기 사용 시 다음·다뇨·체중 증가·감염 위험 증가. 임의로 중단하면 부작용 큼.',
  },
];

export function findTerm(query: string): MedicalTerm | undefined {
  const q = query.trim().toLowerCase();
  return MEDICAL_TERMS.find(
    (t) =>
      t.key.toLowerCase() === q ||
      t.term.toLowerCase().includes(q) ||
      t.aliases.some((a) => a.toLowerCase().includes(q)),
  );
}

export function searchTerms(query: string): MedicalTerm[] {
  const q = query.trim().toLowerCase();
  if (!q) return MEDICAL_TERMS;
  return MEDICAL_TERMS.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.key.toLowerCase().includes(q) ||
      t.aliases.some((a) => a.toLowerCase().includes(q)) ||
      t.definition.toLowerCase().includes(q),
  );
}
