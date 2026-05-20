import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { weatherApi } from '../api/weatherApi';
import { selectWeatherTip, type WeatherTip } from '../tips';

interface Coords { lat: number; lng: number }

/**
 * 위치 권한 받아서 날씨 트리거 + 해당 팁 반환.
 * 권한 거부·위치 실패·트리거 NONE·카탈로그 빈 경우 모두 null → 호출부에서 월별팁 폴백.
 */
export function useWeatherTip(): {
  trigger: string | null;
  label: string | null;
  tip: WeatherTip | null;
} {
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const req = await Location.requestForegroundPermissionsAsync();
          if (req.status !== 'granted') return;
        }
        // 최근 캐시된 좌표 우선 (빠름). 없으면 GPS lock.
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

  // 좌표 0.01° (~1km) 반올림으로 캐시 키 안정화 (좌표 미세 흔들림에도 같은 쿼리)
  const cacheKey = coords
    ? `${Math.round(coords.lat * 100) / 100}_${Math.round(coords.lng * 100) / 100}`
    : null;

  const { data } = useQuery({
    queryKey: ['weather-care-tip', cacheKey],
    queryFn: () => weatherApi.getCareTip(coords!.lat, coords!.lng),
    enabled: !!coords,
    staleTime: 60 * 60 * 1000, // 1h
    gcTime: 2 * 60 * 60 * 1000,
  });

  // 트리거 바뀌면 팁도 새로 선택 (rerender 마다 random 으로 깜빡이지 않도록 메모)
  const tip = useMemo(() => (data ? selectWeatherTip(data.trigger) : null), [data?.trigger]);

  if (!data || !tip) return { trigger: null, label: null, tip: null };
  return { trigger: data.trigger, label: data.label, tip };
}
