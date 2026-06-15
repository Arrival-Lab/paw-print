import { useEffect, useState } from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { Spacing, Typography, Elevation } from '../../constants';
import { useColors } from '../hooks/useTheme';
import { useBottomSheetSafePadding } from '../hooks/useBottomSheetSafePadding';

interface Props {
  visible: boolean;
  /** "yyyy-MM-dd" */
  value: string | null;
  onChange: (date: string) => void;
  onClose: () => void;
  title?: string;
  /** "yyyy-MM-dd". null/undefined = 무제한. */
  minDate?: string;
  maxDate?: string;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function ArrowGroup({
  value, onPrev, onNext, prevDisabled, nextDisabled,
}: {
  value: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  const Colors = useColors();
  const btnStyle = (disabled?: boolean) => ({
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.surface,
    opacity: disabled ? 0.4 : 1,
  });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
      <TouchableOpacity onPress={onPrev} disabled={prevDisabled} hitSlop={Spacing.hitSlop} style={btnStyle(prevDisabled)}>
        <Feather name="chevron-left" size={16} color={Colors.text.primary} />
      </TouchableOpacity>
      <Text
        style={{
          ...Typography.preset.body,
          color: Colors.text.primary,
          fontWeight: Typography.weight.bold,
          minWidth: 56,
          textAlign: 'center',
        }}
      >
        {value}
      </Text>
      <TouchableOpacity onPress={onNext} disabled={nextDisabled} hitSlop={Spacing.hitSlop} style={btnStyle(nextDisabled)}>
        <Feather name="chevron-right" size={16} color={Colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
}

export default function DatePickerModal({
  visible, value, onChange, onClose, title, minDate, maxDate,
}: Props) {
  const Colors = useColors();
  const { t } = useTranslation();
  const padBottom = useBottomSheetSafePadding();
  const today = new Date();
  const initial = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth() + 1);

  // visible 또는 value 변경 시 viewDate 초기화
  useEffect(() => {
    if (visible) {
      const d = value ? new Date(value) : new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth() + 1);
    }
  }, [visible, value]);

  const calendarDate = `${viewYear}-${pad2(viewMonth)}-01`;
  const minYear = minDate ? new Date(minDate).getFullYear() : viewYear - 10;
  const maxYear = maxDate ? new Date(maxDate).getFullYear() : viewYear + 10;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: Colors.overlay }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: 'auto',
            backgroundColor: Colors.surfaceElevated,
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            padding: Spacing.lg,
            paddingBottom: padBottom,
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
              {title ?? t('picker.date')}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={Spacing.hitSlop}>
              <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }}>{t('action.close')}</Text>
            </TouchableOpacity>
          </View>

          {/* 년/월 nav — 한 줄, 양쪽에 [< 값 >] */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              paddingVertical: Spacing.sm,
              marginBottom: Spacing.sm,
              gap: Spacing.lg,
            }}
          >
            <ArrowGroup
              value={`${viewYear}년`}
              onPrev={() => setViewYear((y) => Math.max(minYear, y - 1))}
              onNext={() => setViewYear((y) => Math.min(maxYear, y + 1))}
              prevDisabled={viewYear <= minYear}
              nextDisabled={viewYear >= maxYear}
            />
            <ArrowGroup
              value={`${viewMonth}월`}
              onPrev={() => {
                if (viewMonth === 1) {
                  if (viewYear > minYear) {
                    setViewYear(viewYear - 1);
                    setViewMonth(12);
                  }
                } else {
                  setViewMonth(viewMonth - 1);
                }
              }}
              onNext={() => {
                if (viewMonth === 12) {
                  if (viewYear < maxYear) {
                    setViewYear(viewYear + 1);
                    setViewMonth(1);
                  }
                } else {
                  setViewMonth(viewMonth + 1);
                }
              }}
            />
          </View>

          <Calendar
            key={calendarDate}  // current 변경 시 강제 리렌더
            current={calendarDate}
            onDayPress={(day) => {
              onChange(day.dateString);
              onClose();
            }}
            minDate={minDate}
            maxDate={maxDate}
            markedDates={value ? { [value]: { selected: true, selectedColor: Colors.primary } } : {}}
            hideArrows
            renderHeader={() => null}  // 자체 header 숨김 (위 년도/월 사용)
            theme={{
              calendarBackground: Colors.surfaceElevated,
              arrowColor: Colors.primary,
              textDayHeaderFontWeight: Typography.weight.semibold,
              textSectionTitleColor: Colors.text.tertiary,
              todayTextColor: Colors.primaryDark,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.text.inverse,
              dayTextColor: Colors.text.primary,
              textDisabledColor: Colors.text.disabled,
            }}
            style={{ backgroundColor: Colors.surfaceElevated }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
