import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { HospitalCard } from '../features/hospital/components/HospitalCard';
import HospitalMapView, { type MapCenter } from '../features/hospital/components/HospitalMapView';
import HospitalSearchBar from '../features/hospital/components/HospitalSearchBar';
import { useEmergencyHospitals, useNearbyHospitals, useGeocode } from '../features/hospital/hooks/useHospital';
import { Spacing, Typography, Elevation } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import EmptyState from '../shared/components/EmptyState';
import Chip from '../shared/components/Chip';
import ExoticPetBanner from '../features/hospital/components/ExoticPetBanner';
import { usePets } from '../features/pet/hooks/usePets';
import { usePetFilterStore } from '../shared/store/petFilterStore';
import { getLastLocation, setLastLocation } from '../shared/utils/storage';
import type { Pet } from '../features/pet/api/petApi';
import type { Hospital } from '../features/hospital/api/hospitalApi';

type Filter = 'all' | 'open24h';
type HospitalMode = 'emergency' | 'nearby';

// GPS 권한 거부 + 캐시된 위치도 없을 때만 쓰는 최후 기본 중심 — 서울시청.
const DEFAULT_CENTER: MapCenter = { lat: 37.5663, lng: 126.9779 };
// 콜드 스타트 첫 중심 — 마지막 성공 위치가 있으면 거기서, 없으면 서울시청.
// 한 번이라도 위치를 잡은 적 있으면 그 뒤엔 서울이 안 떠 "서울역으로 나옴" 문제 해소.
const INITIAL_CENTER: MapCenter = getLastLocation() ?? DEFAULT_CENTER;
// 지도를 이만큼 이상 움직이면 "이 지역에서 검색" 노출 (km).
const RESEARCH_THRESHOLD_KM = 0.3;

// 백엔드가 영업시간을 제공하지 않으므로 병원명 키워드로 24시 운영 여부 추정.
const OPEN_24H_KEYWORDS = ['24시', '24H', '24h'];
function is24hHospital(name: string): boolean {
  return OPEN_24H_KEYWORDS.some((k) => name.includes(k));
}

