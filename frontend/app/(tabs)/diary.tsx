import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, RefreshControl } from 'react-native';
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
import { diaryApi, type CalendarDayInfo, type MemoryDiary } from '../../features/diary/api/diaryApi';
import { usePets } from '../../features/pet/hooks/usePets';
import { formatDate as fmtDate } from '../../shared/utils/format';
import { useRefresh } from '../../shared/hooks/useRefresh';

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

  // 셀 36 + 본문(thumbnail 또는 today ring) + 셀 아래 날짜 별도 — 시각 위계 충돌 해소
  return (
    <TouchableOpacity
      onPress={() => onPress?.(date)}
      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
      style={{ width: 44, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 2 }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: Spacing.borderRadius.md,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: hasThumbnail
            ? 'transparent'
            : isToday
              ? Colors.primary
              : hasContent
                ? Colors.primaryLight
                : 'transparent',
          borderWidth: isToday && hasThumbnail ? 2 : 0,
          borderColor: Colors.primary,
        }}
      >
        {hasThumbnail ? (
          <Image
            source={{ uri: marking!.thumbnail }}
            style={{ width: 36, height: 36, borderRadius: Spacing.borderRadius.md }}
          />
        ) : null}
      </View>
      <Text
        style={{
          marginTop: 2,
          fontSize: Typography.size.sm,
          fontWeight: isToday ? Typography.weight.bold : Typography.weight.medium,
          color: isDisabled
            ? Colors.text.disabled
            : isToday
              ? Colors.primaryDark
              : Colors.text.primary,
        }}
      >
        {date.day}
      </Text>
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

  // "N년 전 오늘" — 본인+공유 펫의 같은 month-day, 오늘 이전 다이어리
  const { data: memories } = useQuery({
    queryKey: ['diary-memories'],
    queryFn: () => diaryApi.getMemories(),
    enabled: !noPets,
    staleTime: 60 * 60_000,
  });
  const memoryList = useMemo(() => {
    if (!memories) return [];
    return selectedPetId == null ? memories : memories.filter((m) => m.petId === selectedPetId);
  }, [memories, selectedPetId]);

  const { refreshing, onRefresh } = useRefresh([
    ['pets'],
    ['diary-calendar'],
    ['diary-calendar-all'],
    ['diary-list'],
    ['diary-memories'],
  ]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
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
      >
        <PetSelector
          onPetChange={setSelectedPetId}
          paddingHorizontal={0}
          paddingVertical={0}
        />
      </ScreenHeader>

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {memoryList.length > 0 ? (
          <MemoriesSection memories={memoryList} />
        ) : null}

        <View
          style={{
            marginHorizontal: Spacing.lg,
            marginTop: Spacing.sm,
            borderRadius: Spacing.borderRadius.lg,
            borderWidth: 1,
            borderColor: Colors.border,
            backgroundColor: Colors.surfaceElevated,
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
              calendarBackground: Colors.surfaceElevated,
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
            style={{ paddingVertical: 0, backgroundColor: Colors.surfaceElevated }}
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

function MemoriesSection({ memories }: { memories: MemoryDiary[] }) {
  const Colors = useColors();
  const yearsAgoOf = (iso: string) => {
    const d = new Date(iso);
    return new Date().getFullYear() - d.getFullYear();
  };
  return (
    <View style={{ marginTop: Spacing.lg }}>
      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
        <Text style={{ ...Typography.preset.label, color: Colors.text.secondary }}>
          오늘의 추억
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md }}
      >
        {memories.map((m) => (
          <TouchableOpacity
            key={`${m.petId}-${m.id}`}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/diary/[date]',
                params: { date: m.diaryDate, petIds: String(m.petId) },
              })
            }
            style={{
              width: 132,
              backgroundColor: Colors.surfaceElevated,
              borderRadius: Spacing.borderRadius.lg,
              borderWidth: 1,
              borderColor: Colors.border,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: 88,
                backgroundColor: Colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {m.thumbnail ? (
                <Image source={{ uri: m.thumbnail }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Feather name="book-open" size={22} color={Colors.primaryDark} />
              )}
              <View
                style={{
                  position: 'absolute',
                  top: Spacing.xs,
                  left: Spacing.xs,
                  paddingVertical: 2,
                  paddingHorizontal: 6,
                  borderRadius: Spacing.borderRadius.sm,
                  backgroundColor: Colors.primaryDark,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.size.xxs,
                    color: Colors.text.inverse,
                    fontWeight: Typography.weight.bold,
                  }}
                >
                  {yearsAgoOf(m.diaryDate)}년 전
                </Text>
              </View>
            </View>
            <View style={{ padding: Spacing.sm }}>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                {fmtDate(m.diaryDate, 'yyyy년 MM월 dd일')} · {m.petName}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  ...Typography.preset.bodySmall,
                  color: Colors.text.primary,
                  fontWeight: Typography.weight.semibold,
                  marginTop: 2,
                }}
              >
                {m.title?.trim() || m.content?.trim() || '(내용 없음)'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
