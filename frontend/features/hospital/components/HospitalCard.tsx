import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
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

  // 카카오맵 장소 상세 — 위치·진료시간·실시간 영업 여부가 한 페이지에 표시됨.
  // 외부 브라우저로 나가면 사용자가 앱을 떠나는 느낌이라 인앱 브라우저(SafariView/CustomTabs)로 띄움.
  const handleOpenPlaceDetail = async () => {
    if (!hospital.placeUrl) return;
    // 카카오 응답이 변조되어도 javascript:/data:/intent: 등 다른 스킴이 실행되지 않도록 화이트리스트.
    // 카카오 Local API place_url은 http로도 반환되는 경우가 있어 양쪽 허용.
    if (!/^https?:\/\/(place\.map\.kakao\.com|map\.kakao\.com)\//.test(hospital.placeUrl)) return;
    try {
      await WebBrowser.openBrowserAsync(hospital.placeUrl, {
        toolbarColor: Colors.background,
        controlsColor: Colors.text.accent,
        dismissButtonStyle: 'close',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch {
      Linking.openURL(hospital.placeUrl); // 인앱 브라우저 실패 시 외부 fallback
    }
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
              전화걸기
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
        {/* 지도(지번 주소만 노출) + 진료시간(카카오맵 장소 상세) 분리되어 있던 걸 통합 — 카카오맵 장소 페이지에
            위치/진료시간/실시간 영업 다 들어 있음. 라벨도 '상세보기'로 일반화. */}
        {hospital.placeUrl ? (
          <TouchableOpacity
            onPress={handleOpenPlaceDetail}
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
            <Feather name="info" size={13} color={Colors.primaryDark} />
            <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.bold }}>
              상세보기
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
