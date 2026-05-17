import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import type { Hospital } from '../api/hospitalApi';

interface Props {
  hospital: Hospital;
  /** 병원명에 "24시" 표기가 있으면 true. true 면 카드 좌측에 빨간 24시 뱃지 표시. */
  open24h?: boolean;
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

export function HospitalCard({ hospital, open24h = false }: Props) {
  const Colors = useColors();

  const handleCall = () => {
    if (hospital.phone) Linking.openURL(`tel:${hospital.phone}`);
  };

  // 카카오맵 웹 링크 — 앱 미설치 환경에서도 브라우저로 fallback.
  // https://apis.map.kakao.com/web/guide/#bigwaypointurl
  const handleOpenMap = () => {
    const url = `https://map.kakao.com/link/map/${encodeURIComponent(hospital.name)},${hospital.lat},${hospital.lng}`;
    Linking.openURL(url);
  };

  return (
    <View
      style={{
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: open24h ? Colors.status.error : Colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 }}>
        {open24h ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              paddingVertical: 2,
              paddingHorizontal: 6,
              borderRadius: Spacing.borderRadius.sm,
              backgroundColor: Colors.status.error,
            }}
          >
            <Feather name="clock" size={10} color={Colors.white} />
            <Text style={{ fontSize: Typography.size.xxs, fontWeight: Typography.weight.bold, color: Colors.white }}>
              24시
            </Text>
          </View>
        ) : null}
        <Text
          style={{ ...Typography.preset.bodyMedium, fontWeight: Typography.weight.bold, color: Colors.text.primary, flex: 1 }}
          numberOfLines={1}
        >
          {hospital.name}
        </Text>
        <Text style={{ ...Typography.preset.caption, fontWeight: Typography.weight.semibold, color: Colors.primaryDark }}>
          {formatDistance(hospital.distance)}
        </Text>
      </View>
      <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginBottom: Spacing.md }} numberOfLines={1}>
        {hospital.address}
      </Text>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {hospital.phone ? (
          <TouchableOpacity
            onPress={handleCall}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.xs,
              backgroundColor: Colors.status.success,
              borderRadius: Spacing.borderRadius.md,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.md,
            }}
          >
            <Feather name="phone" size={13} color={Colors.white} />
            <Text style={{ ...Typography.preset.caption, color: Colors.white, fontWeight: Typography.weight.bold }}>
              {hospital.phone}
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.xs,
              backgroundColor: Colors.surface,
              borderRadius: Spacing.borderRadius.md,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.md,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Feather name="phone-off" size={13} color={Colors.text.tertiary} />
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>전화번호 없음</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={handleOpenMap}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.xs,
            backgroundColor: Colors.primaryLight,
            borderRadius: Spacing.borderRadius.md,
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
          }}
        >
          <Feather name="map" size={13} color={Colors.primaryDark} />
          <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.bold }}>
            지도
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
