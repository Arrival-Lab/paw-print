import { View, Text, ScrollView, Image } from 'react-native';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import type { DiaryPhoto } from '../api/diaryApi';

interface Props {
  date: string;
  title: string | null;
  content: string | null;
  tags: string[];
  photos: DiaryPhoto[];
  petName?: string;
  petSpecies?: string;
  onEdit: () => void;
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

const SPECIES_PAW: Record<string, any> = {
  DOG: require('../../../assets/paws/dog.png'),
  CAT: require('../../../assets/paws/cat.png'),
  BIRD: require('../../../assets/paws/bird.png'),
  REPTILE: require('../../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../../assets/paws/small.png'),
  OTHER: require('../../../assets/paws/other.png'),
};

export default function DiaryReadView({ date, title, content, tags, photos, petName, petSpecies }: Props) {
  const Colors = useColors();
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const weekday = WEEKDAY_KO[d.getDay()];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xxxxl,
      }}
    >
      {/* 날짜 hero — 큰 일(day) + 작은 year·month·weekday + 우측 펫 칩 (Image #6 패턴) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm }}>
          <Text style={{ ...Typography.preset.display, color: Colors.primaryDark }}>{day}</Text>
          <Text
            style={{
              ...Typography.preset.body,
              color: Colors.text.secondary,
              fontWeight: Typography.weight.semibold,
            }}
          >
            {year}년 {month}월 · {weekday}요일
          </Text>
        </View>
        {petName ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: Spacing.md,
              paddingVertical: 4,
              borderRadius: Spacing.borderRadius.full,
              backgroundColor: Colors.primaryLight,
            }}
          >
            <Image
              source={SPECIES_PAW[petSpecies ?? 'OTHER'] ?? SPECIES_PAW.OTHER}
              style={{ width: 16, height: 16 }}
              resizeMode="contain"
            />
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.primaryDark,
                fontWeight: Typography.weight.bold,
              }}
            >
              {petName}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 제목 */}
      {title?.trim() ? (
        <Text
          style={{
            ...Typography.preset.heading,
            color: Colors.text.primary,
            fontWeight: Typography.weight.bold,
            marginTop: Spacing.xl,
          }}
        >
          {title}
        </Text>
      ) : null}

      {/* 본문 — 일기장 분위기, relaxed 줄간격 */}
      {content?.trim() ? (
        <Text
          style={{
            ...Typography.preset.body,
            color: Colors.text.primary,
            lineHeight: Typography.size.md * Typography.lineHeight.relaxed,
            marginTop: title?.trim() ? Spacing.md : Spacing.xl,
          }}
        >
          {content}
        </Text>
      ) : !title?.trim() ? (
        <Text
          style={{
            ...Typography.preset.body,
            color: Colors.text.tertiary,
            fontStyle: 'italic',
            marginTop: Spacing.xl,
          }}
        >
          (내용 없음)
        </Text>
      ) : null}

      {/* 사진 — 본문 흐름 안에 큰 와이드 사진 (Image #6 인라인 스타일) */}
      {photos.length > 0 ? (
        <View style={{ gap: Spacing.md, marginTop: Spacing.xl }}>
          {photos.map((p) => (
            <Image
              key={p.id}
              source={{ uri: p.photoUrl }}
              style={{
                width: '100%',
                aspectRatio: 4 / 3,
                borderRadius: Spacing.borderRadius.lg,
                backgroundColor: Colors.surface,
              }}
              resizeMode="cover"
            />
          ))}
        </View>
      ) : null}

      {/* 태그 */}
      {tags.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: Spacing.md,
            marginTop: Spacing.xl,
          }}
        >
          {tags.map((tag) => (
            <Text
              key={tag}
              style={{
                ...Typography.preset.body,
                color: Colors.primaryDark,
                fontWeight: Typography.weight.semibold,
              }}
            >
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
