import { useCallback, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Pressable, Modal, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, useFocusEffect } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { useQuery } from '@tanstack/react-query';
import { Spacing, Typography, Elevation } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { useBottomSheetSafePadding } from '../../shared/hooks/useBottomSheetSafePadding';
import GlassHeader from '../../shared/components/GlassHeader';
import Fab from '../../shared/components/Fab';
import EmptyState from '../../shared/components/EmptyState';
import PetSelector from '../../features/pet/components/PetSelector';
import PetMultiSelectSheet from '../../features/pet/components/PetMultiSelectSheet';
import TourTarget from '../../shared/components/TourTarget';
import { TOUR_TARGETS } from '../../shared/store/tourStore';
import { useDiaryCalendar } from '../../features/diary/hooks/useDiaryCalendar';
import { useRecentDiaries, type RecentDiary } from '../../features/diary/hooks/useRecentDiaries';
import { useRecordsByMonthDates } from '../../features/record/hooks/useRecordsByMonth';
import { useAppointmentDates, useAllPetsAppointmentDates } from '../../features/appointment/hooks/useAppointments';
import { petColorOf } from '../../features/pet/constants/petColors';
import type { Pet } from '../../features/pet/api/petApi';
import { diaryApi, type CalendarDayInfo, type MemoryDiary } from '../../features/diary/api/diaryApi';
import { usePets } from '../../features/pet/hooks/usePets';
import { useAuthStore } from '../../features/auth/store/authStore';
import { usePetFilterStore } from '../../shared/store/petFilterStore';
import GuestTabGate from '../../shared/components/GuestTabGate';
import { formatDate as fmtDate } from '../../shared/utils/format';
import { useRefresh } from '../../shared/hooks/useRefresh';

const today = new Date().toISOString().split('T')[0];

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

type ViewMode = 'calendar' | 'list';

interface DayProps {
  date?: { dateString: string; day: number; month: number; year: number };
  state?: 'disabled' | 'today' | '' | undefined;
  marking?: (CalendarDayInfo & { selected?: boolean; hasAnyContent?: boolean; hasMedicalRecord?: boolean; appointmentColors?: string[] }) | undefined;
  onPress?: (date: any) => void;
}

