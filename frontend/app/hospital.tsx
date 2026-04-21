import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { HospitalCard } from '../features/hospital/components/HospitalCard';
import { useEmergencyHospitals } from '../features/hospital/hooks/useHospital';
import { Colors, Spacing, Typography } from '../constants';

export default function HospitalScreen() {
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
    <SafeAreaView className="flex-1 bg-background">
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.lg,
          fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          응급/24시 병원 찾기
        </Text>
        {lat && (
          <TouchableOpacity onPress={() => refetch()} hitSlop={8}>
            <Feather name="refresh-cw" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {requesting ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={{ marginTop: Spacing.md, color: Colors.text.secondary, fontSize: Typography.size.sm }}>
            위치를 확인하는 중...
          </Text>
        </View>
      ) : locationError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
          <Feather name="map-pin" size={48} color={Colors.text.disabled} />
          <Text style={{ marginTop: Spacing.lg, fontSize: Typography.size.md,
            color: Colors.text.secondary, textAlign: 'center' }}>
            {locationError}
          </Text>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={{ marginTop: Spacing.md, color: Colors.text.secondary, fontSize: Typography.size.sm }}>
            주변 병원을 찾는 중...
          </Text>
        </View>
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={(h) => h.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxl }}
          ListHeaderComponent={
            lat ? (
              <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary,
                marginBottom: Spacing.md }}>
                현재 위치 기준 반경 5km 내 병원 {hospitals.length}개
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: Spacing.xxxl }}>
              <Feather name="alert-circle" size={40} color={Colors.text.disabled} />
              <Text style={{ marginTop: Spacing.md, fontSize: Typography.size.md,
                color: Colors.text.secondary, textAlign: 'center' }}>
                주변에 24시 병원이 없어요
              </Text>
            </View>
          }
          renderItem={({ item }) => <HospitalCard hospital={item} />}
        />
      )}
    </SafeAreaView>
  );
}
