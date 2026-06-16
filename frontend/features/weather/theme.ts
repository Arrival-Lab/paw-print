import i18n from '../../shared/i18n';
import type { WeatherTrigger } from './types';
import type { WeatherSnapshot } from './types';

/**
 * 트리거별 그라데이션 + 액센트 컬러.
 * 모두 라이트 톤 → 어두운 ink 텍스트로 통일 (브랜드 컬러 규칙).
 * accent 는 트리거 아이콘 원·caution 색·칩 보더에 사용.
 */
export interface TriggerTheme {
  gradient: [string, string];   // [from, to]
  accent: string;                // 강조색 (어두운 톤)
  textOnAccent: string;          // accent 위 텍스트 색 (대비 확보된 톤)
}

export const TRIGGER_THEMES: Record<WeatherTrigger, TriggerTheme> = {
  HEATWAVE:      { gradient: ['#FFE2D1', '#FAB99F'], accent: '#C44A2A', textOnAccent: '#FFFFFF' },
  COLDWAVE:      { gradient: ['#DCEEF7', '#A8CDE3'], accent: '#2C6E94', textOnAccent: '#FFFFFF' },
  RAIN_HEAVY:    { gradient: ['#C6DCE8', '#8AAEC4'], accent: '#26577B', textOnAccent: '#FFFFFF' },
  RAIN_LIGHT:    { gradient: ['#E2ECF2', '#BAD0DC'], accent: '#3F6B85', textOnAccent: '#FFFFFF' },
  DUST_PM:       { gradient: ['#E8DFCA', '#C9B98C'], accent: '#6B5A2E', textOnAccent: '#FFFFFF' },
  YELLOW_DUST:   { gradient: ['#F4DFA8', '#E0BC68'], accent: '#7E5C1A', textOnAccent: '#FFFFFF' },
  THUNDER:       { gradient: ['#D6CFE4', '#A89DC0'], accent: '#5A4A8E', textOnAccent: '#FFFFFF' },
  TEMP_DIFF:     { gradient: ['#E8E3D6', '#C8C0AC'], accent: '#6D6347', textOnAccent: '#FFFFFF' },
  HUMIDITY_HIGH: { gradient: ['#C8E0DA', '#99C7BB'], accent: '#346B61', textOnAccent: '#FFFFFF' },
  HUMIDITY_LOW:  { gradient: ['#ECE0D1', '#D6BA98'], accent: '#6E4E2F', textOnAccent: '#FFFFFF' },
  UV_HIGH:       { gradient: ['#FFE7A0', '#FFC95A'], accent: '#A04E00', textOnAccent: '#FFFFFF' },
  WIND_STRONG:   { gradient: ['#DDE3E8', '#B4BFC8'], accent: '#3F4E5C', textOnAccent: '#FFFFFF' },
  NONE:          { gradient: ['#FDF1F4', '#FADEE5'], accent: '#B65A6F', textOnAccent: '#FFFFFF' },
};

/** 트리거별로 카드에 노출할 핵심 지표 칩. 최대 3개. */
export interface DataChip {
  icon: string;   // emoji
  label: string;  // "12mm", "18°C"
}

export function buildChips(trigger: WeatherTrigger, w: WeatherSnapshot | null): DataChip[] {
  if (!w) return [];
  const chips: DataChip[] = [];
  const t = (v: number | null) => (v == null ? null : `${Math.round(v)}°C`);
  const p = (v: number | null) => (v == null ? null : `${Math.round(v)}%`);
  const r = (v: number | null) => (v == null ? null : `${v.toFixed(1)}mm`);
  const u = (v: number | null, unit: string) => (v == null ? null : `${Math.round(v)}${unit}`);

  const push = (icon: string, label: string | null) => { if (label) chips.push({ icon, label }); };

  switch (trigger) {
    case 'HEATWAVE':
      push('🌡', t(w.feelsLikeC ?? w.tempC));
      push('💧', p(w.humidity));
      break;
    case 'COLDWAVE':
      push('🌡', t(w.feelsLikeC ?? w.tempC));
      push('💨', u(w.windMs, 'm/s'));
      break;
    case 'RAIN_HEAVY':
      push('🌧', r(w.rainMmHourly ?? w.rainMmDaily));
      push('💧', p(w.humidity));
      push('🌡', t(w.tempC));
      break;
    case 'RAIN_LIGHT':
      push('🌧', r(w.rainMmDaily ?? w.rainMmHourly));
      push('🌡', t(w.tempC));
      break;
    case 'DUST_PM':
    case 'YELLOW_DUST':
      push('PM2.5', w.pm25 != null ? `${Math.round(w.pm25)}` : '');
      push('PM10', w.pm10 != null ? `${Math.round(w.pm10)}` : '');
      break;
    case 'THUNDER':
      push('⚡', i18n.t('weather.thunderChip'));
      push('🌧', r(w.rainMmHourly));
      break;
    case 'TEMP_DIFF':
      push('🌡', w.tempDiffC != null ? `±${Math.round(w.tempDiffC)}°C` : null);
      break;
    case 'HUMIDITY_HIGH':
    case 'HUMIDITY_LOW':
      push('💧', p(w.humidity));
      push('🌡', t(w.tempC));
      break;
    case 'UV_HIGH':
      push('☀', u(w.uvIndex, ''));
      break;
    case 'WIND_STRONG':
      push('💨', u(w.windMs, 'm/s'));
      break;
    case 'NONE':
      break;
  }
  return chips.filter((c) => c.label && c.label !== '');
}
