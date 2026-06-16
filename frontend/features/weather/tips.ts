import type { Feather } from '@expo/vector-icons';
import i18n from '../../shared/i18n';
import type { WeatherTrigger } from './types';

export interface WeatherTip {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
  caution: string; // "단두종, 노령 주의" — 카드 하단 캡션
}

type ActiveTrigger = Exclude<WeatherTrigger, 'NONE'>;

// 아이콘만 코드 보유. title/body/caution 은 i18n weather.tips.{trigger} (returnObjects) 에서.
const WEATHER_TIP_ICONS: Record<ActiveTrigger, WeatherTip['icon'][]> = {
  HEATWAVE: ['alert-circle', 'clock', 'alert-triangle', 'alert-octagon', 'umbrella'],
  COLDWAVE: ['clock', 'alert-circle', 'search', 'droplet', 'wind'],
  RAIN_HEAVY: ['cloud-rain', 'alert-octagon', 'slash', 'alert-triangle', 'package'],
  DUST_PM: ['wind', 'clock', 'droplet', 'activity', 'square'],
  YELLOW_DUST: ['wind', 'eye', 'droplet', 'disc', 'square'],
  THUNDER: ['shield', 'heart', 'alert-triangle', 'volume-2', 'alert-octagon'],
  RAIN_LIGHT: ['clock', 'droplet', 'slash', 'alert-circle', 'wind'],
  TEMP_DIFF: ['clock', 'activity', 'activity', 'thermometer', 'activity'],
  HUMIDITY_HIGH: ['thermometer', 'search', 'disc', 'wind', 'slash'],
  HUMIDITY_LOW: ['search', 'droplet', 'alert-circle', 'search', 'zap'],
  UV_HIGH: ['sun', 'shield', 'scissors', 'umbrella', 'clipboard'],
  WIND_STRONG: ['wind', 'link', 'square', 'alert-triangle', 'volume-2'],
};

/** 트리거에 해당하는 팁 1개 랜덤 선택. 카탈로그 비었거나 NONE 이면 null. */
export function selectWeatherTip(trigger: WeatherTrigger): WeatherTip | null {
  if (trigger === 'NONE') return null;
  const icons = WEATHER_TIP_ICONS[trigger];
  if (!icons || icons.length === 0) return null;
  const texts = i18n.t(`weather.tips.${trigger}`, { returnObjects: true }) as
    | { title: string; body: string; caution: string }[]
    | undefined;
  if (!Array.isArray(texts) || texts.length === 0) return null;
  const idx = Math.floor(Math.random() * icons.length);
  const txt = texts[idx] ?? texts[0];
  return { icon: icons[idx], title: txt.title, body: txt.body, caution: txt.caution };
}
