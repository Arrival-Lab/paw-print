import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, SectionList, TouchableOpacity, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants';
import PetSelector from '../../features/pet/components/PetSelector';
import RecordCard from '../../features/record/components/RecordCard';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { useRecords, useParseOcr } from '../../features/record/hooks/useRecords';
import type { MedicalRecordSummary } from '../../features/record/api/recordApi';

export default function RecordsScreen() {
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [isTimeline, setIsTimeline] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRecords(selectedPetId ?? 0);
  const parseOcr = useParseOcr();

  const records: MedicalRecordSummary[] =
    data?.pages.flatMap((page) => page.content) ?? [];

  const timelineSections = useMemo(() => {
    const map = new Map<string, MedicalRecordSummary[]>();
    records.forEach((r) => {
      const key = r.visitedAt.slice(0, 7); // YYYY-MM
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).map(([month, data]) => ({
      title: month,
      data,
    }));
  }, [records]);

  const handleOcr = async (launchFn: () => Promise<ImagePicker.ImagePickerResult>) => {
    setShowActionSheet(false);
    const result = await launchFn();
    if (result.canceled || !result.assets?.[0]) return;

    setOcrLoading(true);
    try {
      const ocr = await parseOcr.mutateAsync(result.assets[0].uri);
      router.push({
        pathname: '/records/create',
        params: { petId: selectedPetId, ocr: JSON.stringify(ocr) },
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCamera = () =>
    handleOcr(() =>
      ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaType.Images }),
    );

  const handleGallery = () =>
    handleOcr(() =>
      ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType.Images }),
    );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
        <Text style={{ flex: 1, fontSize: Typography.size.xl,
          fontWeight: Typography.weight.bold, color: Colors.text.primary }}>
          진료기록
        </Text>
        <TouchableOpacity
          onPress={() => setIsTimeline((v) => !v)}
          style={{ padding: Spacing.xs }}
          hitSlop={8}>
          <Feather
            name={isTimeline ? 'list' : 'clock'}
            size={22}
            color={isTimeline ? Colors.primary : Colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* 반려동물 선택 탭 */}
      <PetSelector onPetChange={setSelectedPetId} />

      {/* 진료기록 목록 / 타임라인 */}
      {isTimeline ? (
        <SectionList
          sections={timelineSections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: 100, flexGrow: 1 }}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            selectedPetId ? (
              <EmptyState icon="file-text" title="진료기록이 없어요" description="첫 진료기록을 추가해보세요" />
            ) : null
          }
          renderSectionHeader={({ section: { title } }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
              backgroundColor: Colors.background }}>
              <View style={{ width: 10, height: 10, borderRadius: 5,
                backgroundColor: Colors.primary, marginRight: Spacing.sm }} />
              <Text style={{ fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold,
                color: Colors.primary }}>
                {title}
              </Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <View style={{ flexDirection: 'row', paddingLeft: Spacing.lg }}>
              {/* 타임라인 선 */}
              <View style={{ width: 20, alignItems: 'center' }}>
                <View style={{ width: 2, flex: 1, backgroundColor: Colors.border,
                  marginTop: index === 0 ? Spacing.md : 0,
                  marginBottom: index === section.data.length - 1 ? 0 : 0 }} />
              </View>
              <View style={{ flex: 1, paddingRight: Spacing.lg, paddingBottom: Spacing.sm }}>
                <RecordCard
                  record={item}
                  onPress={() => router.push({
                    pathname: '/records/[id]',
                    params: { id: item.id, petId: selectedPetId },
                  })}
                />
              </View>
            </View>
          )}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={{ paddingVertical: Spacing.md }} />
            ) : null
          }
        />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.md,
            paddingBottom: 100,
            flexGrow: 1,
          }}
          renderItem={({ item }) => (
            <RecordCard
              record={item}
              onPress={() => router.push({
                pathname: '/records/[id]',
                params: { id: item.id, petId: selectedPetId },
              })}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            selectedPetId ? (
              <EmptyState
                icon="file-text"
                title="진료기록이 없어요"
                description="첫 진료기록을 추가해보세요"
              />
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={{ paddingVertical: Spacing.md }} />
            ) : null
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowActionSheet(true)}
        style={{
          position: 'absolute',
          bottom: Spacing.xxxl,
          right: Spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: Colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Text style={{ fontSize: 28, color: Colors.text.inverse, lineHeight: 32 }}>+</Text>
      </TouchableOpacity>

      {/* ActionSheet */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: Colors.overlay }}
          onPress={() => setShowActionSheet(false)}
        >
          <Pressable>
            <View
              style={{
                backgroundColor: Colors.white,
                borderTopLeftRadius: Spacing.borderRadius.xl,
                borderTopRightRadius: Spacing.borderRadius.xl,
                paddingTop: Spacing.md,
                paddingBottom: Spacing.xxxxl,
              }}
            >
              {[
                {
                  label: '직접 입력',
                  onPress: () => {
                    setShowActionSheet(false);
                    router.push({ pathname: '/records/create', params: { petId: selectedPetId } });
                  },
                },
                { label: '처방전 촬영', onPress: handleCamera },
                { label: '갤러리에서 선택', onPress: handleGallery },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  style={{ paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl }}
                >
                  <Text
                    style={{
                      fontSize: Typography.size.lg,
                      color: Colors.text.primary,
                      textAlign: 'center',
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* OCR 로딩 오버레이 */}
      {ocrLoading && (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: Colors.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.md,
          }}
        >
          <LoadingSpinner />
          <Text
            style={{
              fontSize: Typography.size.md,
              color: Colors.white,
              fontWeight: Typography.weight.medium,
            }}
          >
            처방전을 분석 중이에요...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
