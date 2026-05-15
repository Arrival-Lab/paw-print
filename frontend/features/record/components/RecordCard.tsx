import { View, Text } from 'react-native';
import Card from '../../../shared/components/Card';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import type { MedicalRecordSummary } from '../api/recordApi';
import { formatDate } from '../../../shared/utils/format';

interface RecordCardProps {
  record: MedicalRecordSummary;
  onPress?: () => void;
}

export default function RecordCard({ record, onPress }: RecordCardProps) {
  const Colors = useColors();
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row' }}>
        {/* 좌측 강조 바 */}
        <View
          style={{
            width: 4,
            borderRadius: 2,
            backgroundColor: Colors.primary,
            marginRight: Spacing.md,
          }}
        />

        {/* 본문 */}
        <View style={{ flex: 1, gap: Spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: Typography.size.md,
                fontWeight: Typography.weight.semibold,
                color: Colors.text.primary,
              }}
            >
              {record.hospitalName ?? '병원명 없음'}
            </Text>
            <Text
              style={{
                fontSize: Typography.size.sm,
                color: Colors.text.secondary,
              }}
            >
              {formatDate(record.visitedAt)}
            </Text>
          </View>

          {record.symptoms && (
            <Text
              numberOfLines={1}
              style={{
                fontSize: Typography.size.sm,
                color: Colors.text.secondary,
              }}
            >
              {record.symptoms}
            </Text>
          )}

          {record.attachmentCount > 0 && (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: Colors.secondaryLight,
                borderRadius: Spacing.borderRadius.sm,
                paddingVertical: 2,
                paddingHorizontal: Spacing.sm,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.size.xs,
                  color: Colors.secondary,
                  fontWeight: Typography.weight.medium,
                }}
              >
                사진 {record.attachmentCount}장
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}
