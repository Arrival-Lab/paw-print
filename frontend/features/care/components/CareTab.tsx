import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, TextInput, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { Spacing, Typography, Elevation } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Button from '../../../shared/components/Button';
import EmptyState from '../../../shared/components/EmptyState';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import TimePickerModal from '../../../shared/components/TimePickerModal';
import { useRefresh } from '../../../shared/hooks/useRefresh';
import {
  useCareDay, useCreateCareItem, useDeleteCareItem, useSetCareCheck, useUpdateCareItem,
} from '../hooks/useCare';
import type { CareItemType, DailyCare } from '../api/careApi';

const TYPE_META: Record<CareItemType, { label: string; icon: React.ComponentProps<typeof Feather>['name'] }> = {
  MEAL: { label: '사료', icon: 'coffee' },
  SNACK: { label: '간식', icon: 'gift' },
  SUPPLEMENT: { label: '영양제', icon: 'plus-circle' },
  WALK: { label: '산책', icon: 'wind' },
  BRUSH: { label: '양치', icon: 'droplet' },
  MEDICATION: { label: '처방약', icon: 'thermometer' },
  CUSTOM: { label: '기타', icon: 'check-square' },
};

const TYPE_ORDER: CareItemType[] = ['MEAL', 'SNACK', 'SUPPLEMENT', 'WALK', 'BRUSH', 'MEDICATION', 'CUSTOM'];

type TimeSlot = 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' | 'none';
const SLOT_ORDER: TimeSlot[] = ['morning', 'lunch', 'afternoon', 'evening', 'night', 'none'];
const SLOT_LABEL: Record<TimeSlot, string> = {
  morning: '아침',
  lunch: '점심',
  afternoon: '오후',
  evening: '저녁',
  night: '취침전',
  none: '시간 미지정',
};

function timeSlot(reminderTime: string | null): TimeSlot {
  if (!reminderTime) return 'none';
  const h = Number(reminderTime.split(':')[0]);
  if (h >= 5 && h < 11) return 'morning';      // 05:00–10:59
  if (h >= 11 && h < 14) return 'lunch';       // 11:00–13:59
  if (h >= 14 && h < 18) return 'afternoon';   // 14:00–17:59
  if (h >= 18 && h < 22) return 'evening';     // 18:00–21:59
  return 'night';                              // 22:00–04:59
}

const todayIso = () => new Date().toISOString().split('T')[0];

const QUICK_START_PRESET: { name: string; itemType: CareItemType; targetCount: number; reminderTime: string | null }[] = [
  { name: '아침 사료', itemType: 'MEAL', targetCount: 1, reminderTime: '08:00' },
  { name: '저녁 사료', itemType: 'MEAL', targetCount: 1, reminderTime: '18:00' },
  { name: '산책', itemType: 'WALK', targetCount: 1, reminderTime: '17:00' },
  { name: '영양제', itemType: 'SUPPLEMENT', targetCount: 1, reminderTime: '08:00' },
  { name: '간식', itemType: 'SNACK', targetCount: 1, reminderTime: null },
];

