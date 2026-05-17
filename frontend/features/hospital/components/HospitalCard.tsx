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
            alignSelf: 'flex-start',
          }}
        >
          <Feather name="phone" size={13} color={Colors.white} />
          <Text style={{ ...Typography.preset.caption, color: Colors.white, fontWeight: Typography.weight.bold }}>
            {hospital.phone}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={{ ...Typography.preset.caption, color: Colors.text.disabled }}>전화번호 없음</Text>
      )}
    </View>
  );
}
