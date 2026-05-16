import { useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';
import DatePickerModal from './DatePickerModal';

interface Props {
  /** "yyyy-MM-dd" */
  value: string | null | undefined;
  onChange: (date: string) => void;
  placeholder?: string;
  title?: string;
  /** "yyyy-MM-dd" — 선택 가능 범위 제한 */
  minDate?: string;
  maxDate?: string;
  /** 외부에서 boolean error 전달 시 borderColor 빨강. */
  hasError?: boolean;
}

export default function DateInput({
  value, onChange, placeholder = 'YYYY-MM-DD', title, minDate, maxDate, hasError,
}: Props) {
  const Colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm + 2,
          borderWidth: 1,
          borderColor: hasError ? Colors.status.error : Colors.border,
          borderRadius: Spacing.borderRadius.md,
          backgroundColor: Colors.surfaceElevated,
        }}
      >
        <Text
          style={{
            ...Typography.preset.body,
            color: value ? Colors.text.primary : Colors.text.tertiary,
          }}
        >
          {value || placeholder}
        </Text>
        <Feather name="calendar" size={16} color={Colors.text.tertiary} />
      </TouchableOpacity>
      <DatePickerModal
        visible={open}
        value={value ?? null}
        onChange={onChange}
        onClose={() => setOpen(false)}
        title={title}
        minDate={minDate}
        maxDate={maxDate}
      />
    </>
  );
}
