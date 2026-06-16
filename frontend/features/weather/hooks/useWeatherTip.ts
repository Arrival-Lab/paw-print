import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { weatherApi } from '../api/weatherApi';
import { selectWeatherTip, type WeatherTip } from '../tips';
import type { WeatherSnapshot, WeatherTrigger } from '../types';

interface Coords { lat: number; lng: number }

/**
 * 위치 권한 받아서 날씨 트리거 + 해당 팁 + 스냅샷 반환.
 * 권한 거부·위치 실패·트리거 NONE·카탈로그 빈 경우 모두 tip 은 null →
 * 호출부에서 월별팁 폴백. trigger 와 weather 는 가능한 경우 채워서 반환
 * (카드가 NONE 일 때도 그라데이션·아이콘 결정에 사용).
 */
export function useWeatherTip(): {
  trigger: WeatherTrigger;
  label: string | null;
  tip: WeatherTip | null;
  weather: WeatherSnapshot | null;
} {
  const { i18n } = useTranslation();
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const req = await Location.requestForegroundPermissionsAsync();
          if (req.status !== 'granted') return;
        }
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          setCoords({ lat: last.coords.latitude, lng: last.coords.longitude });
          return;
        }
        const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: fresh.coords.latitude, lng: fresh.coords.longitude });
      } catch {
        // 무시 — 월별팁 폴백
      }
    })();
  }, []);

  const cacheKey = coords
    ? `${Math.round(coords.lat * 100) / 100}_${Math.round(coords.lng * 100) / 100}`
    : null;

  const { data } = useQuery({
    queryKey: ['weather-care-tip', cacheKey],
    queryFn: () => weatherApi.getCareTip(coords!.lat, coords!.lng),
    enabled: !!coords,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });

  // i18n.language 를 deps 에 포함 — 언어 변경 시 팁 텍스트 재선택. (eslint deps 경고는 의도)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tip = useMemo(() => (data ? selectWeatherTip(data.trigger) : null), [data?.trigger, i18n.language]);

  return {
    trigger: data?.trigger ?? 'NONE',
    label: data?.label ?? null,
    tip,
    weather: data?.weather ?? null,
  };
}