// 캘린더 셀 — 사진 있으면 셀 거의 꽉 채움. 날짜는 항상 좌상단.
// 우상단에 dot: 예약(펫 색, 펫별로 각각) + 의료기록(빨강).
function CalendarCell({ date, state, marking, onPress }: DayProps) {
  const Colors = useColors();
  if (!date) return null;
  const isToday = date.dateString === today;
  const isDisabled = state === 'disabled';
  const hasThumbnail = !!marking?.thumbnail;
  const hasMedical = !!marking?.hasMedicalRecord;
  // 예약 마커는 펫 색 dot — 전체 모드에선 그 날 예약 있는 펫마다 하나씩. 최대 4개까지 노출.
  const appointmentColors = (marking?.appointmentColors ?? []).slice(0, 4);

  return (
    <TouchableOpacity
      onPress={() => onPress?.(date)}
      activeOpacity={0.7}
      style={{ width: '100%', aspectRatio: 0.85, padding: 1 }}
    >
      <View
        style={{
          flex: 1,
          overflow: 'hidden',
          backgroundColor: isToday && !hasThumbnail ? Colors.primaryLight : 'transparent',
        }}
      >
        {hasThumbnail ? (
          <Image
            source={{ uri: marking!.thumbnail as string }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : null}

        {/* 오늘 표시 ring — 사진 있든 없든 동일 */}
        {isToday ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              borderWidth: 2,
              borderColor: Colors.primary,
            }}
          />
        ) : null}

        {/* 우상단 마커 dots — 예약(펫 색, 펫별로 각각) 먼저, 그 뒤 의료기록(빨강). */}
        {(hasMedical || appointmentColors.length > 0) ? (
          <View
            style={{
              position: 'absolute',
              top: 3,
              right: 3,
              flexDirection: 'row',
              gap: 2,
            }}
          >
            {appointmentColors.map((c, i) => (
              <View
                key={`appt-${i}`}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: c,
                  borderWidth: 1,
                  borderColor: Colors.white,
                }}
              />
            ))}
            {hasMedical ? (
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: Colors.status.error,
                  borderWidth: 1,
                  borderColor: Colors.white,
                }}
              />
            ) : null}
          </View>
        ) : null}

        {/* 날짜 — 항상 좌상단 */}
        {hasThumbnail ? (
          <View
            style={{
              position: 'absolute',
              top: 3,
              left: 3,
              paddingHorizontal: 5,
              paddingVertical: 1,
              borderRadius: Spacing.borderRadius.sm,
              backgroundColor: Colors.scrim,
            }}
          >
            <Text
              style={{
                fontSize: Typography.size.xs,
                color: Colors.white,
                fontWeight: Typography.weight.bold,
              }}
            >
              {date.day}
            </Text>
          </View>
        ) : (
          <Text
            style={{
              position: 'absolute',
              top: 4,
              left: 6,
              fontSize: Typography.size.md,
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
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function DiaryScreen() {
  const isGuest = useAuthStore((s) => s.isGuest);
  if (isGuest) {
    return (
      <GuestTabGate
        tabTitle="다이어리"
        icon="book-open"
        title="로그인하면 다이어리를 시작할 수 있어요"
        description="반려동물과의 일상을 사진·메모로 남기고 N년 전 오늘 추억까지 다시 봐요"
        loginPromptMessage="다이어리는 로그인이 필요해요"
      />
    );
  }
  return <DiaryAuthenticatedView />;
}

function DiaryAuthenticatedView() {
  const Colors = useColors();
  const tabBarHeight = useBottomTabBarHeight();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const { data: pets, isLoading: petsLoading } = usePets();
  const setSelectedPetIdStore = usePetFilterStore((s) => s.setSelectedPetId);

  // 탭 진입 시 펫 필터 reset — 다른 탭에서 선택한 펫이 그대로 따라오면 헷갈린다는 피드백.
  // store 를 null 로 만들면 PetSelector(includeAll=true)가 '전체'로 표시되고 onPetChange(null)
  // 콜백으로 로컬 selectedPetId 도 자동 null 로 동기화됨.
  useFocusEffect(
    useCallback(() => {
      setSelectedPetIdStore(null);
    }, [setSelectedPetIdStore]),
  );
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  // chevron/오늘 버튼은 캘린더를 remount 해서 즉시 점프시킨다. 스와이프 이동은 이 값을
  // 건드리지 않아 remount 없이 부드럽게 넘어간다(스와이프는 onMonthChange 로만 상태 동기화).
  const [jumpNonce, setJumpNonce] = useState(0);

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

  // 이번 달 기록 리스트 (리스트 모드용) — 단일/전체 모드 둘 다 머지 hook 으로 처리
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

  // 의료기록 마커(빨강) — 단일 펫 모드는 전용 fetch, 전체 모드는 집계 캘린더의 hasRecord 사용.
  const recordDates = useRecordsByMonthDates(selectedPetId, currentYear, currentMonth);
  // 예약 마커 — 단일 펫 모드는 그 펫, 전체 모드는 본인+공유 펫 전부(날짜→petId[]).
  const appointmentDates = useAppointmentDates(selectedPetId, currentYear, currentMonth);
  const allPetsAppointmentMap = useAllPetsAppointmentDates(
    currentYear,
    currentMonth,
    selectedPetId === null && !noPets,
  );

  // petId → Pet (색 조회용)
  const petById = useMemo(() => {
    const m = new Map<number, Pet>();
    (pets ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [pets]);

  // 날짜 → 예약 펫 색 배열. 단일 모드는 선택 펫 색 하나, 전체 모드는 그 날 예약 펫마다 색.
  const appointmentColorsByDate = useMemo(() => {
    const out: Record<string, string[]> = {};
    if (selectedPetId !== null) {
      const color = petColorOf(petById.get(selectedPetId));
      appointmentDates.forEach((date) => { out[date] = [color]; });
    } else {
      allPetsAppointmentMap.forEach((petIds, date) => {
        out[date] = petIds.map((id) => petColorOf(petById.get(id) ?? { id }));
      });
    }
    return out;
  }, [selectedPetId, appointmentDates, allPetsAppointmentMap, petById]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    Object.entries(calendarData).forEach(([date, info]) => {
      marks[date] = { ...info, hasAnyContent: true };
      // 전체 모드: 집계 캘린더의 hasRecord 로 빨강 마커. (단일 모드는 아래 recordDates 가 채움.)
      if (selectedPetId === null && (info as CalendarDayInfo).hasRecord) marks[date].hasMedicalRecord = true;
    });
    recordDates.forEach((date) => {
      marks[date] = { ...(marks[date] ?? {}), hasMedicalRecord: true };
    });
    Object.entries(appointmentColorsByDate).forEach(([date, colors]) => {
      marks[date] = { ...(marks[date] ?? {}), appointmentColors: colors };
    });
    marks[today] = { ...(marks[today] ?? {}), selected: true };
    return marks;
  }, [calendarData, recordDates, appointmentColorsByDate, selectedPetId]);

  // 캘린더 마커 범례용 — 예약 있는 펫 목록(색+이름). 단일 모드는 선택 펫만.
  const appointmentPetLegend = useMemo(() => {
    if (selectedPetId !== null) {
      if (appointmentDates.size === 0) return [];
      const p = petById.get(selectedPetId);
      return p ? [{ id: p.id, name: p.name, color: petColorOf(p) }] : [];
    }
    const ids = new Set<number>();
    allPetsAppointmentMap.forEach((petIds) => petIds.forEach((id) => ids.add(id)));
    return Array.from(ids)
      .map((id) => {
        const p = petById.get(id);
        return { id, name: p?.name ?? '', color: petColorOf(p ?? { id }) };
      })
      .filter((x) => x.name);
  }, [selectedPetId, appointmentDates, allPetsAppointmentMap, petById]);

  // 빨강(진료) 범례 노출 여부 — 단일은 recordDates, 전체는 집계 hasRecord.
  const showRecordLegend = selectedPetId !== null
    ? recordDates.size > 0
    : Object.values(calendarData).some((i) => (i as CalendarDayInfo)?.hasRecord);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  // 기록 있는 날 누르면 view/edit 선택 시트
  const [actionSheetDate, setActionSheetDate] = useState<string | null>(null);

  const handleDayPress = (day: { dateString: string }) => {
    const hasContent = !!calendarData[day.dateString];
    if (selectedPetId) {
      // 단일 펫 모드 — 일기 있는 날은 바로 view, 빈 날은 바로 edit.
      router.push({
        pathname: '/diary/[date]',
        params: { date: day.dateString, petIds: String(selectedPetId), mode: hasContent ? 'view' : 'edit' },
      });
      return;
    }
    // 전체 모드
    if (hasContent) {
      // 일기가 이미 있음 — 보기/새로 작성 선택 시트
      setActionSheetDate(day.dateString);
      return;
    }
    // 전체 모드 + 빈 날 — 곧장 다중 펫 선택 시트 (작성)
    setPendingDate(day.dateString);
    setPickerVisible(true);
  };

  // 전체 모드에서 "기록 보기" 선택 시: 그 날 일기 있는 펫들로 바로 view 진입 (picker 우회).
  // "새로 작성" 선택 시: PetMultiSelectSheet 로 다중 펫 작성.
  const handleAllModeAction = (action: 'view' | 'create') => {
    if (!actionSheetDate) return;
    const targetDate = actionSheetDate;
    setActionSheetDate(null);
    if (action === 'create') {
      setPendingDate(targetDate);
      setPickerVisible(true);
    } else {
      // view — entries 에서 그 날 일기 있는 펫 추출. 1명이든 여러 명이든 picker 안 띄우고 바로 view.
      const petsOnDate = (entries ?? [])
        .filter((e) => e.diaryDate === targetDate)
        .map((e) => e.petId);
      const uniquePetIds = Array.from(new Set(petsOnDate));
      if (uniquePetIds.length === 0) {
        // 방어: entries 가 비어있거나 limit 초과 등 — fallback 으로 picker.
        setPendingDate(targetDate);
        setPickerVisible(true);
        return;
      }
      router.push({
        pathname: '/diary/[date]',
        params: { date: targetDate, petIds: uniquePetIds.join(','), mode: 'view' },
      });
    }
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

  const goPrev = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setJumpNonce((n) => n + 1);
  };
  const goNext = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setJumpNonce((n) => n + 1);
  };
  const goToday = () => {
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
    setJumpNonce((n) => n + 1);
  };
  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;

  const monthBarContent = !noPets ? (
    <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.sm }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text
                  style={{
                    ...Typography.preset.caption,
                    color: Colors.text.tertiary,
                    fontWeight: Typography.weight.semibold,
                    letterSpacing: 1,
                  }}
                >
                  {currentYear}
                </Text>
                <Text
                  style={{
                    ...Typography.preset.display,
                    color: Colors.text.primary,
                  }}
                >
                  {currentMonth}월
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                {!isCurrentMonth ? (
                  <Pressable
                    onPress={goToday}
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
                      오늘
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={goPrev}
                  hitSlop={Spacing.hitSlop}
                  style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Feather name="chevron-left" size={22} color={Colors.text.primary} />
                </Pressable>
                <Pressable
                  onPress={goNext}
                  hitSlop={Spacing.hitSlop}
                  style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Feather name="chevron-right" size={22} color={Colors.text.primary} />
                </Pressable>
              </View>
            </View>

            {/* 뷰 모드 토글 (캘린더/리스트) */}
            <View
              style={{
                flexDirection: 'row',
                marginTop: Spacing.md,
                gap: 2,
                backgroundColor: Colors.surfaceElevated,
                padding: 3,
                borderRadius: Spacing.borderRadius.full,
                alignSelf: 'flex-start',
              }}
            >
              {([
                { value: 'calendar', icon: 'grid', label: '캘린더' },
                { value: 'list', icon: 'list', label: '리스트' },
              ] as const).map((opt) => {
                const active = viewMode === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setViewMode(opt.value)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 6,
                      borderRadius: Spacing.borderRadius.full,
                      backgroundColor: active ? Colors.primary : 'transparent',
                    }}
                  >
                    <Feather
                      name={opt.icon}
                      size={13}
                      color={active ? Colors.text.primary : Colors.text.secondary}
                    />
                    <Text
                      style={{
                        ...Typography.preset.caption,
                        fontWeight: Typography.weight.bold,
                        color: active ? Colors.text.primary : Colors.text.secondary,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {noPets ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="calendar"
            title="다이어리는 펫 등록 후 사용할 수 있어요"
            description="컨디션·식사·놀이·산책 등 하루를 자유롭게 기록해 추억으로 남겨요"
            action={{ label: '반려동물 등록', onPress: () => router.push('/pets/new') }}
          />
        </View>
      ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: headerHeight + Spacing.sm, paddingBottom: tabBarHeight + Spacing.xxxxl }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
                progressViewOffset={headerHeight}
              />
            }
          >
            {memoryList.length > 0 ? <MemoriesSection memories={memoryList} /> : null}

            {viewMode === 'calendar' && (showRecordLegend || appointmentPetLegend.length > 0) ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: Spacing.md,
                  paddingHorizontal: Spacing.xl,
                  marginTop: Spacing.sm,
                }}
              >
                {showRecordLegend ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.status.error, borderWidth: 1, borderColor: Colors.white }} />
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>진료기록</Text>
                  </View>
                ) : null}
                {/* 예약 범례 — 펫 색 dot + 이름. 단일 모드는 "병원 예약". */}
                {appointmentPetLegend.map((p) => (
                  <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: p.color, borderWidth: 1, borderColor: Colors.white }} />
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                      {selectedPetId === null ? `${p.name} 예약` : '병원 예약'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {viewMode === 'calendar' ? (
              <TourTarget
                tourId={TOUR_TARGETS.TAB_DIARY}
                wrap
                style={{
                  marginHorizontal: Spacing.lg,
                  marginTop: Spacing.sm,
                  borderRadius: Spacing.borderRadius.lg,
                  backgroundColor: Colors.surfaceElevated,
                  ...Elevation.card,
                  overflow: 'hidden',
                }}
              >
                <Calendar
                  key={`jump-${jumpNonce}`}
                  current={`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`}
                  enableSwipeMonths
                  onDayPress={handleDayPress}
                  onMonthChange={handleMonthChange}
                  markedDates={markedDates}
                  dayComponent={(props) => (
                    <CalendarCell
                      date={props.date}
                      state={props.state}
                      marking={props.marking as any}
                      onPress={handleDayPress}
                    />
                  )}
                  renderHeader={() => null}
                  hideArrows
                  hideExtraDays
                  theme={{
                    calendarBackground: Colors.surfaceElevated,
                    textDayHeaderFontSize: Typography.size.xs,
                    textDayHeaderFontWeight: Typography.weight.bold,
                    textSectionTitleColor: Colors.text.secondary,
                  }}
                  style={{ paddingVertical: Spacing.sm, backgroundColor: Colors.surfaceElevated }}
                />
              </TourTarget>
            ) : (
              <ListView
                entries={entries}
                showPetName={selectedPetId === null}
                onPressEntry={(entry) =>
                  router.push({
                    pathname: '/diary/[date]',
                    params: { date: entry.diaryDate, petIds: String(entry.petId) },
                  })
                }
              />
            )}
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

      <DiaryDayActionSheet
        visible={actionSheetDate !== null}
        date={actionSheetDate}
        onClose={() => setActionSheetDate(null)}
        onView={() => handleAllModeAction('view')}
        onEdit={() => handleAllModeAction('create')}
      />

      <GlassHeader
        title="펫 다이어리"
        onHeightChange={setHeaderHeight}
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
        bottomSlot={monthBarContent}
      >
        <PetSelector
          onPetChange={setSelectedPetId}
          paddingHorizontal={0}
          paddingVertical={0}
        />
      </GlassHeader>
    </View>
  );
}

function DiaryDayActionSheet({
  visible, date, onClose, onView, onEdit,
}: {
  visible: boolean;
  date: string | null;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
}) {
  const Colors = useColors();
  const padBottom = useBottomSheetSafePadding();
  const dateLabel = date
    ? (() => {
        const d = new Date(date);
        return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY_KO[d.getDay()]}요일`;
      })()
    : '';
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: Colors.overlay }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: 'auto',
            backgroundColor: Colors.surfaceElevated,
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            paddingHorizontal: Spacing.xl,
            paddingTop: Spacing.lg,
            paddingBottom: padBottom,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.border,
              marginBottom: Spacing.lg,
            }}
          />
          <Text
            style={{
              ...Typography.preset.heading,
              color: Colors.text.primary,
              fontWeight: Typography.weight.bold,
              marginBottom: 2,
            }}
          >
            {dateLabel}
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginBottom: Spacing.lg }}>
            이 날에 작성한 일기가 있어요
          </Text>

          {[
            { icon: 'book-open' as const, label: '기록 보기', desc: '이 날 작성한 일기들을 봐요', onPress: onView },
            { icon: 'edit-3' as const, label: '새로 작성', desc: '같은 날짜에 새 일기를 추가해요', onPress: onEdit },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
                paddingVertical: Spacing.md,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: Colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name={item.icon} size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
                  {item.label}
                </Text>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                  {item.desc}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ListView({
  entries,
  showPetName,
  onPressEntry,
}: {
  entries: RecentDiary[];
  showPetName: boolean;
  onPressEntry: (entry: RecentDiary) => void;
}) {
  const Colors = useColors();
  if (entries.length === 0) {
    return (
      <View style={{ paddingVertical: Spacing.xxxxl, alignItems: 'center', paddingHorizontal: Spacing.xxl }}>
        <Feather name="book-open" size={36} color={Colors.text.tertiary} />
        <Text
          style={{
            ...Typography.preset.body,
            color: Colors.text.tertiary,
            textAlign: 'center',
            marginTop: Spacing.lg,
          }}
        >
          이번 달엔 아직 기록이 없어요.{'\n'}오늘 하루를 다이어리에 남겨보세요.
        </Text>
      </View>
    );
  }
  return (
    <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.lg }}>
      {entries.map((entry) => (
        <DiaryCard
          key={`${entry.petId}-${entry.id}`}
          entry={entry}
          showPetName={showPetName}
          onPress={() => onPressEntry(entry)}
        />
      ))}
    </View>
  );
}

function DiaryCard({
  entry,
  showPetName,
  onPress,
}: {
  entry: RecentDiary;
  showPetName: boolean;
  onPress: () => void;
}) {
  const Colors = useColors();
  const [thumbFailed, setThumbFailed] = useState(false);
  const hasThumb = !!entry.thumbnail && !thumbFailed;
  const dateObj = new Date(entry.diaryDate);
  const day = dateObj.getDate();
  const weekday = WEEKDAY_KO[dateObj.getDay()];

  // 사진 있는 카드 — 큰 사진(4:3) + 하단 컨텐츠
  if (hasThumb) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.92}
        style={{
          borderRadius: Spacing.borderRadius.xl,
          overflow: 'hidden',
          backgroundColor: Colors.surfaceElevated,
          ...Elevation.card,
        }}
      >
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: entry.thumbnail! }}
            onError={() => setThumbFailed(true)}
            style={{ width: '100%', aspectRatio: 4 / 3 }}
            resizeMode="cover"
          />
          {entry.photoCount > 1 ? (
            <View
              style={{
                position: 'absolute',
                top: Spacing.sm,
                right: Spacing.sm,
                paddingHorizontal: Spacing.sm,
                paddingVertical: 3,
                borderRadius: Spacing.borderRadius.sm,
                backgroundColor: Colors.scrim,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Feather name="image" size={11} color={Colors.white} />
              <Text
                style={{
                  fontSize: Typography.size.xs,
                  color: Colors.white,
                  fontWeight: Typography.weight.bold,
                }}
              >
                {entry.photoCount}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ padding: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.xs }}>
            <Text
              style={{
                ...Typography.preset.heading,
                color: Colors.primaryDark,
                fontWeight: Typography.weight.bold,
              }}
            >
              {day}일
            </Text>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
              {weekday}요일{showPetName ? ` · ${entry.petName}` : ''}
            </Text>
          </View>
          {entry.title?.trim() ? (
            <Text
              numberOfLines={1}
              style={{
                ...Typography.preset.heading,
                color: Colors.text.primary,
                fontWeight: Typography.weight.bold,
              }}
            >
              {entry.title}
            </Text>
          ) : null}
          <Text
            numberOfLines={entry.title?.trim() ? 2 : 3}
            style={{
              ...Typography.preset.body,
              color: entry.title?.trim() ? Colors.text.secondary : Colors.text.primary,
              marginTop: 4,
            }}
          >
            {entry.content?.trim() || '(내용 없음)'}
          </Text>
          {entry.tags?.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' }}>
              {entry.tags.slice(0, 4).map((t) => (
                <Text
                  key={t}
                  style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}
                >
                  #{t}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  // 사진 없는 카드 — 큰 날짜 + 텍스트
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        flexDirection: 'row',
        gap: Spacing.lg,
        padding: Spacing.lg,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Spacing.borderRadius.xl,
        ...Elevation.card,
      }}
    >
      <View style={{ alignItems: 'center', minWidth: 44 }}>
        <Text
          style={{
            ...Typography.preset.display,
            color: Colors.primaryDark,
          }}
        >
          {day}
        </Text>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: -2 }}>
          {weekday}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        {showPetName ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
            {entry.petName}
          </Text>
        ) : null}
        {entry.title?.trim() ? (
          <Text
            numberOfLines={1}
            style={{
              ...Typography.preset.heading,
              color: Colors.text.primary,
              fontWeight: Typography.weight.bold,
              marginTop: showPetName ? 2 : 0,
            }}
          >
            {entry.title}
          </Text>
        ) : null}
        <Text
          numberOfLines={entry.title?.trim() ? 2 : 3}
          style={{
            ...Typography.preset.body,
            color: entry.title?.trim() ? Colors.text.secondary : Colors.text.primary,
            marginTop: entry.title?.trim() ? 2 : (showPetName ? 2 : 0),
          }}
        >
          {entry.content?.trim() || '(내용 없음)'}
        </Text>
        {entry.tags?.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' }}>
            {entry.tags.slice(0, 4).map((t) => (
              <Text
                key={t}
                style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}
              >
                #{t}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function MemoriesSection({ memories }: { memories: MemoryDiary[] }) {
  const Colors = useColors();
  const yearsAgoOf = (iso: string) => {
    const d = new Date(iso);
    return new Date().getFullYear() - d.getFullYear();
  };
  return (
    <View style={{ marginTop: Spacing.md }}>
      <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm }}>
        <Text
          style={{
            ...Typography.preset.caption,
            color: Colors.text.secondary,
            fontWeight: Typography.weight.bold,
            letterSpacing: 0.5,
          }}
        >
          오늘의 추억
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md }}
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
              width: 160,
              backgroundColor: Colors.surfaceElevated,
              borderRadius: Spacing.borderRadius.lg,
              ...Elevation.card,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: 112,
                backgroundColor: Colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {m.thumbnail ? (
                <Image source={{ uri: m.thumbnail }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Feather name="book-open" size={28} color={Colors.primaryDark} />
              )}
              {/* 사진 위 어두운 하단 그라데이션 대신 단색 scrim 한 번 (Image #6 분위기) */}
              {m.thumbnail ? (
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 36,
                    backgroundColor: Colors.scrim,
                  }}
                />
              ) : null}
              <View
                style={{
                  position: 'absolute',
                  top: Spacing.xs,
                  left: Spacing.xs,
                  paddingVertical: 3,
                  paddingHorizontal: Spacing.sm,
                  borderRadius: Spacing.borderRadius.sm,
                  backgroundColor: Colors.primaryDark,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Feather name="clock" size={10} color={Colors.text.inverse} />
                <Text
                  style={{
                    fontSize: Typography.size.xs,
                    color: Colors.text.inverse,
                    fontWeight: Typography.weight.bold,
                  }}
                >
                  {yearsAgoOf(m.diaryDate)}년 전
                </Text>
              </View>
            </View>
            <View style={{ padding: Spacing.md }}>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                {fmtDate(m.diaryDate, 'yyyy년 MM월 dd일')} · {m.petName}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  ...Typography.preset.body,
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
