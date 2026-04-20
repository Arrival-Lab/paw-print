import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Colors } from '../../../constants/colors';
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

function dDayColor(dDay: number | null): string {
  if (dDay === null) return Colors.text.tertiary;
  if (dDay <= 0) return Colors.status.error;
  if (dDay <= 7) return Colors.status.warning;
  return Colors.primary;
}

export function VaccineCard({ vaccine, onToggleAlert, onDelete, canEnableAlert }: Props) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-border">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-text-primary flex-1" numberOfLines={1}>
          {vaccine.vaccineName}
        </Text>
        {vaccine.dDay !== null && (
          <View
            className="px-2 py-1 rounded-full ml-2"
            style={{ backgroundColor: `${dDayColor(vaccine.dDay)}20` }}>
            <Text className="text-xs font-bold" style={{ color: dDayColor(vaccine.dDay) }}>
              {dDayLabel(vaccine.dDay)}
            </Text>
          </View>
        )}
      </View>

      <Text className="text-sm text-text-secondary mb-1">
        접종일: {vaccine.vaccinatedAt}
      </Text>
      {vaccine.nextVaccineAt && (
        <Text className="text-sm text-text-secondary mb-3">
          다음 접종: {vaccine.nextVaccineAt}
        </Text>
      )}
      {vaccine.notes && (
        <Text className="text-sm text-text-tertiary mb-3" numberOfLines={2}>
          {vaccine.notes}
        </Text>
      )}

      <View className="flex-row items-center justify-between pt-2 border-t border-border">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm text-text-secondary">알림</Text>
          <Switch
            value={vaccine.alertEnabled}
            onValueChange={(val) => {
              if (val && !canEnableAlert) return;
              onToggleAlert(vaccine.id, val);
            }}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>
        <TouchableOpacity onPress={() => onDelete(vaccine.id)} hitSlop={8}>
          <Text className="text-sm text-status-error">삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
