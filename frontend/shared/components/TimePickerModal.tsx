import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal, Pressable, View, Text, TouchableOpacity, ScrollView, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { Spacing, Typography, Elevation } from '../../constants';
import { useColors } from '../hooks/useTheme';
import Button from './Button';

interface Props {
  visible: boolean;
  /** "HH:mm" 또는 null */
  value: string | null;
  onChange: (time: string | null) => void;
  onClose: () => void;
  title?: string;
  /** true 면 "없음" 옵션 노출 (알림 끄기). */
  allowNull?: boolean;
}

const ROW_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const PICKER_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);  // 5분 단위

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export default function TimePickerModal({
  visible, value, onChange, onClose, title = '시간 선택', allowNull = true,
}: Props) {
  const Colors = useColors();
  const initial = useMemo(() => parseTime(value) ?? nowRoundedToFive(), [value]);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  // visible 변경 시 초기화 — value 있으면 그 시간, 없으면 현재 시각(5분 단위 반올림)
  useEffect(() => {
    if (visible) {
      const p = parseTime(value) ?? nowRoundedToFive();
      setHour(p.hour);
      setMinute(p.minute);
    }
  }, [visible, value]);

  const handleConfirm = () => {
    onChange(`${pad2(hour)}:${pad2(minute)}`);
    onClose();
  };

  const handleClear = () => {
    onChange(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        {/* backdrop — content View 와 분리해서 wheel ScrollView swipe 와 충돌 안 함. */}
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay }}
        />
        <View
          style={{
            marginTop: 'auto',
            backgroundColor: Colors.surfaceElevated,
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            padding: Spacing.lg,
            paddingBottom: Spacing.xxxl,
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
              marginBottom: Spacing.md,
            }}
          />
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary, fontWeight: Typography.weight.bold, marginBottom: Spacing.lg }}>
            {title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, height: PICKER_HEIGHT }}>
            <WheelColumn
              values={HOURS}
              value={hour}
              onChange={setHour}
              label="시"
            />
            <Text style={{ ...Typography.preset.heading, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>:</Text>
            <WheelColumn
              values={MINUTES}
              value={minute}
              onChange={setMinute}
              label="분"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg }}>
            {allowNull ? (
              <Button variant="ghost" onPress={handleClear} style={{ flex: 1 }}>
                알림 없음
              </Button>
            ) : (
              <Button variant="ghost" onPress={onClose} style={{ flex: 1 }}>
                취소
              </Button>
            )}
            <Button variant="primary" onPress={handleConfirm} style={{ flex: 1 }}>
              확인
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function WheelColumn({
  values, value, onChange, label,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const Colors = useColors();
  const scrollRef = useRef<ScrollView>(null);
  const initialIndex = Math.max(0, values.indexOf(value));

  useEffect(() => {
    // 마운트/value 변경 시 해당 인덱스로 스크롤
    const idx = values.indexOf(value);
    if (idx >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ y: idx * ROW_HEIGHT, animated: false });
    }
  }, [value, values]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ROW_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    const next = values[clamped];
    if (next !== value) onChange(next);
  };

  // tap-to-select — 시뮬레이터처럼 swipe 가 안 되는 환경 fallback.
  const selectByTap = (v: number, idx: number) => {
    onChange(v);
    scrollRef.current?.scrollTo({ y: idx * ROW_HEIGHT, animated: true });
  };

  return (
    <View style={{ flex: 1, height: PICKER_HEIGHT, position: 'relative' }}>
      {/* 선택 강조 영역 */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: ROW_HEIGHT * 2,
          left: 0,
          right: 0,
          height: ROW_HEIGHT,
          backgroundColor: Colors.primaryLight,
          borderRadius: Spacing.borderRadius.md,
        }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ROW_HEIGHT * 2 }}
        onMomentumScrollEnd={handleMomentumEnd}
        nestedScrollEnabled
      >
        {values.map((v, i) => {
          const active = v === value;
          return (
            <TouchableOpacity
              key={v}
              activeOpacity={0.7}
              onPress={() => selectByTap(v, i)}
              style={{
                height: ROW_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  ...Typography.preset.heading,
                  color: active ? Colors.primaryDark : Colors.text.tertiary,
                  fontWeight: active ? Typography.weight.bold : Typography.weight.medium,
                }}
              >
                {pad2(v)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text
        style={{
          position: 'absolute',
          right: 4,
          top: ROW_HEIGHT * 2 + 14,
          ...Typography.preset.caption,
          color: Colors.text.tertiary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function parseTime(v: string | null): { hour: number; minute: number } | null {
  if (!v) return null;
  const m = v.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

function nowRoundedToFive(): { hour: number; minute: number } {
  const d = new Date();
  const rounded = Math.round(d.getMinutes() / 5) * 5;
  if (rounded === 60) return { hour: (d.getHours() + 1) % 24, minute: 0 };
  return { hour: d.getHours(), minute: rounded };
}
