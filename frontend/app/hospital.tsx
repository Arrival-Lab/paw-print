import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { HospitalCard } from '../features/hospital/components/HospitalCard';
import { useEmergencyHospitals } from '../features/hospital/hooks/useHospital';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import Chip from '../shared/components/Chip';

type Filter = 'all' | 'open24h';

// 백엔드가 영업시간을 제공하지 않으므로 병원명 키워드로 24시 운영 여부 추정.
// 한국 동물병원은 24시 운영 시 통상 이름에 명시함.
const OPEN_24H_KEYWORDS = ['24시', '24H', '24h'];
function is24hHospital(name: string): boolean {
  return OPEN_24H_KEYWORDS.some((k) => name.includes(k));
}

export default function HospitalScreen() {
  const Colors = useColors();
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const hour = new Date().getHours();
  const isLateNight = hour >= 22 || hour < 6;

  // 새벽이면 기본 필터를 '24시 우선' 으로 자동 전환 (시간 컨텍스트 매핑).
  useEffect(() => {
    if (isLateNight) setFilter('open24h');
  }, [isLateNight]);

  const { data: hospitals = [], isLoading, refetch } = useEmergencyHospitals(lat, lng);

  const filteredHospitals = useMemo(() => {
    if (filter === 'open24h') return hospitals.filter((h) => is24hHospital(h.name));
    return hospitals;
  }, [hospitals, filter]);

  const counts = useMemo(() => ({
    all: hospitals.length,
    open24h: hospitals.filter((h) => is24hHospital(h.name)).length,
  }), [hospitals]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('위치 권한이 거부되었습니다. 설정에서 허용해주세요.');
          setRequesting(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLat(loc.coords.latitude);
        setLng(loc.coords.longitude);
      } catch {
        setLocationError('위치를 가져올 수 없어요. 다시 시도해주세요.');
      } finally {
        setRequesting(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title="응급 · 24시 병원"
        back
        actions={lat ? [{ icon: 'refresh-cw', label: '새로고침', onPress: () => refetch() }] : undefined}
      />

      {requesting ? (
        <LoadingSpinner label="위치를 확인하는 중" />
      ) : locationError ? (
        <EmptyState icon="map-pin" title="위치 정보 필요" description={locationError} tone="muted" />
      ) : isLoading ? (
        <LoadingSpinner label="주변 병원을 찾는 중" />
      ) : (
        <FlatList
          data={filteredHospitals}
          keyExtractor={(h) => h.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxl }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListHeaderComponent={
            lat ? (
              <View style={{ marginBottom: Spacing.md, gap: Spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <Chip label={`전체 ${counts.all}`} selected={filter === 'all'} onPress={() => setFilter('all')} />
                  <Chip label={`24시 ${counts.open24h}`} selected={filter === 'open24h'} onPress={() => setFilter('open24h')} />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 6,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: Spacing.xs,
                  }}
                >
                  <Feather name="info" size={12} color={Colors.text.tertiary} style={{ marginTop: 2 }} />
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, flex: 1 }}>
                    영업 여부는 병원명 표기 기준 추정이에요. 방문 전 전화로 영업 시간을 꼭 확인해주세요.
                  </Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="alert-circle"
              title={filter === 'open24h' ? '주변에 24시 표기 병원이 없어요' : '주변에 응급 병원이 없어요'}
              description={filter === 'open24h' ? '"전체"로 보거나 일반 응급 병원에 전화해 영업 여부를 확인해주세요' : '조금 더 넓은 지역을 검색해보세요'}
              tone="muted"
              action={filter === 'open24h' ? { label: '전체 보기', onPress: () => setFilter('all') } : undefined}
            />
          }
          renderItem={({ item }) => <HospitalCard hospital={item} open24h={is24hHospital(item.name)} />}
        />
      )}
    </SafeAreaView>
  );
}
