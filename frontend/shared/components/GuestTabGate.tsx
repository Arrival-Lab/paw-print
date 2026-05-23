import { useState } from 'react';
import { View } from 'react-native';
import type { Feather } from '@expo/vector-icons';
import { useColors } from '../hooks/useTheme';
import { useUiStore } from '../store/uiStore';
import GlassHeader from './GlassHeader';
import EmptyState from './EmptyState';

interface Props {
  /** 글래스 헤더에 표시할 탭 타이틀 (예: "다이어리"). */
  tabTitle: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  /** 잠금 안내 타이틀. */
  title: string;
  /** 잠금 안내 본문. */
  description: string;
  /** 로그인 프롬프트 시트 헤딩. */
  loginPromptMessage: string;
}

/**
 * 게스트 모드에서 계정 기능 탭(다이어리·일상·건강) 진입 시 노출되는 잠금 화면.
 * 탭바·헤더는 살리고 본문만 EmptyState + 로그인 CTA 로 대체.
 * App Store 5.1.1(v) 대응: "이런 게 있다 — 로그인하면 쓸 수 있다" 패턴.
 */
export default function GuestTabGate({ tabTitle, icon, title, description, loginPromptMessage }: Props) {
  const Colors = useColors();
  const [headerHeight, setHeaderHeight] = useState(0);
  const showLoginPrompt = useUiStore((s) => s.showLoginPrompt);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <View style={{ flex: 1, paddingTop: headerHeight }}>
        <EmptyState
          icon={icon}
          title={title}
          description={description}
          action={{ label: '로그인하기', onPress: () => showLoginPrompt(loginPromptMessage) }}
        />
      </View>
      <GlassHeader title={tabTitle} onHeightChange={setHeaderHeight} />
    </View>
  );
}
