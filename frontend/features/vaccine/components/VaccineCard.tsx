import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../../shared/hooks/useTheme';
import PremiumLock from '../../../shared/components/PremiumLock';
import { Config, Spacing, Typography } from '../../../constants';
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
    return Colors.primaryDark;
  };

  const meta: string[] = [];
  if (vaccine.vaccinatedAt) meta.push(`접종 ${vaccine.vaccinatedAt}`);
  if (vaccine.nextVaccineAt) meta.push(`다음 ${vaccine.nextVaccineAt}`);

  return (
    <View style={{ paddingVertical: Spacing.md, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <Text
          style={{
            ...Typography.preset.body,
            fontWeight: Typography.weight.semibold,
            color: Colors.text.primary,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {vaccine.vaccineName}
        </Text>
        {vaccine.dDay !== null && (
          <Text
            style={{
              ...Typography.preset.caption,
              color: dDayColor(vaccine.dDay),
              fontWeight: Typography.weight.bold,
            }}
          >
            {dDayLabel(vaccine.dDay)}
          </Text>
        )}
      </View>

      {meta.length > 0 ? (
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
          {meta.join(' · ')}
        </Text>
      ) : null}
      {vaccine.notes ? (
        <Text
          style={{ ...Typography.preset.caption, color: Colors.text.secondary }}
          numberOfLines={2}
        >
          {vaccine.notes}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: Spacing.xs,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="bell" size={12} color={vaccine.alertEnabled ? Colors.primaryDark : Colors.text.tertiary} />
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
            알림
          </Text>
          <Switch
            value={vaccine.alertEnabled}
            onValueChange={(val) => onToggleAlert(vaccine.id, val)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
          />
          {!canEnableAlert && !vaccine.alertEnabled ? (
            <PremiumLock
              size="sm"
              message={`무료 플랜은 예방접종 알림을 ${Config.freeMaxVaccineAlerts}개까지 설정할 수 있어요`}
            />
          ) : null}
        </View>
        <TouchableOpacity onPress={() => onDelete(vaccine.id)} hitSlop={Spacing.hitSlop}>
          <Feather name="trash-2" size={14} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
