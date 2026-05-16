import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, Dimensions, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Typography, Spacing } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import { useOnboardingStore } from '../shared/store/onboardingStore';
import Button from '../shared/components/Button';

const { width } = Dimensions.get('window');

interface Slide {
  emoji: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🐾',
    title: '발자국에 오신 것을\n환영해요',
    description: '반려동물의 건강과 추억을\n한 곳에서 관리해요',
  },
  {
    emoji: '🐶',
    title: '먼저 반려동물을\n등록해보세요',
    description: '여러 마리도 OK.\n각자의 다이어리와 진료기록을 따로 관리해요',
  },
  {
    emoji: '📝',
    title: '진료기록은 사진으로\n자동 입력',
    description: '처방전을 찍으면 OCR이\n약·증상·다음 방문일을 알아서 채워줘요',
  },
  {
    emoji: '💬',
    title: '같은 고민을 나누는\n반려인 커뮤니티',
    description: '증상·병원·정보를 익명으로 공유.\n도움이 필요할 때 함께해요',
  },
];

export default function OnboardingScreen() {
  const Colors = useColors();
  const markCompleted = useOnboardingStore((s) => s.markCompleted);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  const handleNext = () => {
    if (isLast) {
      markCompleted();
      router.replace('/(tabs)');
    } else {
      flatListRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  const handleSkip = () => {
    markCompleted();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top', 'bottom']}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.sm,
        }}
      >
        <TouchableOpacity onPress={handleSkip} hitSlop={Spacing.hitSlop}>
          <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.tertiary }}>건너뛰기</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl }}>
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: Colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing.xxxl,
              }}
            >
              <Text style={{ fontSize: 80 }}>{item.emoji}</Text>
            </View>
            <Text
              style={{
                ...Typography.preset.display,
                fontSize: 28,
                color: Colors.text.primary,
                textAlign: 'center',
                lineHeight: 38,
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                ...Typography.preset.body,
                color: Colors.text.secondary,
                textAlign: 'center',
                marginTop: Spacing.lg,
                lineHeight: 24,
              }}
            >
              {item.description}
            </Text>
          </View>
        )}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: Spacing.sm,
          paddingVertical: Spacing.xl,
        }}
      >
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? Colors.primary : Colors.border,
            }}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl }}>
        <Button onPress={handleNext} fullWidth icon={isLast ? undefined : 'arrow-right'} iconPosition="right">
          {isLast ? '시작하기' : '다음'}
        </Button>
      </View>
    </SafeAreaView>
  );
}
