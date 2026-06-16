import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
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
  /** 태그 클릭 시 search 화면으로 전달할 petId. 미지정 시 전체 검색. */
  petId?: number;
  onEdit: () => void;
}

const SPECIES_PAW: Record<string, any> = {
  DOG: require('../../../assets/paws/dog.png'),
  CAT: require('../../../assets/paws/cat.png'),
  BIRD: require('../../../assets/paws/bird.png'),
  REPTILE: require('../../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../../assets/paws/small.png'),
  OTHER: require('../../../assets/paws/other.png'),
};

export default function DiaryReadView({ date, title, content, tags, photos, petName, petSpecies, petId }: Props) {
  const Colors = useColors();
  const { t } = useTranslation();
  const weekdaysShort = t('diary.weekdaysShort', { returnObjects: true }) as string[];
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const weekday = t('diary.weekdayFull', { w: weekdaysShort[d.getDay()] });

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
            {t('diary.heroDate', { year, month, weekday })}
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

      {/* 사진 — 날짜 hero 바로 아래, 본문보다 위. */}
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
      ) : !title?.trim() && photos.length === 0 ? (
        <Text
          style={{
            ...Typography.preset.body,
            color: Colors.text.tertiary,
            fontStyle: 'italic',
            marginTop: Spacing.xl,
          }}
        >
          {t('diary.noContent')}
        </Text>
      ) : null}

      {/* 태그 — 탭 시 같은 태그 검색 결과로 이동 */}
      {tags.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: Spacing.sm,
            marginTop: Spacing.xl,
          }}
        >
          {tags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() =>
                router.push({
                  pathname: '/diary/search',
                  params: petId ? { tag, petId } : { tag },
                })
              }
              hitSlop={Spacing.hitSlop}
              style={{
                paddingHorizontal: Spacing.md,
                paddingVertical: 6,
                borderRadius: Spacing.borderRadius.full,
                backgroundColor: Colors.primaryLight,
              }}
            >
              <Text
                style={{
                  ...Typography.preset.caption,
                  color: Colors.primaryDark,
                  fontWeight: Typography.weight.bold,
                }}
              >
                #{tag}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
