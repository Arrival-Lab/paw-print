import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity } from 'react-native';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Badge from '../../../shared/components/Badge';
import type { AppointmentWithPet } from '../api/appointmentApi';

interface Props {
  appointment: AppointmentWithPet;
  onPress?: () => void;
}

/** 홈 "다가오는 일정" row — 좌측 큰 날짜 + 중간 제목/부제 + 우측 D-day. */
export default function UpcomingAppointmentItem({ appointment, onPress }: Props) {
  const Colors = useColors();
  const { t } = useTranslation();
  const dDay = appointment.dDay;
  const label = dDay === 0 ? t('appointment.today') : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`;
  const tone: 'warning' | 'primary' = dDay !== null && dDay <= 3 ? 'warning' : 'primary';

  const date = new Date(appointment.appointmentAt);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours < 12 ? t('appointment.am') : t('appointment.pm');
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const timeStr = t('appointment.timeAmPm', { ampm, time: `${h12}:${String(minutes).padStart(2, '0')}` });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        paddingVertical: Spacing.md,
      }}
    >
      <View style={{ alignItems: 'center', minWidth: 40 }}>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>{t('pet.monthShort', { month })}</Text>
        <Text
          style={{
            ...Typography.preset.h2,
            color: Colors.text.primary,
            fontWeight: Typography.weight.bold,
          }}
        >
          {day}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...Typography.preset.body,
            color: Colors.text.primary,
            fontWeight: Typography.weight.semibold,
          }}
        >
          {appointment.hospitalName || appointment.reason || t('appointment.fallbackTitle')}
        </Text>
        <Text
          style={{
            ...Typography.preset.caption,
            color: Colors.text.secondary,
            marginTop: 2,
          }}
        >
          {appointment.petName} · {timeStr}
        </Text>
      </View>
      <Badge tone={tone}>{label}</Badge>
    </TouchableOpacity>
  );
}
