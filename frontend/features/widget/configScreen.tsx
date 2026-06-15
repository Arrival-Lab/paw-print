import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StatusBar } from 'react-native';
import type { WidgetConfigurationScreenProps } from 'react-native-android-widget';
import { Colors, Spacing, Typography } from '../../constants';
import { renderWidget } from './renderWidget';
import { readSnapshot, writeConfig, writeTheme } from './widgetStorage';
import type { WidgetConfig, WidgetName, WidgetTheme } from './types';

const THEME_OPTIONS: { value: WidgetTheme; label: string }[] = [
  { value: 'system', label: '자동' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

/**
 * 위젯 추가 시 뜨는 설정 화면 (Android configuration activity, 일반 RN).
 * "전체 / 특정 펫" + 테마(자동/라이트/다크) 선택 → 인스턴스(widgetId)별 저장 + 미리보기 + 완료.
 */
export function WidgetConfigurationScreen({
  widgetInfo,
  renderWidget: preview,
  setResult,
}: WidgetConfigurationScreenProps) {
  const name = widgetInfo.widgetName as WidgetName;
  const snapshot = readSnapshot();
  const pets = snapshot?.pets ?? [];

  const [selected, setSelected] = useState<WidgetConfig>('all');
  const [theme, setTheme] = useState<WidgetTheme>('system');

  const confirm = () => {
    writeConfig(widgetInfo.widgetId, selected);
    writeTheme(widgetInfo.widgetId, theme);
    preview(renderWidget(name, snapshot, widgetInfo.width, widgetInfo.height, selected, theme));
    setResult('ok');
  };

  const multiPet = pets.length > 1;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, paddingTop: (StatusBar.currentHeight ?? 0) + Spacing.xl }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl }}>
        {multiPet ? (
          <>
            <Text style={{ ...Typography.preset.h2, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
              어떤 아이를 볼까요?
            </Text>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: Spacing.xs, marginBottom: Spacing.lg }}>
              이 위젯에 표시할 대상이에요. 나중에 위젯을 길게 눌러 바꿀 수 있어요.
            </Text>

            <OptionRow
              label={`전체 ${pets.length}마리`}
              emoji="🐾"
              selected={selected === 'all'}
              onPress={() => setSelected('all')}
            />
            {pets.map((p) => (
              <OptionRow
                key={p.id}
                label={p.name}
                image={p.image}
                selected={selected === p.id}
                onPress={() => setSelected(p.id)}
              />
            ))}
          </>
        ) : null}

        <Text
          style={{
            ...Typography.preset.h2,
            color: Colors.text.primary,
            fontWeight: Typography.weight.bold,
            marginTop: multiPet ? Spacing.xl : 0,
          }}
        >
          테마
        </Text>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: Spacing.xs, marginBottom: Spacing.lg }}>
          자동은 휴대폰 설정을 따라요. 다크모드여도 라이트로 고정할 수 있어요.
        </Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {THEME_OPTIONS.map((opt) => {
            const on = theme === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.8}
                onPress={() => setTheme(opt.value)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: Spacing.md,
                  borderRadius: Spacing.borderRadius.lg,
                  backgroundColor: on ? Colors.primaryLight : Colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: on ? Colors.primary : Colors.border,
                }}
              >
                <Text
                  style={{
                    ...Typography.preset.body,
                    color: on ? Colors.primaryDark : Colors.text.secondary,
                    fontWeight: on ? Typography.weight.bold : Typography.weight.medium,
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ padding: Spacing.xl, gap: Spacing.sm }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={confirm}
          style={{
            backgroundColor: Colors.primaryDark,
            borderRadius: Spacing.borderRadius.lg,
            paddingVertical: Spacing.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ ...Typography.preset.button, color: Colors.white }}>이 위젯에 적용</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setResult('cancel')} style={{ alignItems: 'center', paddingVertical: Spacing.sm }}>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>취소</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function OptionRow({
  label,
  emoji,
  image,
  selected,
  onPress,
}: {
  label: string;
  emoji?: string;
  image?: string | null;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Spacing.borderRadius.lg,
        backgroundColor: selected ? Colors.primaryLight : Colors.surfaceElevated,
        borderWidth: 1,
        borderColor: selected ? Colors.primary : Colors.border,
        marginBottom: Spacing.sm,
      }}
    >
      {image ? (
        <Image source={{ uri: image }} style={{ width: 36, height: 36, borderRadius: 18 }} />
      ) : (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: Colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16 }}>{emoji ?? label.slice(0, 1)}</Text>
        </View>
      )}
      <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold, flex: 1 }}>
        {label}
      </Text>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? Colors.primary : Colors.borderStrong,
          backgroundColor: selected ? Colors.primary : 'transparent',
        }}
      />
    </TouchableOpacity>
  );
}
