import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Fab from '../../shared/components/Fab';
import PetSelector from '../../features/pet/components/PetSelector';
import { useDiaryCalendar } from '../../features/diary/hooks/useDiaryCalendar';
import type { CalendarDayInfo } from '../../features/diary/api/diaryApi';

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
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  const { data: calendarData } = useDiaryCalendar(
    selectedPetId ?? 0,
    currentYear,
    currentMonth,
  );

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    if (calendarData) {
      Object.entries(calendarData).forEach(([date, info]) => {
        marks[date] = info;
      });
    }
    marks[today] = { ...(marks[today] ?? {}), selected: true };
    return marks;
  }, [calendarData]);

  const handleDayPress = (day: { dateString: string }) => {
    if (!selectedPetId) {
      Alert.alert('반려동물 선택', '다이어리를 작성할 반려동물을 먼저 선택해주세요.');
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

      <Fab
        onPress={() => handleDayPress({ dateString: today })}
        icon="edit-3"
        accessibilityLabel="오늘 다이어리 작성"
      />
    </SafeAreaView>
  );
}
