import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { HospitalCard } from '../features/hospital/components/HospitalCard';
import { useEmergencyHospitals, useNearbyHospitals } from '../features/hospital/hooks/useHospital';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import Chip from '../shared/components/Chip';
import ExoticPetBanner from '../features/hospital/components/ExoticPetBanner';
import { usePets } from '../features/pet/hooks/usePets';
import { usePetFilterStore } from '../shared/store/petFilterStore';
import type { Pet } from '../features/pet/api/petApi';

type Filter = 'all' | 'open24h';
type HospitalMode = 'emergency' | 'nearby';

// 백엔드가 영업시간을 제공하지 않으므로 병원명 키워드로 24시 운영 여부 추정.
const OPEN_24H_KEYWORDS = ['24시', '24H', '24h'];
function is24hHospital(name: string): boolean {
  return OPEN_24H_KEYWORDS.some((k) => name.includes(k));
}

export default function HospitalScreen() {
  const Colors = useColors();
  const params = useLocalSearchParams<{ mode?: HospitalMode }>();
  const mode: HospitalMode = params.mode === 'nearby' ? 'nearby' : 'emergency';

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const hour = new Date().getHours();
  const isLateNight = hour >= 22 || hour < 6;

  // emergency 모드에선 새벽이면 기본 필터를 '24시 우선' 으로 자동 전환.
  useEffect(() => {
    if (mode === 'emergency' && isLateNight) setFilter('open24h');
  }, [isLateNight, mode]);

  const emergencyQuery = useEmergencyHospitals(mode === 'emergency' ? lat : null, mode === 'emergency' ? lng : null);
  const nearbyQuery = useNearbyHospitals(mode === 'nearby' ? lat : null, mode === 'nearby' ? lng : null);
  const { data: hospitals = [], isLoading, refetch } = mode === 'emergency' ? emergencyQuery : nearbyQuery;

  const filteredHospitals = useMemo(() => {
    const list = hospitals as unknown as { id: string; name: string }[];
    if (filter === 'open24h') return (list as any[]).filter((h: any) => is24hHospital(h.name));
    return list as any[];
  }, [hospitals, filter]);

  const counts = useMemo(() => {
    const list = (hospitals as unknown as any[]) ?? [];
    return {
      all: list.length,
      open24h: list.filter((h: any) => is24hHospital(h.name)).length,
    };
  }, [hospitals]);

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

  const headerTitle = mode === 'emergency' ? '응급 · 24시 병원' : '동물병원 찾기';
  const radiusLabel = mode === 'emergency' ? '5km' : '3km';

  // 특수동물 펫이 보이면 검색 안내 배너 노출 — 선택된 펫 우선, 없으면 보유 펫 중 첫 특수동물.
  const { data: pets = [] as Pet[] } = usePets();
  const selectedPetId = usePetFilterStore((s) => s.selectedPetId);
  const exoticSpecies = useMemo<Pet['species'] | null>(() => {
    const list = (pets as unknown as Pet[]) ?? [];
    const isExotic = (s: Pet['species']) =>
      s === 'BIRD' || s === 'REPTILE' || s === 'SMALL_ANIMAL' || s === 'OTHER';
    const selected = selectedPetId ? list.find((p) => p.id === selectedPetId) : null;
    if (selected && isExotic(selected.species)) return selected.species;
    const exotic = list.find((p) => isExotic(p.species));
    return exotic?.species ?? null;
  }, [pets, selectedPetId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title={headerTitle}
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
          keyExtractor={(h: any) => h.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxl }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListHeaderComponent={
            lat ? (
              <View style={{ marginBottom: Spacing.md, gap: Spacing.sm }}>
                {exoticSpecies ? <ExoticPetBanner species={exoticSpecies} /> : null}
                {/* emergency 모드에서만 24시 칩 노출 — nearby 는 일반 검색이므로 의미 약함 */}
                {mode === 'emergency' ? (
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <Chip label={`전체 ${counts.all}`} selected={filter === 'all'} onPress={() => setFilter('all')} />
                    <Chip label={`24시 ${counts.open24h}`} selected={filter === 'open24h'} onPress={() => setFilter('open24h')} />
                  </View>
                ) : (
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                    내 위치 기준 반경 {radiusLabel} · {counts.all}곳
                  </Text>
                )}
                {mode === 'emergency' ? (
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
                ) : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="alert-circle"
              title={
                mode === 'emergency' && filter === 'open24h'
                  ? '주변에 24시 표기 병원이 없어요'
                  : '주변에 동물병원이 없어요'
              }
              description={
                mode === 'emergency' && filter === 'open24h'
                  ? '"전체"로 보거나 일반 응급 병원에 전화해 영업 여부를 확인해주세요'
                  : '조금 더 넓은 지역을 검색해보세요'
              }
              tone="muted"
              action={
                mode === 'emergency' && filter === 'open24h'
                  ? { label: '전체 보기', onPress: () => setFilter('all') }
                  : undefined
              }
            />
          }
          renderItem={({ item }) => (
            <HospitalCard hospital={item} open24h={is24hHospital(item.name)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
