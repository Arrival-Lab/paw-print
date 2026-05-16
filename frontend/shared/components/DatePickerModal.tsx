import { Modal, Pressable, View, Text, TouchableOpacity } from 'react-native';
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

export default function DatePickerModal({
  visible, value, onChange, onClose, title = '날짜 선택', minDate, maxDate,
}: Props) {
  const Colors = useColors();
  const today = new Date().toISOString().split('T')[0];
  const current = value ?? today;

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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={Spacing.hitSlop}>
              <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }}>닫기</Text>
            </TouchableOpacity>
          </View>
          <Calendar
            current={current}
            onDayPress={(day) => {
              onChange(day.dateString);
              onClose();
            }}
            minDate={minDate}
            maxDate={maxDate}
            markedDates={value ? { [value]: { selected: true, selectedColor: Colors.primary } } : {}}
            theme={{
              calendarBackground: Colors.surfaceElevated,
              arrowColor: Colors.primary,
              monthTextColor: Colors.text.primary,
              textMonthFontWeight: Typography.weight.bold,
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
