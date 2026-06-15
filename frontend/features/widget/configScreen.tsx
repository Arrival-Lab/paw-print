import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StatusBar } from 'react-native';
import type { WidgetConfigurationScreenProps } from 'react-native-android-widget';
import { Colors, Spacing, Typography } from '../../constants';
import { renderWidget } from './renderWidget';
import { readSnapshot, writeConfig } from './widgetStorage';
import type { WidgetConfig, WidgetName } from './types';

/**
 * 위젯 추가 시 뜨는 설정 화면 (Android configuration activity, 일반 RN).
 * "전체 / 특정 펫" 선택 → 인스턴스(widgetId)별 설정 저장 + 미리보기 렌더 + 완료.
 * 펫이 0~1마리면 UI 없이 'all' 로 자동 확정.
 */
export function WidgetConfigurationScreen({
  widgetInfo,
  renderWidget: preview,
  setResult,
}: WidgetConfigurationScreenProps) {
  const name = widgetInfo.widgetName as WidgetName;
  const snapshot = readSnapshot();
  const pets = snapshot?.pets ?? [];
  const skip = pets.length <= 1;

  const [selected, setSelected] = useState<WidgetConfig>('all');

  const confirm = (cfg: WidgetConfig) => {
    writeConfig(widgetInfo.widgetId, cfg);
    preview(renderWidget(name, snapshot, widgetInfo.width, cfg));
    setResult('ok');
  };

  // 펫 0~1마리 → 선택 의미 없음. 자동 'all' 확정.
  useEffect(() => {
    if (skip) confirm('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (skip) return <View style={{ flex: 1, backgroundColor: Colors.surface }} />;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, paddingTop: (StatusBar.currentHeight ?? 0) + Spacing.xl }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl }}>
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
      </ScrollView>

      <View style={{ padding: Spacing.xl, gap: Spacing.sm }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => confirm(selected)}
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