function distanceKm(a: MapCenter, b: MapCenter): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function HospitalScreen() {
  const Colors = useColors();
  const params = useLocalSearchParams<{ mode?: HospitalMode }>();
  const mode: HospitalMode = params.mode === 'nearby' ? 'nearby' : 'emergency';

  // 검색 기준 좌표 (쿼리에 사용) — 기본값으로 시작해 GPS/검색으로 갱신.
  const [searchCenter, setSearchCenter] = useState<MapCenter>(INITIAL_CENTER);
  // 지도에 panTo 를 트리거하는 좌표 — GPS 도착·지역검색·현재위치 복귀 시 갱신.
  const [programmaticCenter, setProgrammaticCenter] = useState<MapCenter>(INITIAL_CENTER);
  // 좌표가 직전과 같아도(드래그로 뷰포트만 옮긴 뒤 같은 중심으로 복귀) 지도를 다시 움직이게 하는 트리거.
  const [moveNonce, setMoveNonce] = useState(0);
  // 사용자가 드래그/줌으로 멈춘 현재 지도 중심.
  const [viewportCenter, setViewportCenter] = useState<MapCenter | null>(null);
  const [gpsCenter, setGpsCenter] = useState<MapCenter | null>(null);
  // 첫 진입 시 내 위치를 찾는 중인지 — 인디케이터 노출용.
  const [locating, setLocating] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 핀 탭으로 선택된 병원을 리스트 맨 위로 띄울지 — 핀 탭일 때만 true, 카드 탭/검색 시 false.
  const [floatSelectedTop, setFloatSelectedTop] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [exoticDismissed, setExoticDismissed] = useState(false);
  // 사용자가 직접 검색/이동했으면 GPS 도착해도 자동 이동하지 않음.
  const userInteractedRef = useRef(false);

  const hour = new Date().getHours();
  const isLateNight = hour >= 22 || hour < 6;

  useEffect(() => {
    if (mode === 'emergency' && isLateNight) setFilter('open24h');
  }, [isLateNight, mode]);

  const emergencyQuery = useEmergencyHospitals(mode === 'emergency' ? searchCenter.lat : null, mode === 'emergency' ? searchCenter.lng : null);
  const nearbyQuery = useNearbyHospitals(mode === 'nearby' ? searchCenter.lat : null, mode === 'nearby' ? searchCenter.lng : null);
  const { data: hospitals = [], isLoading, isFetching, refetch } = mode === 'emergency' ? emergencyQuery : nearbyQuery;

  const geocode = useGeocode();

  // 지도를 좌표로 이동. 좌표가 직전과 같아도 nonce 로 강제 재이동.
  // 프로그램적 이동은 region 이벤트가 안 오므로(suppressIdle) viewport 도 직접 맞춰
  // "이 지역에서 검색" 버튼이 잘못 남아있지 않게 한다.
  const moveMap = useCallback((c: MapCenter) => {
    setProgrammaticCenter(c);
    setViewportCenter(c);
    setMoveNonce((n) => n + 1);
  }, []);

  // GPS 1회 획득 — 권한 거부돼도 화면은 막지 않고 기본 지역으로 동작.
  // 캐시된 마지막 위치로 먼저 즉시 이동(픽스까지 ~5초 기다리지 않게) → 정확한 위치로 보정.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocating(false);
          return;
        }
        const last = await Location.getLastKnownPositionAsync();
        if (last && !userInteractedRef.current) {
          const c = { lat: last.coords.latitude, lng: last.coords.longitude };
          setGpsCenter(c);
          setSearchCenter(c);
          moveMap(c);
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const c = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setGpsCenter(c);
        setLastLocation(c); // 다음 콜드 스타트가 이 지역에서 시작하도록 캐시
        if (!userInteractedRef.current) {
          setSearchCenter(c);
          moveMap(c);
        }
      } catch {
        /* 위치 실패 — 기본 중심 유지 */
      } finally {
        setLocating(false);
      }
    })();
  }, [moveMap]);

  const hospitalList = hospitals as unknown as Hospital[];
  const filteredHospitals = useMemo(() => {
    if (filter === 'open24h') return hospitalList.filter((h) => is24hHospital(h.name));
    return hospitalList;
  }, [hospitalList, filter]);

  const counts = useMemo(
    () => ({ all: hospitalList.length, open24h: hospitalList.filter((h) => is24hHospital(h.name)).length }),
    [hospitalList],
  );

  // 지도 마커는 필터 적용 결과만 표시 (리스트와 일치).
  const markers = useMemo(
    () => filteredHospitals.map((h) => ({ id: h.id, lat: h.lat, lng: h.lng, name: h.name })),
    [filteredHospitals],
  );

  // 핀으로 선택한 병원은 리스트 맨 위로 — 멀리 있어도 바로 눈에 띄게.
  const displayedHospitals = useMemo(() => {
    if (!floatSelectedTop || !selectedId) return filteredHospitals;
    const sel = filteredHospitals.find((h) => h.id === selectedId);
    if (!sel) return filteredHospitals;
    return [sel, ...filteredHospitals.filter((h) => h.id !== selectedId)];
  }, [filteredHospitals, floatSelectedTop, selectedId]);

  const headerTitle = mode === 'emergency' ? '응급 · 24시 병원' : '동물병원 찾기';

  // 특수동물 펫이 보이면 검색 안내 배너 노출.
  const { data: pets = [] as Pet[] } = usePets();
  const selectedPetId = usePetFilterStore((s) => s.selectedPetId);
  const exoticSpecies = useMemo<Pet['species'] | null>(() => {
    const list = (pets as unknown as Pet[]) ?? [];
    const isExotic = (s: Pet['species']) => s === 'BIRD' || s === 'REPTILE' || s === 'SMALL_ANIMAL' || s === 'OTHER';
    const selected = selectedPetId ? list.find((p) => p.id === selectedPetId) : null;
    if (selected && isExotic(selected.species)) return selected.species;
    const exotic = list.find((p) => isExotic(p.species));
    return exotic?.species ?? null;
  }, [pets, selectedPetId]);

  // ── 지도 인터랙션 ────────────────────────────────────────────────
  const sheetRef = useRef<BottomSheet>(null);
  const listRef = useRef<any>(null);
  const snapPoints = useMemo(() => ['14%', '45%', '88%'], []);

  const handleRegionChange = useCallback((c: MapCenter) => {
    userInteractedRef.current = true;
    setLocating(false);
    setViewportCenter(c);
  }, []);

  // 핀 탭 → 선택 병원을 리스트 맨 위로 올리고 시트를 펼친 뒤 최상단으로 스크롤.
  // 재정렬로 selected 가 index 0 이 되므로 scrollToOffset(0) 만으로 확실히 보인다 (측정 타이밍 무관).
  const handleMarkerTap = useCallback((id: string) => {
    setSelectedId(id);
    setFloatSelectedTop(true);
    sheetRef.current?.snapToIndex(1);
    setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 80);
  }, []);

  // 카드 탭은 재정렬 없이 selectedId 만 갱신 — 지도는 selectedId 효과의 __selectMarker 가
  // panTo + 이름 버블로 처리. (programmaticCenter 안 건드려서 "이 지역 검색" 오작동 없음)
  const handleCardPress = useCallback((h: Hospital) => {
    setSelectedId(h.id);
    setFloatSelectedTop(false);
  }, []);

  const handleRegionSearch = useCallback((query: string) => {
    userInteractedRef.current = true;
    setLocating(false);
    geocode.mutate(query, {
      onSuccess: (res) => {
        setSearchCenter({ lat: res.lat, lng: res.lng });
        moveMap({ lat: res.lat, lng: res.lng });
        setSelectedId(null);
        setFloatSelectedTop(false);
      },
      onError: () => {
        Alert.alert('검색 결과 없음', '그 지역을 찾지 못했어요. 동·역·지역 이름으로 다시 검색해보세요.');
      },
    });
  }, [geocode, moveMap]);

  const searchThisArea = useCallback(() => {
    if (!viewportCenter) return;
    setSearchCenter(viewportCenter);
    setSelectedId(null);
    setFloatSelectedTop(false);
  }, [viewportCenter]);

  const recenterToGps = useCallback(() => {
    if (!gpsCenter) return;
    setSearchCenter(gpsCenter);
    moveMap(gpsCenter);
    setSelectedId(null);
    setFloatSelectedTop(false);
  }, [gpsCenter, moveMap]);

  // "이 지역에서 검색" 노출 조건 — 현재 지도 중심이 검색 기준에서 충분히 멀어졌을 때.
  const showSearchThisArea = useMemo(
    () => viewportCenter != null && distanceKm(viewportCenter, searchCenter) > RESEARCH_THRESHOLD_KM,
    [viewportCenter, searchCenter],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title={headerTitle}
        back
        hideEmergency
        actions={[{ icon: 'refresh-cw', label: '새로고침', onPress: () => refetch() }]}
      />

      <View style={{ flex: 1 }}>
        <HospitalMapView
          center={programmaticCenter}
          moveNonce={moveNonce}
          markers={markers}
          selectedId={selectedId}
          onRegionChange={handleRegionChange}
          onMarkerTap={handleMarkerTap}
        />

        {/* 상단 지역 검색바 */}
        <View style={{ position: 'absolute', top: Spacing.md, left: Spacing.xl, right: Spacing.xl }}>
          <HospitalSearchBar onSubmit={handleRegionSearch} loading={geocode.isPending} />
        </View>

        {/* 내 위치 찾는 중 — 첫 진입 GPS 픽스 동안. 사용자가 "내 위치로 가는 중"임을 인지하게. */}
        {locating ? (
          <View style={{ position: 'absolute', top: 72, left: 0, right: 0, alignItems: 'center' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.sm,
                backgroundColor: Colors.surfaceElevated,
                borderRadius: Spacing.borderRadius.full,
                paddingVertical: Spacing.sm,
                paddingHorizontal: Spacing.lg,
                ...Elevation.floating,
              }}
            >
              <ActivityIndicator size="small" color={Colors.primaryDark} />
              <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.bold }}>
                내 위치를 찾는 중…
              </Text>
            </View>
          </View>
        ) : null}

        {/* "이 지역에서 검색" — 지도 이동 시 노출 (위치 찾는 중엔 숨김) */}
        {showSearchThisArea && !locating ? (
          <View style={{ position: 'absolute', top: 72, left: 0, right: 0, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={searchThisArea}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
                backgroundColor: Colors.surfaceElevated,
                borderRadius: Spacing.borderRadius.full,
                paddingVertical: Spacing.sm,
                paddingHorizontal: Spacing.lg,
                ...Elevation.floating,
              }}
            >
              <Feather name="refresh-cw" size={14} color={Colors.primaryDark} />
              <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.bold }}>
                이 지역에서 검색
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 현재 위치로 이동 */}
        {gpsCenter ? (
          <TouchableOpacity
            onPress={recenterToGps}
            activeOpacity={0.85}
            style={{
              position: 'absolute',
              right: Spacing.xl,
              bottom: '46%',
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.surfaceElevated,
              ...Elevation.floating,
            }}
          >
            <Feather name="navigation" size={18} color={Colors.primaryDark} />
          </TouchableOpacity>
        ) : null}

        {/* 드래그 가능한 결과 리스트 */}
        <BottomSheet
          ref={sheetRef}
          index={1}
          snapPoints={snapPoints}
          backgroundStyle={{ backgroundColor: Colors.background }}
          handleIndicatorStyle={{ backgroundColor: Colors.border }}
        >
          <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm, gap: Spacing.sm }}>
            {exoticSpecies && !exoticDismissed ? (
              <ExoticPetBanner species={exoticSpecies} onDismiss={() => setExoticDismissed(true)} />
            ) : null}
            {mode === 'emergency' ? (
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Chip label={`전체 ${counts.all}`} selected={filter === 'all'} onPress={() => setFilter('all')} />
                <Chip label={`24시 ${counts.open24h}`} selected={filter === 'open24h'} onPress={() => setFilter('open24h')} />
              </View>
            ) : (
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                지도 중심 기준 · {counts.all}곳{isFetching ? ' · 검색 중…' : ''}
              </Text>
            )}
            {mode === 'emergency' ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                <Feather name="info" size={12} color={Colors.text.tertiary} style={{ marginTop: 2 }} />
                <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, flex: 1 }}>
                  영업 여부는 병원명 표기 기준 추정이에요. 방문 전 전화로 영업 시간을 꼭 확인해주세요.
                </Text>
              </View>
            ) : null}
          </View>

          <BottomSheetFlatList
            ref={listRef}
            data={displayedHospitals}
            keyExtractor={(h: Hospital) => h.id}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl }}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            ListEmptyComponent={
              isLoading ? (
                <EmptyState icon="search" title="병원을 찾는 중" description="잠시만 기다려주세요" tone="muted" />
              ) : (
                <EmptyState
                  icon="alert-circle"
                  title={
                    mode === 'emergency' && filter === 'open24h'
                      ? '이 지역에 24시 표기 병원이 없어요'
                      : '이 지역에 동물병원이 없어요'
                  }
                  description={
                    mode === 'emergency' && filter === 'open24h'
                      ? '"전체"로 보거나 지도를 옮겨 다시 검색해보세요'
                      : '지도를 옮기거나 다른 지역을 검색해보세요'
                  }
                  tone="muted"
                  action={
                    mode === 'emergency' && filter === 'open24h'
                      ? { label: '전체 보기', onPress: () => setFilter('all') }
                      : undefined
                  }
                />
              )
            }
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.9} onPress={() => handleCardPress(item)}>
                <HospitalCard hospital={item} open24h={is24hHospital(item.name)} selected={item.id === selectedId} />
              </TouchableOpacity>
            )}
          />
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
}