export function CareTab({ selectedPetId }: { selectedPetId: number | null }) {
  const Colors = useColors();
  const today = todayIso();
  const [date, setDate] = useState(today);
  const [pickerOpen, setPickerOpen] = useState(false);
  const isToday = date === today;
  const { data: items, isLoading } = useCareDay(selectedPetId ?? 0, date);
  const setCheck = useSetCareCheck(selectedPetId ?? 0);
  const create = useCreateCareItem(selectedPetId ?? 0);
  const remove = useDeleteCareItem(selectedPetId ?? 0);
  const [editing, setEditing] = useState<DailyCare | null>(null);
  const [creating, setCreating] = useState<{ type?: CareItemType } | false>(false);
  const [starting, setStarting] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { refreshing, onRefresh } = useRefresh([
    ['care', 'day', selectedPetId ?? 0],
    ['care', 'items', selectedPetId ?? 0],
    ['care', 'home'],
  ]);

  const shiftDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  };

  const dateLabel = (() => {
    const d = new Date(date);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  })();

  const toggleSelected = (itemId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const cancelSelecting = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  const allItemIds = useMemo(() => (items ?? []).map((i) => i.itemId), [items]);
  const isAllSelected = allItemIds.length > 0 && selectedIds.size === allItemIds.length;
  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? new Set() : new Set(allItemIds));
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    Alert.alert('항목 삭제', `선택한 ${selectedIds.size}개 항목을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await Promise.all(Array.from(selectedIds).map((id) => remove.mutateAsync(id)));
          cancelSelecting();
        },
      },
    ]);
  };

  const quickStart = async () => {
    if (!selectedPetId || starting) return;
    setStarting(true);
    try {
      for (let i = 0; i < QUICK_START_PRESET.length; i++) {
        const p = QUICK_START_PRESET[i];
        await create.mutateAsync({ ...p, sortOrder: i });
      }
    } finally {
      setStarting(false);
    }
  };

  const summary = useMemo(() => {
    const list = items ?? [];
    const totalTargets = list.reduce((s, i) => s + i.targetCount, 0);
    const totalCompleted = list.reduce((s, i) => s + Math.min(i.count, i.targetCount), 0);
    const pct = totalTargets === 0 ? 0 : Math.round((totalCompleted / totalTargets) * 100);
    return { totalTargets, totalCompleted, pct };
  }, [items]);

  // 시간대 별 그룹화 — 그룹 안에선 시간 오름차순 → sortOrder
  const grouped = useMemo(() => {
    const list = items ?? [];
    const map = new Map<TimeSlot, DailyCare[]>();
    list.forEach((it) => {
      const slot = timeSlot(it.reminderTime);
      if (!map.has(slot)) map.set(slot, []);
      map.get(slot)!.push(it);
    });
    map.forEach((arr) => {
      arr.sort((a, b) => {
        const at = a.reminderTime ?? 'zz';
        const bt = b.reminderTime ?? 'zz';
        if (at !== bt) return at.localeCompare(bt);
        return a.sortOrder - b.sortOrder;
      });
    });
    return SLOT_ORDER.filter((s) => map.has(s)).map((s) => ({ slot: s, items: map.get(s)! }));
  }, [items]);

  if (!selectedPetId) {
    return (
      <EmptyState
        icon="check-square"
        title="펫을 선택해주세요"
        description="케어는 펫별로 관리해요. 상단에서 펫을 선택하세요"
      />
    );
  }

  if (isLoading) return <LoadingSpinner label="불러오는 중" />;

  const list = items ?? [];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {/* 날짜 네비게이션 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: Spacing.md,
            paddingHorizontal: 2,
          }}
        >
          <TouchableOpacity
            onPress={() => setDate(today)}
            disabled={isToday}
            hitSlop={Spacing.hitSlop}
          >
            <Text
              style={{
                ...Typography.preset.caption,
                color: isToday ? Colors.text.tertiary : Colors.primaryDark,
                fontWeight: Typography.weight.semibold,
              }}
            >
              오늘
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
            <TouchableOpacity onPress={() => shiftDate(-1)} hitSlop={Spacing.hitSlop}>
              <Feather name="chevron-left" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
            <Text
              style={{
                ...Typography.preset.body,
                color: Colors.text.primary,
                fontWeight: Typography.weight.bold,
                minWidth: 80,
                textAlign: 'center',
              }}
            >
              {dateLabel}
            </Text>
            <TouchableOpacity onPress={() => shiftDate(1)} hitSlop={Spacing.hitSlop}>
              <Feather name="chevron-right" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setPickerOpen(true)} hitSlop={Spacing.hitSlop}>
            <Feather name="calendar" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* 편집 모드 toolbar — list 가 있을 때만 노출 */}
        {list.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: Spacing.sm,
              paddingHorizontal: 2,
            }}
          >
            {selecting ? (
              <>
                <TouchableOpacity onPress={toggleSelectAll} hitSlop={Spacing.hitSlop}>
                  <Text
                    style={{
                      ...Typography.preset.caption,
                      color: Colors.primaryDark,
                      fontWeight: Typography.weight.semibold,
                    }}
                  >
                    {isAllSelected ? '전체 해제' : '전체 선택'} · {selectedIds.size}개
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelSelecting} hitSlop={Spacing.hitSlop}>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>취소</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View />
                <TouchableOpacity onPress={() => setSelecting(true)} hitSlop={Spacing.hitSlop}>
                  <Text
                    style={{
                      ...Typography.preset.caption,
                      color: Colors.primaryDark,
                      fontWeight: Typography.weight.semibold,
                    }}
                  >
                    편집
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : null}

        {/* 진행률 */}
        {list.length > 0 ? (
          <View
            style={{
              padding: Spacing.lg,
              borderRadius: Spacing.borderRadius.lg,
              backgroundColor: Colors.surfaceElevated,
              borderWidth: 1,
              borderColor: Colors.border,
              marginBottom: Spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                오늘 진행률
              </Text>
              <Text style={{ ...Typography.preset.heading, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
                {summary.totalCompleted}/{summary.totalTargets}
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>  ·  {summary.pct}%</Text>
              </Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: Colors.border,
                marginTop: Spacing.sm,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${summary.pct}%`,
                  height: '100%',
                  backgroundColor: Colors.primary,
                }}
              />
            </View>
          </View>
        ) : null}

        {list.length === 0 ? (
          <View
            style={{
              padding: Spacing.xxl,
              borderRadius: Spacing.borderRadius.lg,
              borderWidth: 1,
              borderColor: Colors.border,
              borderStyle: 'dashed',
              alignItems: 'center',
              gap: Spacing.md,
            }}
          >
            <Feather name="check-square" size={32} color={Colors.text.tertiary} />
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
                케어 체크리스트를 시작해보세요
              </Text>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, textAlign: 'center' }}>
                기본 항목 5개로 빠르게 시작하거나{'\n'}원하는 항목을 직접 추가할 수 있어요
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Button variant="primary" icon="zap" onPress={quickStart}>
                기본 케어 시작
              </Button>
              <Button variant="ghost" icon="plus" onPress={() => setCreating({})}>
                직접 추가
              </Button>
            </View>
          </View>
        ) : (
          <View style={{ gap: Spacing.lg }}>
            {grouped.map(({ slot, items: group }) => (
              <CareGroupSection
                key={slot}
                slot={slot}
                items={group}
                selecting={selecting}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelected}
                onIncrement={(item) =>
                  setCheck.mutate({ itemId: item.itemId, data: { date, count: item.count + 1 } })
                }
                onDecrement={(item) =>
                  setCheck.mutate({ itemId: item.itemId, data: { date, count: Math.max(0, item.count - 1) } })
                }
                onEdit={(item) => setEditing(item)}
              />
            ))}
            {/* 새 type 추가 — 편집 모드일 땐 숨김 */}
            {!selecting ? (
              <TouchableOpacity
                onPress={() => setCreating({})}
                activeOpacity={0.7}
                style={{
                  paddingVertical: Spacing.md,
                  borderRadius: Spacing.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: Spacing.xs,
                }}
              >
                <Feather name="plus" size={16} color={Colors.primaryDark} />
                <Text style={{ ...Typography.preset.body, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}>
                  다른 항목 추가
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* 날짜 선택 캘린더 modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable onPress={() => setPickerOpen(false)} style={{ flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: Spacing.lg }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: Colors.surfaceElevated, borderRadius: Spacing.borderRadius.lg, overflow: 'hidden' }}>
            <Calendar
              current={date}
              maxDate={today}
              onDayPress={(day) => {
                setDate(day.dateString);
                setPickerOpen(false);
              }}
              markedDates={{
                [date]: { selected: true, selectedColor: Colors.primary },
              }}
              theme={{
                backgroundColor: Colors.surfaceElevated,
                calendarBackground: Colors.surfaceElevated,
                textSectionTitleColor: Colors.text.secondary,
                selectedDayTextColor: Colors.white,
                todayTextColor: Colors.primaryDark,
                dayTextColor: Colors.text.primary,
                textDisabledColor: Colors.text.disabled,
                arrowColor: Colors.primaryDark,
                monthTextColor: Colors.text.primary,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* 일괄 삭제 floating action bar */}
      {selecting && selectedIds.size > 0 ? (
        <TouchableOpacity
          onPress={handleBulkDelete}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            bottom: Spacing.xxxl,
            left: Spacing.lg,
            right: Spacing.lg,
            backgroundColor: Colors.status.error,
            borderRadius: Spacing.borderRadius.lg,
            paddingVertical: Spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.sm,
            ...Elevation.floating,
          }}
        >
          <Feather name="trash-2" size={16} color={Colors.white} />
          <Text style={{ ...Typography.preset.body, color: Colors.white, fontWeight: Typography.weight.bold }}>
            {selectedIds.size}개 삭제
          </Text>
        </TouchableOpacity>
      ) : null}

      <CareItemModal
        visible={!!creating || !!editing}
        petId={selectedPetId}
        editing={editing}
        defaultType={typeof creating === 'object' && creating ? creating.type : undefined}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </View>
  );
}

