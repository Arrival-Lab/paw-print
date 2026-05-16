import { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, TextInput, ScrollView, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, Elevation } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Button from '../../../shared/components/Button';
import EmptyState from '../../../shared/components/EmptyState';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
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

const todayIso = () => new Date().toISOString().split('T')[0];

export function CareTab({ selectedPetId }: { selectedPetId: number | null }) {
  const Colors = useColors();
  const date = todayIso();
  const { data: items, isLoading } = useCareDay(selectedPetId ?? 0, date);
  const setCheck = useSetCareCheck(selectedPetId ?? 0);
  const [editing, setEditing] = useState<DailyCare | null>(null);
  const [creating, setCreating] = useState(false);

  const summary = useMemo(() => {
    const list = items ?? [];
    const totalTargets = list.reduce((s, i) => s + i.targetCount, 0);
    const totalCompleted = list.reduce((s, i) => s + Math.min(i.count, i.targetCount), 0);
    const pct = totalTargets === 0 ? 0 : Math.round((totalCompleted / totalTargets) * 100);
    return { totalTargets, totalCompleted, pct };
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
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}>
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
                  backgroundColor: Colors.primaryDark,
                }}
              />
            </View>
          </View>
        ) : null}

        {/* 항목 리스트 */}
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
                케어 항목을 추가해보세요
              </Text>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, textAlign: 'center' }}>
                매일 챙길 사료·간식·영양제·산책 등을{'\n'}체크리스트로 관리할 수 있어요
              </Text>
            </View>
            <Button variant="primary" icon="plus" onPress={() => setCreating(true)}>
              항목 추가
            </Button>
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {list.map((item) => (
              <CareRow
                key={item.itemId}
                item={item}
                onIncrement={() =>
                  setCheck.mutate({
                    itemId: item.itemId,
                    data: { date, count: item.count + 1 },
                  })
                }
                onDecrement={() =>
                  setCheck.mutate({
                    itemId: item.itemId,
                    data: { date, count: Math.max(0, item.count - 1) },
                  })
                }
                onEdit={() => setEditing(item)}
              />
            ))}
            <TouchableOpacity
              onPress={() => setCreating(true)}
              activeOpacity={0.7}
              style={{
                marginTop: Spacing.sm,
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
                항목 추가
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CareItemModal
        visible={creating || !!editing}
        petId={selectedPetId}
        editing={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </View>
  );
}

function CareRow({
  item, onIncrement, onDecrement, onEdit,
}: {
  item: DailyCare;
  onIncrement: () => void;
  onDecrement: () => void;
  onEdit: () => void;
}) {
  const Colors = useColors();
  const meta = TYPE_META[item.itemType];
  const completed = item.count >= item.targetCount;
  const palette = completed
    ? { bg: Colors.primaryLight, fg: Colors.primaryDark }
    : { bg: Colors.surface, fg: Colors.text.tertiary };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Spacing.borderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.md,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={meta.icon} size={16} color={palette.fg} />
      </View>
      <TouchableOpacity
        onPress={onEdit}
        activeOpacity={0.7}
        style={{ flex: 1 }}
      >
        <Text
          style={{
            ...Typography.preset.body,
            color: Colors.text.primary,
            fontWeight: Typography.weight.semibold,
            textDecorationLine: completed ? 'line-through' : 'none',
          }}
        >
          {item.name}
        </Text>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
          {meta.label} · 하루 {item.targetCount}회
        </Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
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
            color: completed ? Colors.primaryDark : Colors.text.primary,
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
            backgroundColor: completed ? Colors.primaryDark : Colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name="plus" size={14} color={completed ? Colors.white : Colors.primaryDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CareItemModal({
  visible, petId, editing, onClose,
}: {
  visible: boolean;
  petId: number;
  editing: DailyCare | null;
  onClose: () => void;
}) {
  const Colors = useColors();
  const create = useCreateCareItem(petId);
  const update = useUpdateCareItem(petId);
  const remove = useDeleteCareItem(petId);

  const [name, setName] = useState('');
  const [type, setType] = useState<CareItemType>('MEAL');
  const [targetCount, setTargetCount] = useState('1');

  // visible 또는 editing 변경 시 초기화
  const initKey = `${visible}-${editing?.itemId ?? 'new'}`;
  useMemoOnChange(initKey, () => {
    if (editing) {
      setName(editing.name);
      setType(editing.itemType);
      setTargetCount(String(editing.targetCount));
    } else {
      setName('');
      setType('MEAL');
      setTargetCount('1');
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
    const data = { name: trimmed, itemType: type, targetCount: target };

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
              placeholder="예: 아침 사료, 종합 영양제"
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
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Feather
                        name={TYPE_META[t].icon}
                        size={14}
                        color={selected ? Colors.text.primary : Colors.text.secondary}
                      />
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

          {/* 하루 목표 횟수 */}
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>하루 목표 횟수</Text>
            <TextInput
              value={targetCount}
              onChangeText={(v) => setTargetCount(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="1"
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
                width: 100,
              }}
            />
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
    </Modal>
  );
}

// 작은 helper — visible/editing 변할 때만 form 초기화. useMemo 의 부수효과 패턴.
import { useEffect, useRef } from 'react';
function useMemoOnChange(key: string, fn: () => void) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (last.current !== key) {
      last.current = key;
      fn();
    }
  }, [key, fn]);
}
