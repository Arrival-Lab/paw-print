import { useEffect, useState } from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { Spacing, Typography, Elevation } from '../../constants';
import { useColors } from '../hooks/useTheme';

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

export default function DatePickerModal({
  visible, value, onChange, onClose, title = '날짜 선택', minDate, maxDate,
}: Props) {
  const Colors = useColors();
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={Spacing.hitSlop}>
              <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }}>닫기</Text>
            </TouchableOpacity>
          </View>

          {/* 년도 navigation */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: Spacing.sm,
              marginBottom: Spacing.xs,
            }}
          >
            <TouchableOpacity
              onPress={() => setViewYear((y) => Math.max(minYear, y - 1))}
              disabled={viewYear <= minYear}
              hitSlop={Spacing.hitSlop}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: Colors.surface,
                opacity: viewYear <= minYear ? 0.4 : 1,
              }}
            >
              <Feather name="chevron-left" size={18} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={{ ...Typography.preset.heading, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
              {viewYear}년
            </Text>
            <TouchableOpacity
              onPress={() => setViewYear((y) => Math.min(maxYear, y + 1))}
              disabled={viewYear >= maxYear}
              hitSlop={Spacing.hitSlop}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: Colors.surface,
                opacity: viewYear >= maxYear ? 0.4 : 1,
              }}
            >
              <Feather name="chevron-right" size={18} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* 월 chip 그리드 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginBottom: Spacing.sm }}
            contentContainerStyle={{ gap: 6 }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const selected = m === viewMonth;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setViewMonth(m)}
                  activeOpacity={0.8}
                  style={{
                    width: 40,
                    height: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    {m}월
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Calendar
            key={calendarDate}  // current 변경 시 강제 리렌더
            current={calendarDate}
            onDayPress={(day) => {
              onChange(day.dateString);
              onClose();
            }}
            onMonthChange={(m) => {
              setViewYear(m.year);
              setViewMonth(m.month);
            }}
            minDate={minDate}
            maxDate={maxDate}
            markedDates={value ? { [value]: { selected: true, selectedColor: Colors.primary } } : {}}
            hideArrows={false}
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