function CareGroupSection({
  slot, items, selecting, selectedIds, onToggleSelect, onIncrement, onDecrement, onEdit,
}: {
  slot: TimeSlot;
  items: DailyCare[];
  selecting: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (itemId: number) => void;
  onIncrement: (item: DailyCare) => void;
  onDecrement: (item: DailyCare) => void;
  onEdit: (item: DailyCare) => void;
}) {
  const Colors = useColors();
  // 그룹의 첫 reminderTime — 헤더 옆 보조 표시.
  const firstTime = items.find((it) => it.reminderTime)?.reminderTime ?? null;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.sm, paddingHorizontal: 2 }}>
        <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
          {SLOT_LABEL[slot]}
        </Text>
        {firstTime ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
            {firstTime}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          backgroundColor: Colors.surfaceElevated,
          borderRadius: Spacing.borderRadius.lg,
          overflow: 'hidden',
        }}
      >
        {items.map((item, i) => (
          <View key={item.itemId}>
            {i > 0 ? (
              <View
                style={{
                  height: 1,
                  backgroundColor: Colors.border,
                  marginHorizontal: Spacing.md,
                }}
              />
            ) : null}
            <CareRow
              item={item}
              selecting={selecting}
              selected={selectedIds.has(item.itemId)}
              onSelect={() => onToggleSelect(item.itemId)}
              onIncrement={() => onIncrement(item)}
              onDecrement={() => onDecrement(item)}
              onEdit={() => onEdit(item)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function CareRow({
  item, selecting, selected, onSelect, onIncrement, onDecrement, onEdit,
}: {
  item: DailyCare;
  selecting: boolean;
  selected: boolean;
  onSelect: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onEdit: () => void;
}) {
  const Colors = useColors();
  const completed = item.count >= item.targetCount;

  // 편집 모드: 행 전체 탭 = 선택 토글, +/- · 체크 컨트롤 숨김
  if (selecting) {
    return (
      <TouchableOpacity
        onPress={onSelect}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: Spacing.md,
          backgroundColor: selected ? Colors.primaryLight : Colors.surfaceElevated,
          borderRadius: Spacing.borderRadius.lg,
          gap: Spacing.md,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: selected ? Colors.primary : Colors.borderStrong,
            backgroundColor: selected ? Colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected ? <Feather name="check" size={14} color={Colors.white} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...Typography.preset.body,
              color: Colors.text.primary,
              fontWeight: Typography.weight.semibold,
            }}
          >
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 }}>
            {item.reminderTime ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Feather name="bell" size={11} color={Colors.text.tertiary} />
                <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                  {item.reminderTime}
                </Text>
              </View>
            ) : null}
            {item.targetCount > 1 ? (
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                하루 {item.targetCount}회
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.surfaceElevated,
        gap: Spacing.md,
      }}
    >
      <TouchableOpacity onPress={onEdit} activeOpacity={0.7} style={{ flex: 1 }}>
        <Text
          style={{
            ...Typography.preset.body,
            color: Colors.text.primary,
            fontWeight: Typography.weight.semibold,
            textDecorationLine: completed ? 'line-through' : 'none',
          }}
        >
          <Text style={{ color: Colors.text.tertiary, fontWeight: Typography.weight.regular }}>
            ({TYPE_META[item.itemType].label})
          </Text>{' '}
          {item.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 }}>
          {item.reminderTime ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Feather name="bell" size={11} color={Colors.text.tertiary} />
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                {item.reminderTime}
              </Text>
            </View>
          ) : null}
          {item.targetCount > 1 ? (
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
              하루 {item.targetCount}회
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        {item.targetCount > 1 ? (
          <>
            <TouchableOpacity
              onPress={onDecrement}
              disabled={item.count === 0}
              hitSlop={Spacing.hitSlop}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: Colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: item.count === 0 ? 0.4 : 1,
              }}
            >
              <Feather name="minus" size={14} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text
              style={{
                ...Typography.preset.body,
                color: completed ? Colors.status.success : Colors.text.primary,
                fontWeight: Typography.weight.bold,
                minWidth: 36,
                textAlign: 'center',
              }}
            >
              {item.count}/{item.targetCount}
            </Text>
            <TouchableOpacity
              onPress={onIncrement}
              hitSlop={Spacing.hitSlop}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: completed ? Colors.status.success : Colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="plus" size={14} color={completed ? Colors.white : Colors.primaryDark} />
            </TouchableOpacity>
          </>
        ) : (
          // targetCount = 1 → 단순 토글 (아이콘만)
          <TouchableOpacity
            onPress={completed ? onDecrement : onIncrement}
            hitSlop={Spacing.hitSlop}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: completed ? Colors.status.success : Colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather
              name={completed ? 'check' : 'circle'}
              size={16}
              color={completed ? Colors.white : Colors.primaryDark}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function CareItemModal({
  visible, petId, editing, defaultType, onClose,
}: {
  visible: boolean;
  petId: number;
  editing: DailyCare | null;
  defaultType?: CareItemType;
  onClose: () => void;
}) {
  const Colors = useColors();
  const create = useCreateCareItem(petId);
  const update = useUpdateCareItem(petId);
  const remove = useDeleteCareItem(petId);

  const [name, setName] = useState('');
  const [type, setType] = useState<CareItemType>('MEAL');
  const [targetCount, setTargetCount] = useState('1');
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const initKey = `${visible}-${editing?.itemId ?? 'new'}-${defaultType ?? 'auto'}`;
  useMemoOnChange(initKey, () => {
    if (editing) {
      setName(editing.name);
      setType(editing.itemType);
      setTargetCount(String(editing.targetCount));
      setReminderTime(editing.reminderTime ?? null);
    } else {
      setName('');
      setType(defaultType ?? 'MEAL');
      setTargetCount('1');
      setReminderTime(null);
    }
  });

  if (!visible) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('이름을 입력해주세요');
      return;
    }
    const target = Math.max(1, Number(targetCount) || 1);
    const data = { name: trimmed, itemType: type, targetCount: target, reminderTime: reminderTime ?? undefined };

    if (editing) {
      update.mutate({ itemId: editing.itemId, data }, { onSuccess: onClose });
    } else {
      create.mutate(data, { onSuccess: onClose });
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert('항목 삭제', `"${editing.name}" 을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => remove.mutate(editing.itemId, { onSuccess: onClose }),
      },
    ]);
  };

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
            padding: Spacing.lg,
            paddingBottom: Spacing.xxxl,
            gap: Spacing.lg,
            ...Elevation.modal,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.border,
            }}
          />
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
            {editing ? '항목 수정' : '항목 추가'}
          </Text>

          {/* 이름 */}
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>이름</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="예: 종합 비타민, 오메가3"
              placeholderTextColor={Colors.text.tertiary}
              style={{
                ...Typography.preset.body,
                color: Colors.text.primary,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: Spacing.borderRadius.md,
                backgroundColor: Colors.surface,
              }}
            />
          </View>

          {/* 타입 */}
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>종류</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                {TYPE_ORDER.map((t) => {
                  const selected = t === type;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setType(t)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.sm,
                        borderRadius: Spacing.borderRadius.full,
                        backgroundColor: selected ? Colors.primary : Colors.surface,
                        borderWidth: 1,
                        borderColor: selected ? Colors.primary : Colors.border,
                      }}
                    >
                      <Text
                        style={{
                          ...Typography.preset.caption,
                          color: selected ? Colors.text.primary : Colors.text.secondary,
                          fontWeight: selected ? Typography.weight.bold : Typography.weight.medium,
                        }}
                      >
                        {TYPE_META[t].label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* 알림 시간 */}
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>알림 시간</Text>
            <TouchableOpacity
              onPress={() => setTimePickerOpen(true)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: Spacing.borderRadius.md,
                backgroundColor: Colors.surface,
              }}
            >
              <Text style={{ ...Typography.preset.body, color: reminderTime ? Colors.text.primary : Colors.text.tertiary }}>
                {reminderTime ?? '알림 없음'}
              </Text>
              <Feather name="clock" size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* 하루 목표 횟수 */}
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>하루 목표 횟수</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'stretch',
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: Spacing.borderRadius.md,
                backgroundColor: Colors.surface,
                width: 160,
                overflow: 'hidden',
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  const n = Math.max(1, (Number(targetCount) || 1) - 1);
                  setTargetCount(String(n));
                }}
                disabled={(Number(targetCount) || 1) <= 1}
                hitSlop={Spacing.hitSlop}
                style={{
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRightWidth: 1,
                  borderRightColor: Colors.border,
                  opacity: (Number(targetCount) || 1) <= 1 ? 0.4 : 1,
                }}
              >
                <Feather name="minus" size={16} color={Colors.text.primary} />
              </TouchableOpacity>
              <TextInput
                value={targetCount}
                onChangeText={(v) => setTargetCount(v.replace(/\D/g, ''))}
                onBlur={() => {
                  const n = Math.max(1, Number(targetCount) || 1);
                  setTargetCount(String(n));
                }}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={Colors.text.tertiary}
                textAlign="center"
                style={{
                  ...Typography.preset.body,
                  color: Colors.text.primary,
                  flex: 1,
                  paddingVertical: Spacing.sm,
                  fontWeight: Typography.weight.semibold,
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  const n = (Number(targetCount) || 1) + 1;
                  setTargetCount(String(n));
                }}
                hitSlop={Spacing.hitSlop}
                style={{
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderLeftWidth: 1,
                  borderLeftColor: Colors.border,
                }}
              >
                <Feather name="plus" size={16} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 액션 */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
            {editing ? (
              <Button variant="ghost" onPress={handleDelete} style={{ flex: 1 }}>
                삭제
              </Button>
            ) : (
              <Button variant="ghost" onPress={onClose} style={{ flex: 1 }}>
                취소
              </Button>
            )}
            <Button
              variant="primary"
              onPress={handleSave}
              loading={create.isPending || update.isPending}
              style={{ flex: 1 }}
            >
              {editing ? '저장' : '추가'}
            </Button>
          </View>
        </Pressable>
      </Pressable>

      <TimePickerModal
        visible={timePickerOpen}
        value={reminderTime}
        onChange={setReminderTime}
        onClose={() => setTimePickerOpen(false)}
        title="알림 시간"
        allowNull
      />
    </Modal>
  );
}

function useMemoOnChange(key: string, fn: () => void) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (last.current !== key) {
      last.current = key;
      fn();
    }
  }, [key, fn]);
}
