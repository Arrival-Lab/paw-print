import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { useQuery } from '@tanstack/react-query';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Fab from '../../shared/components/Fab';
import EmptyState from '../../shared/components/EmptyState';
import PetSelector from '../../features/pet/components/PetSelector';
import PetMultiSelectSheet from '../../features/pet/components/PetMultiSelectSheet';
import { useDiaryCalendar } from '../../features/diary/hooks/useDiaryCalendar';
import { useRecentDiaries, type RecentDiary } from '../../features/diary/hooks/useRecentDiaries';
import { diaryApi, type CalendarDayInfo } from '../../features/diary/api/diaryApi';
import { usePets } from '../../features/pet/hooks/usePets';
import { formatDate as fmtDate } from '../../shared/utils/format';

const today = new Date().toISOString().split('T')[0];

interface DayProps {
  date?: { dateString: string; day: number; month: number; year: number };
  state?: 'disabled' | 'today' | '' | undefined;
  marking?: (CalendarDayInfo & { selected?: boolean; hasAnyContent?: boolean }) | undefined;
  onPress?: (date: any) => void;
}

function CalendarDay({ date, state, marking, onPress }: DayProps) {
  const Colors = useColors();
  if (!date) return null;
  const isToday = date.dateString === today;
  const isDisabled = state === 'disabled';
  const hasThumbnail = !!marking?.thumbnail;
  const hasContent = !!marking?.hasAnyContent;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(date)}
      style={{ width: 36, height: 30, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: Spacing.borderRadius.sm,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isToday && !hasThumbnail ? Colors.primary : 'transparent',
          borderWidth: isToday && hasThumbnail ? 2 : 0,
          borderColor: Colors.primary,
        }}
      >
        {hasThumbnail ? (
          <Image
            source={{ uri: marking!.thumbnail }}
            style={{ width: 24, height: 24, borderRadius: Spacing.borderRadius.sm }}
          />
        ) : null}
        <Text
          style={{
            fontSize: Typography.size.xs,
            fontWeight: isToday ? Typography.weight.bold : Typography.weight.medium,
            color: isDisabled
              ? Colors.text.disabled
              : isToday && !hasThumbnail
                ? Colors.white
                : Colors.text.primary,
            position: hasThumbnail ? 'absolute' : 'relative',
            textShadowColor: hasThumbnail ? 'rgba(0,0,0,0.4)' : 'transparent',
            textShadowRadius: hasThumbnail ? 2 : 0,
          }}
        >
          {date.day}
        </Text>
      </View>
      {hasContent && !hasThumbnail ? (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: Colors.secondary,
            marginTop: 1,
          }}
        />
      ) : null}
    </TouchableOpacity>
  );
}

