import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { HospitalCard } from '../features/hospital/components/HospitalCard';
import { useEmergencyHospitals } from '../features/hospital/hooks/useHospital';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';

export default function HospitalScreen() {
  const Colors = useColors();
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(true);

  const { data: hospitals = [], isLoading, refetch } = useEmergencyHospitals(lat, lng);

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
          data={hospitals}
          keyExtractor={(h) => h.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxl }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListHeaderComponent={
            lat ? (
              <Text
                style={{
                  ...Typography.preset.bodySmall,
                  color: Colors.text.tertiary,
                  marginBottom: Spacing.md,
                }}
              >
                현재 위치 기준 반경 5km 내 병원 {hospitals.length}개
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="alert-circle"
              title="주변에 24시 병원이 없어요"
              description="조금 더 넓은 지역을 검색해보세요"
              tone="muted"
            />
          }
          renderItem={({ item }) => <HospitalCard hospital={item} />}
        />
      )}
    </SafeAreaView>
  );
}
