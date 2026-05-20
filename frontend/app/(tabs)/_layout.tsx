import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { Elevation, Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { useUpcomingVaccinesCount } from '../../features/vaccine/hooks/useUpcomingVaccinesCount';
import GlassTabBarBackground from '../../shared/components/GlassTabBarBackground';

export default function TabsLayout() {
  const Colors = useColors();
  const upcomingVaccines = useUpcomingVaccinesCount();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: Typography.size.xxs,
          fontWeight: Typography.weight.semibold,
          letterSpacing: Typography.letterSpacing.wide,
          marginTop: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.select({ ios: 84, android: 64 }),
          paddingTop: Spacing.sm,
          paddingBottom: Platform.select({ ios: 24, android: Spacing.sm }),
          paddingHorizontal: Spacing.xxl,  // 양쪽 끝 탭 안쪽으로 끌어옴
        },
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="diary"
        options={{
          title: '다이어리',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="calendar" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '기록',
          tabBarBadge: upcomingVaccines > 0 ? upcomingVaccines : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.status.error,
            color: Colors.white,
            fontSize: Typography.size.caption,
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="book-open" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <HomeTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: '커뮤니티',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="message-circle" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: '더보기',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="menu" color={color} focused={focused} />
          ),
        }}
      />
      {/* 케어는 기록 탭의 '일상' sub-tab으로 통합 — care.tsx 는 redirect 유지. */}
      <Tabs.Screen name="care" options={{ href: null }} />
    </Tabs>
  );
}

interface TabIconProps {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
  focused: boolean;
}

function TabIcon({ name, color, focused }: TabIconProps) {
  const Colors = useColors();
  return (
    <View
      style={{
        width: 40,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Spacing.borderRadius.full,
        backgroundColor: focused ? Colors.primaryLight : 'transparent',
        marginTop: -8,
      }}
    >
      <Feather name={name} size={20} color={color} />
    </View>
  );
}

function HomeTabIcon({ focused }: { focused: boolean }) {
  const Colors = useColors();
  return (
    <View
      style={{
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: focused ? Colors.primary : Colors.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -14,
        borderWidth: 4,
        borderColor: Colors.white,
        ...Elevation.floating,
      }}
    >
      <Feather name="home" size={30} color={focused ? Colors.white : Colors.primaryDark} />
    </View>
  );
}
