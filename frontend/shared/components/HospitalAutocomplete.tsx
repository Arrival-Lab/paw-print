import { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';
import { useHospitalSuggestions } from '../../features/record/hooks/useRecords';

interface Props {
  petId: number;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

/**
 * 병원명 입력 + autocomplete.
 * - 같은 펫에 대해 이전에 입력한 병원명(진료기록 + 진료일정 union) 을 추천.
 * - focus 됐고 입력값과 부분 일치하는 항목이 있으면 dropdown 노출.
 */
export default function HospitalAutocomplete({
  petId,
  value,
  onChange,
  placeholder = '예: 행복동물병원',
  hasError,
}: Props) {
  const Colors = useColors();
  const [focused, setFocused] = useState(false);
  const { data: suggestions = [] } = useHospitalSuggestions(petId);

  const filtered = useMemo(() => {
    const v = value.trim().toLowerCase();
    const list = (suggestions ?? []) as unknown as string[];
    return list
      .filter((s) => s && s.toLowerCase() !== v)
      .filter((s) => v.length === 0 || s.toLowerCase().includes(v))
      .slice(0, 5);
  }, [suggestions, value]);

  const showDropdown = focused && filtered.length > 0;

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        onFocus={() => setFocused(true)}
        // 짧은 지연 — 추천 항목 탭 이벤트가 onBlur 전에 처리되도록
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        style={{
          borderWidth: 1,
          borderColor: hasError ? Colors.status.error : Colors.border,
          borderRadius: Spacing.borderRadius.md,
          paddingHorizontal: Spacing.md,
          paddingVertical: 12,
          fontSize: Typography.size.md,
          color: Colors.text.primary,
          backgroundColor: Colors.surfaceElevated,
        }}
      />
      {showDropdown ? (
        <View
          style={{
            marginTop: 4,
            backgroundColor: Colors.surfaceElevated,
            borderRadius: Spacing.borderRadius.md,
            borderWidth: 1,
            borderColor: Colors.border,
            overflow: 'hidden',
          }}
        >
          {filtered.map((s, i) => (
            <TouchableOpacity
              key={s}
              onPress={() => {
                onChange(s);
                setFocused(false);
              }}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.sm,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: Colors.border,
              }}
            >
              <Feather name="clock" size={12} color={Colors.text.tertiary} />
              <Text
                style={{
                  ...Typography.preset.body,
                  color: Colors.text.primary,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}
