import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { useColors } from '../../../shared/hooks/useTheme';
import PremiumLock from '../../../shared/components/PremiumLock';
import { Spacing } from '../../../constants';
import type { Vaccine } from '../api/vaccineApi';

interface Props {
  vaccine: Vaccine;
  onToggleAlert: (vaccineId: number, enabled: boolean) => void;
  onDelete: (vaccineId: number) => void;
  canEnableAlert: boolean;
}

function dDayLabel(dDay: number | null): string {
  if (dDay === null) return '';
  if (dDay === 0) return 'D-Day';
  if (dDay > 0) return `D-${dDay}`;
  return `D+${Math.abs(dDay)}`;
}

export function VaccineCard({ vaccine, onToggleAlert, onDelete, canEnableAlert }: Props) {
  const Colors = useColors();

  const dDayColor = (dDay: number | null): string => {
    if (dDay === null) return Colors.text.tertiary;
    if (dDay <= 0) return Colors.status.error;
    if (dDay <= 7) return Colors.status.warning;
    return Colors.primary;
  };

  return (
    <View
      style={{
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text.primary, flex: 1 }} numberOfLines={1}>
          {vaccine.vaccineName}
        </Text>
        {vaccine.dDay !== null && (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 9999,
              marginLeft: 8,
              backgroundColor: `${dDayColor(vaccine.dDay)}20`,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: dDayColor(vaccine.dDay) }}>
              {dDayLabel(vaccine.dDay)}
            </Text>
          </View>
        )}
      </View>

      <Text style={{ fontSize: 13, color: Colors.text.secondary, marginBottom: 2 }}>
        접종일: {vaccine.vaccinatedAt}
      </Text>
      {vaccine.nextVaccineAt ? (
        <Text style={{ fontSize: 13, color: Colors.text.secondary, marginBottom: 8 }}>
          다음 접종: {vaccine.nextVaccineAt}
        </Text>
      ) : null}
      {vaccine.notes ? (
        <Text style={{ fontSize: 13, color: Colors.text.tertiary, marginBottom: 8 }} numberOfLines={2}>
          {vaccine.notes}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Text style={{ fontSize: 13, color: Colors.text.secondary }}>알림</Text>
          <Switch
            value={vaccine.alertEnabled}
            onValueChange={(val) => onToggleAlert(vaccine.id, val)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
          />
          {/* 한도 도달했고 현재 카드의 알림은 꺼져 있을 때 — 잠금 표지 노출. */}
          {!canEnableAlert && !vaccine.alertEnabled ? (
            <PremiumLock
              size="sm"
              message="무료 플랜은 예방접종 알림을 2개까지 설정할 수 있어요"
            />
          ) : null}
        </View>
        <TouchableOpacity onPress={() => onDelete(vaccine.id)} hitSlop={8}>
          <Text style={{ fontSize: 13, color: Colors.status.error }}>삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
