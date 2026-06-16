import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, Elevation } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';

interface Props {
  /** 검색어 제출 (지역/장소명). */
  onSubmit: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
}

/**
 * 지도 위에 떠 있는 지역 검색바. 첨부 레퍼런스의 상단 검색바와 동일 역할 —
 * "강남역, 동성로, 부산" 같은 지역명을 입력하면 지도가 그 지역으로 이동 후 검색.
 */
export default function HospitalSearchBar({ onSubmit, loading = false, placeholder }: Props) {
  const Colors = useColors();
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  const submit = () => {
    const q = value.trim();
    if (q.length > 0) onSubmit(q);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Spacing.borderRadius.full,
        paddingHorizontal: Spacing.lg,
        height: 48,
        ...Elevation.floating,
      }}
    >
      <Feather name="search" size={18} color={Colors.text.tertiary} />
      <TextInput
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        returnKeyType="search"
        placeholder={placeholder ?? t('hospital.searchPlaceholder')}
        placeholderTextColor={Colors.text.tertiary}
        style={{ flex: 1, ...Typography.preset.body, color: Colors.text.primary, paddingVertical: 0 }}
      />
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primaryDark} />
      ) : value.length > 0 ? (
        <TouchableOpacity onPress={() => setValue('')} hitSlop={Spacing.hitSlop}>
          <Feather name="x" size={18} color={Colors.text.tertiary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
