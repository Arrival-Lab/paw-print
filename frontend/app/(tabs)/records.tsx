import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRecords(selectedPetId ?? 0);
  const parseOcr = useParseOcr();

  const records: MedicalRecordSummary[] =
    data?.pages.flatMap((page) => page.content) ?? [];

  const handleOcr = async (launchFn: () => Promise<ImagePicker.ImagePickerResult>) => {
    setShowActionSheet(false);
    const result = await launchFn();
    if (result.canceled || !result.assets?.[0]) return;

    setOcrLoading(true);
    try {
      await parseOcr.mutateAsync(result.assets[0].uri);
      // TODO: navigate to create screen with pre-filled OCR data
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCamera = () =>
    handleOcr(() =>
      ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images }),
    );

  const handleGallery = () =>
    handleOcr(() =>
      ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images }),
    );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 헤더 */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
        <Text
          style={{
            fontSize: Typography.size.xl,
            fontWeight: Typography.weight.bold,
            color: Colors.text.primary,
          }}
        >
          진료기록
        </Text>
      </View>

      {/* 반려동물 선택 탭 */}
      <PetSelector onPetChange={setSelectedPetId} />

      {/* 진료기록 목록 */}
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.md,
          paddingBottom: 100,
          flexGrow: 1,
        }}
        renderItem={({ item }) => <RecordCard record={item} />}
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
                { label: '직접 입력', onPress: () => setShowActionSheet(false) },
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
