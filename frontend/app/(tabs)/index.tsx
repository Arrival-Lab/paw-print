import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { Colors, Spacing, Typography } from '../../constants';
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
  if (!date) return null;
  const isToday = date.dateString === today;
  const isDisabled = state === 'disabled';

  return (
    <TouchableOpacity
      onPress={() => onPress?.(date)}
      style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: Spacing.borderRadius.sm,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isToday ? Colors.primaryLight : 'transparent',
        }}
      >
        {marking?.thumbnail ? (
          <Image
            source={{ uri: marking.thumbnail }}
            style={{ width: 34, height: 34, borderRadius: Spacing.borderRadius.sm }}
          />
        ) : null}
        <Text
          style={{
            fontSize: Typography.size.sm,
            fontWeight: isToday ? Typography.weight.bold : Typography.weight.regular,
            color: isDisabled ? Colors.text.disabled : isToday ? Colors.primary : Colors.text.primary,
            position: marking?.thumbnail ? 'absolute' : 'relative',
          }}
        >
          {date.day}
        </Text>
      </View>
      {marking?.hasRecord && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: Colors.secondary,
            marginTop: 1,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

export default function DiaryScreen() {
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
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
        <Text style={{ flex: 1, fontSize: Typography.size.xl,
          fontWeight: Typography.weight.bold, color: Colors.text.primary }}>
          건강 다이어리
        </Text>
        <TouchableOpacity
          onPress={() => selectedPetId
            ? router.push({ pathname: '/diary/search', params: { petId: selectedPetId } })
            : router.push('/diary/search')}
          hitSlop={8}>
          <Feather name="search" size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <PetSelector onPetChange={setSelectedPetId} />

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
          arrowColor: Colors.primary,
          monthTextColor: Colors.primary,
          textMonthFontWeight: Typography.weight.semibold,
          textMonthFontSize: Typography.size.lg,
          todayTextColor: Colors.primary,
          selectedDayBackgroundColor: Colors.primary,
          selectedDayTextColor: Colors.text.inverse,
          dotColor: Colors.secondary,
        }}
        style={{ paddingBottom: Spacing.md }}
      />

      {/* FAB — 오늘 날짜 다이어리 작성 */}
      <TouchableOpacity
        onPress={() => handleDayPress({ dateString: today })}
        style={{
          position: 'absolute',
          bottom: Spacing.xxxl,
          right: Spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: Colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Text style={{ fontSize: 28, color: Colors.text.inverse, lineHeight: 32 }}>✏</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