export default function DiaryScreen() {
  const Colors = useColors();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const { data: pets, isLoading: petsLoading } = usePets();
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  const noPets = !petsLoading && (pets?.length ?? 0) === 0;

  const { data: singleCalendarData } = useDiaryCalendar(
    selectedPetId ?? 0,
    currentYear,
    currentMonth,
  );

  // "전체" 모드: 서버에서 모든 펫 캘린더를 병합해서 한 번에 받음
  const { data: aggregateCalendarData } = useQuery({
    queryKey: ['diary-calendar-all', currentYear, currentMonth],
    queryFn: () => diaryApi.getCalendarAll(currentYear, currentMonth),
    enabled: selectedPetId === null && !noPets,
  });

  // 이번 달 기록 리스트 — 단일/전체 모드 둘 다 머지 hook 으로 처리
  const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(new Date(currentYear, currentMonth, 0).getDate()).padStart(2, '0')}`;
  const { data: entries } = useRecentDiaries(selectedPetId, {
    from: monthStart,
    to: monthEnd,
    limit: 100,
  });

  const calendarData: Record<string, CalendarDayInfo> = useMemo(() => {
    if (selectedPetId !== null) return (singleCalendarData ?? {}) as any;
    return (aggregateCalendarData ?? {}) as any;
  }, [selectedPetId, singleCalendarData, aggregateCalendarData]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    Object.entries(calendarData).forEach(([date, info]) => {
      marks[date] = { ...info, hasAnyContent: true };
    });
    marks[today] = { ...(marks[today] ?? {}), selected: true };
    return marks;
  }, [calendarData]);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const handleDayPress = (day: { dateString: string }) => {
    if (!selectedPetId) {
      setPendingDate(day.dateString);
      setPickerVisible(true);
      return;
    }
    router.push({
      pathname: '/diary/[date]',
      params: { date: day.dateString, petIds: String(selectedPetId) },
    });
  };

  const handlePickerConfirm = (petIds: number[]) => {
    setPickerVisible(false);
    if (!pendingDate || petIds.length === 0) return;
    router.push({
      pathname: '/diary/[date]',
      params: { date: pendingDate, petIds: petIds.join(',') },
    });
    setPendingDate(null);
  };

  const handleMonthChange = (month: { year: number; month: number }) => {
    setCurrentYear(month.year);
    setCurrentMonth(month.month);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
      <ScreenHeader
        title="펫 다이어리"
        actions={[
          {
            icon: 'search',
            label: '검색',
            onPress: () =>
              selectedPetId
                ? router.push({ pathname: '/diary/search', params: { petId: selectedPetId } })
                : router.push('/diary/search'),
          },
        ]}
      />

      <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {noPets ? (
        <EmptyState
          icon="calendar"
          title="다이어리는 펫 등록 후 사용할 수 있어요"
          description="컨디션·식사·놀이·산책 등 하루를 자유롭게 기록해 추억으로 남겨요"
          action={{ label: '반려동물 등록', onPress: () => router.push('/pets/new') }}
        />
      ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View
          style={{
            marginHorizontal: Spacing.lg,
            marginTop: Spacing.sm,
            borderRadius: Spacing.borderRadius.lg,
            borderWidth: 1,
            borderColor: Colors.border,
            overflow: 'hidden',
          }}
        >
          <Calendar
            current={`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
            markedDates={markedDates}
            dayComponent={(props) => (
              <CalendarDay
                date={props.date}
                state={props.state}
                marking={props.marking as any}
                onPress={handleDayPress}
              />
            )}
            theme={{
              calendarBackground: Colors.white,
              arrowColor: Colors.primary,
              monthTextColor: Colors.text.primary,
              textMonthFontWeight: Typography.weight.semibold,
              textMonthFontSize: Typography.size.sm,
              textDayHeaderFontSize: Typography.size.xxs,
              textDayHeaderFontWeight: Typography.weight.semibold,
              textSectionTitleColor: Colors.text.tertiary,
              todayTextColor: Colors.primary,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.text.inverse,
              dotColor: Colors.secondary,
            }}
            style={{ paddingVertical: 0 }}
            hideExtraDays
          />
        </View>

        <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }}>
          <Text
            style={{
              ...Typography.preset.label,
              color: Colors.text.secondary,
              marginBottom: Spacing.sm,
            }}
          >
            이번 달 기록 ({entries.length})
          </Text>
          {entries.length === 0 ? (
            <View style={{ paddingVertical: Spacing.xxl, alignItems: 'center' }}>
              <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary, textAlign: 'center' }}>
                아직 기록이 없어요.{'\n'}날짜를 눌러 첫 기록을 남겨보세요.
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <EntryCard
                key={`${entry.petId}-${entry.id}`}
                entry={entry}
                showPetName={selectedPetId === null}
                onPress={() =>
                  router.push({
                    pathname: '/diary/[date]',
                    params: { date: entry.diaryDate, petIds: String(entry.petId) },
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
      )}

      {!noPets ? (
        <Fab
          onPress={() => handleDayPress({ dateString: today })}
          icon="edit-3"
          accessibilityLabel="오늘 다이어리 작성"
        />
      ) : null}

      <PetMultiSelectSheet
        visible={pickerVisible}
        title="어떤 펫에 작성할까요?"
        description="여러 펫을 선택하면 같은 내용으로 각각 기록돼요. 사진은 펫별로 따로 추가해주세요."
        onClose={() => {
          setPickerVisible(false);
          setPendingDate(null);
        }}
        onConfirm={handlePickerConfirm}
      />
    </SafeAreaView>
  );
}

function EntryCard({
  entry, showPetName, onPress,
}: {
  entry: RecentDiary;
  showPetName?: boolean;
  onPress: () => void;
}) {
  const Colors = useColors();
  const [thumbFailed, setThumbFailed] = useState(false);
  const showThumb = !!entry.thumbnail && !thumbFailed;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        gap: Spacing.md,
        padding: Spacing.md,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Spacing.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
          {fmtDate(entry.diaryDate, 'yyyy년 MM월 dd일')}
          {showPetName ? ` · ${entry.petName}` : ''}
        </Text>
        {entry.title?.trim() ? (
          <Text
            numberOfLines={1}
            style={{
              ...Typography.preset.body,
              color: Colors.text.primary,
              fontWeight: Typography.weight.bold,
              marginTop: 2,
            }}
          >
            {entry.title}
          </Text>
        ) : null}
        <Text
          numberOfLines={entry.title?.trim() ? 1 : 2}
          style={{
            ...Typography.preset.bodySmall,
            color: entry.title?.trim() ? Colors.text.secondary : Colors.text.primary,
            marginTop: 2,
          }}
        >
          {entry.content?.trim() || '(내용 없음)'}
        </Text>
        {entry.tags?.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs, flexWrap: 'wrap' }}>
            {entry.tags.slice(0, 3).map((t) => (
              <Text key={t} style={{ fontSize: Typography.size.xs, color: Colors.primary }}>
                #{t}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
      {showThumb ? (
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: entry.thumbnail! }}
            onError={() => setThumbFailed(true)}
            style={{
              width: 56,
              height: 56,
              borderRadius: Spacing.borderRadius.sm,
              backgroundColor: Colors.surface,
            }}
          />
          {entry.photoCount > 1 ? (
            <View
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                paddingVertical: 1,
                paddingHorizontal: 4,
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}
            >
              <Text style={{ fontSize: 9, color: Colors.white, fontWeight: Typography.weight.semibold }}>
                {entry.photoCount}
              </Text>
            </View>
          ) : null}
        </View>
      ) : entry.photoCount > 0 ? (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: Spacing.borderRadius.sm,
            backgroundColor: Colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name="image" size={18} color={Colors.primary} />
          <Text style={{ fontSize: Typography.size.xxs, color: Colors.primary, marginTop: 2 }}>
            {entry.photoCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
