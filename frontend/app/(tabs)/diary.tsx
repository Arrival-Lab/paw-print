import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
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
import { useDiaryCalendar } from '../../features/diary/hooks/useDiaryCalendar';
import { diaryApi, type CalendarDayInfo } from '../../features/diary/api/diaryApi';
import { usePets } from '../../features/pet/hooks/usePets';

const today = new Date().toISOString().split('T')[0];

interface DayProps {
  date?: { dateString: string; day: number; month: number; year: number };
  state?: 'disabled' | 'today' | '' | undefined;
  marking?: (CalendarDayInfo & { selected?: boolean }) | undefined;
  onPress?: (date: any) => void;
}

function CalendarDay({ date, state, marking, onPress }: DayProps) {
  const Colors = useColors();
  if (!date) return null;
  const isToday = date.dateString === today;
  const isDisabled = state === 'disabled';
  const hasThumbnail = !!marking?.thumbnail;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(date)}
      style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: Spacing.borderRadius.md,
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
            style={{ width: 36, height: 36, borderRadius: Spacing.borderRadius.md }}
          />
        ) : null}
        <Text
          style={{
            fontSize: Typography.size.sm,
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
      {marking?.hasRecord && !hasThumbnail ? (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: Colors.secondary,
            marginTop: 2,
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

  const calendarData: Record<string, CalendarDayInfo> = useMemo(() => {
    if (selectedPetId !== null) return (singleCalendarData ?? {}) as any;
    return (aggregateCalendarData ?? {}) as any;
  }, [selectedPetId, singleCalendarData, aggregateCalendarData]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    Object.entries(calendarData).forEach(([date, info]) => {
      marks[date] = info;
    });
    marks[today] = { ...(marks[today] ?? {}), selected: true };
    return marks;
  }, [calendarData]);

  const handleDayPress = (day: { dateString: string }) => {
    if (!selectedPetId) {
      Alert.alert(
        '펫을 선택해주세요',
        '전체 보기에서는 작성할 수 없어요. 펫을 선택한 뒤 다시 시도해주세요.',
      );
      return;
    }
    router.push({ pathname: '/diary/[date]', params: { date: day.dateString, petId: selectedPetId } });
  };

  const handleMonthChange = (month: { year: number; month: number }) => {
    setCurrentYear(month.year);
    setCurrentMonth(month.month);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
      <ScreenHeader
        title="건강 다이어리"
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
          description="컨디션·식사·놀이 기록을 캘린더에 모아 추억으로 남겨요"
          action={{ label: '반려동물 등록', onPress: () => router.push('/pets/new') }}
        />
      ) : (
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
            textMonthFontWeight: Typography.weight.bold,
            textMonthFontSize: Typography.size.lg,
            textDayHeaderFontSize: Typography.size.xs,
            textDayHeaderFontWeight: Typography.weight.semibold,
            textSectionTitleColor: Colors.text.tertiary,
            todayTextColor: Colors.primary,
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: Colors.text.inverse,
            dotColor: Colors.secondary,
          }}
          style={{ paddingVertical: Spacing.sm }}
        />
      </View>
      )}

      {!noPets && selectedPetId !== null ? (
        <Fab
          onPress={() => handleDayPress({ dateString: today })}
          icon="edit-3"
          accessibilityLabel="오늘 다이어리 작성"
        />
      ) : null}
    </SafeAreaView>
  );
}
