import { Pressable, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';
import PetContextBadge from '../../features/pet/components/PetContextBadge';

interface ActionItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  label?: string;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean | (() => void);
  actions?: ActionItem[];
  variant?: 'default' | 'large' | 'transparent';
  style?: ViewStyle;
  /** true 면 응급병원 우상단 글로벌 액션을 숨김 (글쓰기 modal·더보기 본인 화면 등). */
  hideEmergency?: boolean;
  /** @deprecated 마이페이지는 탭(더보기)으로 통합됨. 호환을 위해 prop 만 유지. */
  hideMypage?: boolean;
  /** 헤더 본문 아래에 렌더링되는 컨텍스트 영역 — PetSelector 등 펫 컨텍스트가 화면 단위로 공통일 때 사용. */
  children?: React.ReactNode;
  /**
   * 화면에 작업 중인 펫 컨텍스트 표시. 지정 시 타이틀 아래에 작은 칩(아바타+이름) 노출.
   * - `'global'`: petFilterStore.selectedPetId 추적 (탭/리스트 화면용)
   * - 숫자: 해당 펫 고정 표시 (쓰기·상세 화면용, locked)
   * - undefined: 표시 안 함
   */
  petBadge?: 'global' | number | null;
  /** petBadge 탭 시 핸들러 (글로벌 모드에서 PetSelector 시트 등). 미지정 시 비활성. */
  onPetBadgePress?: () => void;
}

export default function ScreenHeader({
  title,
  subtitle,
  back = false,
  actions,
  variant = 'default',
  style,
  hideEmergency = false,
  children,
  petBadge,
  onPetBadgePress,
}: ScreenHeaderProps) {
  const Colors = useColors();
  const handleBack = () => {
    if (typeof back === 'function') {
      back();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  const isLarge = variant === 'large';
  const bg = variant === 'transparent' ? 'transparent' : Colors.white;

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.sm,
          paddingBottom: isLarge ? Spacing.md : Spacing.sm,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
        {back ? (
          <Pressable
            onPress={handleBack}
            hitSlop={Spacing.hitSlop}
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: Spacing.xs,
              marginLeft: -Spacing.sm,
            }}
          >
            <Feather name="chevron-left" size={26} color={Colors.text.primary} />
          </Pressable>
        ) : null}

        {!isLarge && (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' }}>
              <Text numberOfLines={1} style={{ ...Typography.preset.title, color: Colors.text.primary, flexShrink: 1 }}>
                {title}
              </Text>
              {petBadge !== undefined ? (
                <PetContextBadge
                  petId={petBadge === 'global' ? undefined : petBadge}
                  locked={petBadge !== 'global'}
                  onPress={petBadge === 'global' ? onPetBadgePress : undefined}
                />
              ) : null}
            </View>
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        )}

        {isLarge && <View style={{ flex: 1 }} />}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
          {actions?.map((a, i) => (
            <Pressable
              key={`${a.icon}-${i}`}
              onPress={a.onPress}
              hitSlop={Spacing.hitSlop}
              accessibilityLabel={a.label}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name={a.icon} size={20} color={Colors.text.primary} />
            </Pressable>
          ))}
          {!hideEmergency ? <EmergencyAction /> : null}
        </View>
      </View>

      {isLarge ? (
        <View style={{ marginTop: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' }}>
            <Text style={{ ...Typography.preset.h1, color: Colors.text.primary }}>{title}</Text>
            {petBadge !== undefined ? (
              <PetContextBadge
                petId={petBadge === 'global' ? undefined : petBadge}
                locked={petBadge !== 'global'}
                onPress={petBadge === 'global' ? onPetBadgePress : undefined}
              />
            ) : null}
          </View>
          {subtitle ? (
            <Text style={{ marginTop: 4, ...Typography.preset.body, color: Colors.text.secondary }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}

      {children ? <View style={{ marginTop: Spacing.xs }}>{children}</View> : null}
    </View>
  );
}

// 평상시: 작은 아이콘만. 심야 (22~06시): 라벨 + 빨강 chip 으로 강조.
// 의료 앱의 "긴장감 노출" 회피를 위해 시간 컨텍스트에 따라 위계 자동 전환.
function EmergencyAction() {
  const Colors = useColors();
  const hour = new Date().getHours();
  const isLateNight = hour >= 22 || hour < 6;

  if (isLateNight) {
    return (
      <Pressable
        onPress={() => router.push('/hospital')}
        hitSlop={Spacing.hitSlop}
        accessibilityLabel="응급/24시 동물병원 찾기"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: Spacing.borderRadius.full,
          backgroundColor: Colors.status.errorBg,
        }}
      >
        <Feather name="plus-square" size={14} color={Colors.status.error} />
        <Text
          style={{
            ...Typography.preset.caption,
            color: Colors.status.error,
            fontWeight: Typography.weight.bold,
          }}
        >
          24시 병원
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push('/hospital')}
      hitSlop={Spacing.hitSlop}
      accessibilityLabel="응급/24시 동물병원 찾기"
      style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
    >
      <Feather name="plus-square" size={20} color={Colors.status.error} />
    </Pressable>
  );
}
