import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import type { MedicalRecordSummary } from '../api/recordApi';
import { formatDate } from '../../../shared/utils/format';

interface RecordCardProps {
  record: MedicalRecordSummary;
  onPress?: () => void;
  /** 길게 눌렀을 때 — 보통 삭제 ActionSheet 노출용. */
  onLongPress?: () => void;
  /** 타임라인 안에서 쓰는 경우 날짜를 외부에서 표시하므로 여기선 숨김 */
  hideDate?: boolean;
  /** 전체 모드(여러 펫 섞임)일 때 어느 펫의 기록인지 표시. */
  petName?: string | null;
}

export default function RecordCard({ record, onPress, onLongPress, hideDate, petName }: RecordCardProps) {
  const Colors = useColors();
  const body = (
    <View style={{ flex: 1, gap: 2 }}>
      {petName ? (
        <Text
          style={{
            ...Typography.preset.caption,
            color: Colors.primaryDark,
            fontWeight: Typography.weight.semibold,
          }}
        >
          {petName}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm }}>
        <Text
          style={{
            ...Typography.preset.body,
            fontWeight: Typography.weight.semibold,
            color: Colors.text.primary,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {record.hospitalName ?? '병원명 없음'}
        </Text>
        {hideDate ? null : (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
            {formatDate(record.visitedAt)}
          </Text>
        )}
      </View>
      {record.symptoms ? (
        <Text
          numberOfLines={2}
          style={{ ...Typography.preset.caption, color: Colors.text.secondary }}
        >
          {record.symptoms}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2, flexWrap: 'wrap' }}>
        {record.attachmentCount > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="paperclip" size={11} color={Colors.text.tertiary} />
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
              사진 {record.attachmentCount}장
            </Text>
          </View>
        ) : null}
        {/* 진료일정과 연결된 기록이면 작은 calendar chip */}
        {record.appointmentId ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: Spacing.borderRadius.sm,
              backgroundColor: Colors.primaryLight,
            }}
          >
            <Feather name="calendar" size={10} color={Colors.primaryDark} />
            <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}>
              예약 연결
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        activeOpacity={0.7}
        style={{ paddingVertical: Spacing.sm }}
      >
        {body}
      </TouchableOpacity>
    );
  }
  return <View style={{ paddingVertical: Spacing.sm }}>{body}</View>;
}
