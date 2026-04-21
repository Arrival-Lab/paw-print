import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants';

const NOTICES = [
  { id: 1, title: '발자국 서비스 오픈 안내', date: '2025-01-01', content: '발자국 서비스가 정식 오픈되었습니다. 반려동물과 함께하는 건강 일지를 시작해보세요!' },
  { id: 2, title: '이용약관 업데이트 안내', date: '2025-01-15', content: '개인정보처리방침 및 이용약관이 일부 업데이트되었습니다. 앱 설정에서 확인하실 수 있습니다.' },
];

export default function NoticesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.lg,
          fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          공지사항
        </Text>
      </View>

      <FlatList
        data={NOTICES}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: Spacing.lg }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: Spacing.md }}>
            <Text style={{ fontSize: Typography.size.xs, color: Colors.text.tertiary,
              marginBottom: Spacing.xs }}>
              {item.date}
            </Text>
            <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
              color: Colors.text.primary, marginBottom: Spacing.sm }}>
              {item.title}
            </Text>
            <Text style={{ fontSize: Typography.size.sm, color: Colors.text.secondary,
              lineHeight: Typography.size.sm * Typography.lineHeight.normal }}>
              {item.content}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
