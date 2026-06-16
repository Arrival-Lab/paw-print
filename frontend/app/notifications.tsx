import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Switch, TouchableOpacity, Linking, Platform, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../features/auth/hooks/useNotificationPreferences';

interface CategoryRow {
  key: 'notifyVaccine' | 'notifyCare';
  icon: React.ComponentProps<typeof Feather>['name'];
  titleKey: string;
  descKey: string;
}

const CATEGORIES: CategoryRow[] = [
  { key: 'notifyVaccine', icon: 'shield', titleKey: 'notif.vaccineTitle', descKey: 'notif.vaccineDesc' },
  { key: 'notifyCare', icon: 'check-square', titleKey: 'notif.careTitle', descKey: 'notif.careDesc' },
];

export default function NotificationsScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const { mutate: updatePref } = useUpdateNotificationPreferences();

  // 시스템 알림 권한 상태 — 사용자가 시스템 설정에서 끄면 우리 토글이 켜져 있어도 알림 안 옴.
  // AppState 변화 시(설정 다녀온 후 복귀) 권한 재조회 → 안내 카드 즉시 갱신.
  const [systemGranted, setSystemGranted] = useState<boolean | null>(null);
  const refreshSystemPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setSystemGranted(status === 'granted');
  }, []);
  useEffect(() => {
    refreshSystemPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshSystemPermission();
    });
    return () => sub.remove();
  }, [refreshSystemPermission]);

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') Linking.openURL('app-settings:');
    else Linking.openSettings();
  };

  const handleToggle = (key: CategoryRow['key'], value: boolean) => {
    updatePref({ [key]: value });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title={t('notif.title')} back />

      {isLoading || !prefs ? (
        <LoadingSpinner label={t('common.loading')} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: Spacing.lg }}>
          {/* 시스템 권한 상태 카드 */}
          <Card variant={systemGranted === false ? 'tinted' : 'elevated'} padding="lg">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor:
                    systemGranted === false ? Colors.status.errorBg : Colors.status.successBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather
                  name={systemGranted === false ? 'bell-off' : 'bell'}
                  size={18}
                  color={systemGranted === false ? Colors.status.error : Colors.status.success}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...Typography.preset.bodyMedium,
                    color: Colors.text.primary,
                    fontWeight: Typography.weight.bold,
                  }}
                >
                  {systemGranted === null
                    ? t('notif.permChecking')
                    : systemGranted
                      ? t('notif.permGranted')
                      : t('notif.permOff')}
                </Text>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                  {systemGranted === false
                    ? t('notif.permOffDesc')
                    : t('notif.permGrantedDesc')}
                </Text>
              </View>
            </View>
            {systemGranted === false ? (
              <TouchableOpacity
                onPress={handleOpenSettings}
                activeOpacity={0.85}
                style={{
                  marginTop: Spacing.md,
                  alignSelf: 'flex-start',
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm,
                  borderRadius: Spacing.borderRadius.full,
                  backgroundColor: Colors.primaryDark,
                }}
              >
                <Text style={{ ...Typography.preset.caption, color: Colors.white, fontWeight: Typography.weight.bold }}>
                  {t('notif.openSystemSettings')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </Card>

          {/* 카테고리별 토글 */}
          <View>
            <Text
              style={{
                ...Typography.preset.bodySmall,
                color: Colors.text.secondary,
                fontWeight: Typography.weight.bold,
                marginBottom: Spacing.sm,
                paddingHorizontal: 2,
              }}
            >
              {t('notif.typesLabel')}
            </Text>
            <Card variant="elevated" padding="none">
              {CATEGORIES.map((cat, idx) => {
                const enabled = prefs[cat.key];
                return (
                  <View
                    key={cat.key}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Spacing.md,
                      paddingHorizontal: Spacing.lg,
                      paddingVertical: Spacing.lg,
                      borderTopWidth: idx === 0 ? 0 : 1,
                      borderTopColor: Colors.border,
                      opacity: systemGranted === false ? 0.5 : 1,
                    }}
                  >
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
                      <Feather name={cat.icon} size={16} color={Colors.primaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          ...Typography.preset.bodyMedium,
                          color: Colors.text.primary,
                          fontWeight: Typography.weight.semibold,
                        }}
                      >
                        {t(cat.titleKey)}
                      </Text>
                      <Text
                        style={{
                          ...Typography.preset.caption,
                          color: Colors.text.secondary,
                          marginTop: 2,
                        }}
                      >
                        {t(cat.descKey)}
                      </Text>
                    </View>
                    <Switch
                      value={enabled}
                      onValueChange={(v) => handleToggle(cat.key, v)}
                      trackColor={{ false: Colors.border, true: Colors.primary }}
                      thumbColor={Colors.white}
                      disabled={systemGranted === false}
                    />
                  </View>
                );
              })}
            </Card>
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.tertiary,
                marginTop: Spacing.sm,
                paddingHorizontal: 2,
                lineHeight: Typography.size.xs * 1.6,
              }}
            >
              {t('notif.footer')}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
