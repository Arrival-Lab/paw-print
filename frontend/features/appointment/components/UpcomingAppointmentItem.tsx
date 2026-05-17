import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import type { AppointmentWithPet } from '../api/appointmentApi';

interface Props {
  appointment: AppointmentWithPet;
}

/** 홈 "오늘"/"다가오는" 섹션 카드. vaccine UpcomingItem 패턴과 짝. */
export default function UpcomingAppointmentItem({ appointment }: Props) {
  const Colors = useColors();
  const dDay = appointment.dDay;
  const label = dDay === 0 ? '오늘' : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`;
  const tone: 'warning' | 'primary' = dDay !== null && dDay <= 3 ? 'warning' : 'primary';

  const date = new Date(appointment.appointmentAt);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const ymd = `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;

  return (
    <Card variant="elevated" padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name="calendar" size={18} color={Colors.primaryDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
            {appointment.hospitalName || appointment.reason || '병원 예약'}
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
            {appointment.petName} · {ymd}
          </Text>
        </View>
        <Badge tone={tone}>{label}</Badge>
      </View>
    </Card>
  );
}
