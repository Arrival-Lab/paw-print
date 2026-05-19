import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import SectionHeader from '../../../shared/components/SectionHeader';
import { useRecentDiaries } from '../../diary/hooks/useRecentDiaries';
import { useRecords } from '../../record/hooks/useRecords';
import { useMetrics } from '../../metric/hooks/useMetrics';
import type { MetricType, Metric } from '../../metric/api/metricApi';

interface Props { petId: number }

/**
 * 펫이 선택된 상태에서 홈에 추가로 보여지는 컨텐츠 — 최근 다이어리/진료/체중.
 * 각 섹션 더보기는 records 화면의 해당 sub tab 으로 이동.
 */
export default function SelectedPetExtras({ petId }: Props) {
  return (
    <View style={{ gap: Spacing.xl, marginTop: Spacing.xl }}>
      <RecentDiariesSection petId={petId} />
      <RecentMetricsSection petId={petId} />
      <RecentRecordsSection petId={petId} />
    </View>
  );
}

function RecentDiariesSection({ petId }: { petId: number }) {
  const { data: diaries } = useRecentDiaries(petId, { limit: 3 });

  return (
    <View>
      <SectionHeader
        title="최근 다이어리"
        action={{ label: '더보기', onPress: () => router.push('/diary') }}
      />
      <View style={{ marginTop: Spacing.sm }}>
        {diaries.length === 0 ? (
          <EmptyHint text="아직 다이어리가 없어요" />
        ) : (
          diaries.map((d) => {
            const dt = new Date(d.diaryDate);
            return (
              <SimpleListRow
                key={d.id}
                month={dt.getMonth() + 1}
                day={dt.getDate()}
                title={d.title ?? d.content ?? '제목 없음'}
                onPress={() => router.push({ pathname: '/diary/[id]', params: { id: d.id } } as any)}
              />
            );
          })
        )}
      </View>
    </View>
  );
}

function RecentRecordsSection({ petId }: { petId: number }) {
  const { data } = useRecords(petId);
  const records = data?.pages?.[0]?.content?.slice(0, 3) ?? [];

  return (
    <View>
      <SectionHeader
        title="최근 진료"
        action={{
          label: '더보기',
          onPress: () => router.push({ pathname: '/(tabs)/records', params: { tab: 'records' } }),
        }}
      />
      <View style={{ marginTop: Spacing.sm }}>
        {records.length === 0 ? (
          <EmptyHint text="진료 기록이 없어요" />
        ) : (
          records.map((r) => {
            const dt = new Date(r.visitedAt);
            return (
              <SimpleListRow
                key={r.id}
                month={dt.getMonth() + 1}
                day={dt.getDate()}
                title={r.hospitalName ?? r.symptoms ?? '진료 기록'}
                onPress={() =>
                  router.push({ pathname: '/records/[id]', params: { id: r.id, petId } } as any)
                }
              />
            );
          })
        )}
      </View>
    </View>
  );
}

function SimpleListRow({
  month, day, title, subtitle, onPress,
}: {
  month: number;
  day: number;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const Colors = useColors();
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.lg,
          paddingVertical: Spacing.md,
        }}
      >
        <View style={{ alignItems: 'center', minWidth: 40 }}>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>
            {month}월
          </Text>
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
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.secondary,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
      </View>
    </TouchableOpacity>
  );
}

const METRIC_LABEL: Record<MetricType, string> = {
  WEIGHT: '체중',
  BUN: 'BUN',
  CREATININE: '크레아티닌',
  CUSTOM: '커스텀',
};

const METRIC_DEFAULT_UNIT: Record<MetricType, string> = {
  WEIGHT: 'kg',
  BUN: 'mg/dL',
  CREATININE: 'mg/dL',
  CUSTOM: '',
};

function RecentMetricsSection({ petId }: { petId: number }) {
  const { data } = useMetrics(petId);
  const firstPage = data?.pages?.[0] as unknown as { content?: Metric[] } | undefined;
  const metrics: Metric[] = (firstPage?.content ?? []).slice(0, 3);

  return (
    <View>
      <SectionHeader
        title="최근 수치"
        action={{
          label: '더보기',
          onPress: () => router.push({ pathname: '/(tabs)/records', params: { tab: 'metrics' } }),
        }}
      />
      <View style={{ marginTop: Spacing.sm }}>
        {metrics.length === 0 ? (
          <EmptyHint text="기록된 수치가 없어요" />
        ) : (
          metrics.map((m) => {
            const label = m.metricName ?? METRIC_LABEL[m.metricType];
            const unit = m.unit ?? METRIC_DEFAULT_UNIT[m.metricType];
            const dt = new Date(m.measuredAt);
            return (
              <SimpleListRow
                key={m.id}
                month={dt.getMonth() + 1}
                day={dt.getDate()}
                title={`${label} ${m.value}${unit}`}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/records', params: { tab: 'metrics' } })
                }
              />
            );
          })
        )}
      </View>
    </View>
  );
}

function EmptyHint({ text }: { text: string }) {
  const Colors = useColors();
  return (
    <Text
      style={{
        ...Typography.preset.body,
        color: Colors.text.tertiary,
        textAlign: 'center',
        paddingVertical: Spacing.md,
      }}
    >
      {text}
    </Text>
  );
}
