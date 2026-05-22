import { useState, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, Config } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Button from '../../../shared/components/Button';
import type { DiaryPhoto } from '../api/diaryApi';
import { formatDate } from '../../../shared/utils/format';

interface DiaryEditorProps {
  date: string;
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  photos?: DiaryPhoto[];
  /** 신규 다이어리 작성 시 아직 서버 업로드 전인 로컬 uri 들. */
  pendingPhotoUris?: string[];
  subscriptionType?: 'FREE' | 'PREMIUM';
  isSaving?: boolean;
  hidePhotos?: boolean;
  multiPetNote?: string;
  /** ScrollView 최상단에 삽입되는 슬롯 — 일상 트래킹 빠른 입력 칩 등. */
  headerSlot?: React.ReactNode;
  onSave: (data: { title: string; content: string; tags: string[] }) => void;
  onAddPhoto?: (uri: string) => void;
  onDeletePhoto?: (photoId: number) => void;
  /** 신규 모드 — pendingPhotoUris 에서 특정 uri 제거. */
  onRemovePendingPhoto?: (uri: string) => void;
}

export default function DiaryEditor({
  date,
  initialTitle = '',
  initialContent = '',
  initialTags = [],
  photos = [],
  pendingPhotoUris = [],
  subscriptionType = 'FREE',
  isSaving = false,
  hidePhotos = false,
  multiPetNote,
  headerSlot,
  onSave,
  onAddPhoto,
  onDeletePhoto,
  onRemovePendingPhoto,
}: DiaryEditorProps) {
  const Colors = useColors();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [showPremiumTooltip, setShowPremiumTooltip] = useState(false);
  const tagInputRef = useRef<TextInput>(null);

  const addTag = () => {
    const trimmed = tagInput.replace(/^#/, '').trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyPress = ({ nativeEvent }: { nativeEvent: { key: string } }) => {
    if (nativeEvent.key === 'Backspace' && tagInput === '') {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const isFree = subscriptionType === 'FREE';
  const totalPhotoCount = photos.length + pendingPhotoUris.length;
  const remainingSlots = isFree ? Math.max(Config.freeMaxPhotosPerRecord - totalPhotoCount, 0) : 99;
  const isPhotoLimitReached = isFree && totalPhotoCount >= Config.freeMaxPhotosPerRecord;

  const handleAddPhoto = async () => {
    if (isPhotoLimitReached) {
      setShowPremiumTooltip(true);
      setTimeout(() => setShowPremiumTooltip(false), 2500);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // 무료: 남은 슬롯 만큼만 선택. 1 슬롯이면 단일 모드 (picker UI 단순화).
      allowsMultipleSelection: remainingSlots > 1,
      selectionLimit: remainingSlots,
      // iOS HEIC → JPEG 강제 변환 (quality 지정 시 iOS 가 JPEG 로 export).
      // HEIC 채로 보내면 백엔드/S3 처리에서 일부 사진이 실패함.
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    // 한도 초과 방지 — 사용자가 picker 에서 슬롯보다 많이 선택한 경우 잘라냄.
    const assets = result.assets.slice(0, remainingSlots);
    // 동시 업로드 시 multipart race + invalidate 타이밍 문제로 일부가 누락될 수 있어 직렬 처리.
    for (const a of assets) {
      await onAddPhoto?.(a.uri);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}
      keyboardShouldPersistTaps="handled"
    >
      {/* 날짜 */}
      <Text
        style={{
          fontSize: Typography.size.sm,
          color: Colors.text.secondary,
          fontWeight: Typography.weight.medium,
        }}
      >
        {formatDate(date)}
      </Text>

      {headerSlot}

      {multiPetNote ? (
        <View
          style={{
            backgroundColor: Colors.secondaryLight,
            borderRadius: Spacing.borderRadius.md,
            padding: Spacing.md,
          }}
        >
          <Text style={{ fontSize: Typography.size.sm, color: Colors.text.primary }}>
            {multiPetNote}
          </Text>
        </View>
      ) : null}

      {/* 제목 입력 */}
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="제목 (선택)"
        placeholderTextColor={Colors.text.disabled}
        maxLength={120}
        style={{
          fontSize: Typography.size.lg,
          fontWeight: Typography.weight.bold,
          color: Colors.text.primary,
          paddingVertical: Spacing.xs,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      />

      {/* 내용 입력 */}
      <TextInput
        value={content}
        onChangeText={setContent}
        multiline
        placeholder="오늘 어떤 하루를 보냈나요?"
        placeholderTextColor={Colors.text.disabled}
        style={{
          fontSize: Typography.size.md,
          color: Colors.text.primary,
          lineHeight: Typography.size.md * Typography.lineHeight.relaxed,
          minHeight: 160,
          textAlignVertical: 'top',
        }}
      />

      {/* 태그 섹션 */}
      <View>
        <Text
          style={{
            fontSize: Typography.size.sm,
            color: Colors.text.secondary,
            marginBottom: Spacing.sm,
          }}
        >
          태그
        </Text>

        {/* 태그 칩들 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm }}>
          {tags.map((tag, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => removeTag(index)}
              style={{
                backgroundColor: Colors.primaryLight,
                borderRadius: Spacing.borderRadius.full,
                paddingVertical: Spacing.xs,
                paddingHorizontal: Spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Text style={{ fontSize: Typography.size.sm, color: Colors.primary }}>#{tag}</Text>
              <Text style={{ fontSize: Typography.size.xs, color: Colors.primary }}>×</Text>
            </TouchableOpacity>
          ))}

          {/* 태그 입력 */}
          <TouchableOpacity
            onPress={() => tagInputRef.current?.focus()}
            style={{
              borderRadius: Spacing.borderRadius.full,
              paddingVertical: Spacing.xs,
              paddingHorizontal: Spacing.md,
              borderWidth: 1,
              borderColor: Colors.border,
              minWidth: 80,
            }}
          >
            <TextInput
              ref={tagInputRef}
              value={tagInput}
              onChangeText={(text) => {
                const cleaned = text.startsWith('#') ? text.slice(1) : text;
                setTagInput(cleaned);
              }}
              onSubmitEditing={addTag}
              onKeyPress={handleTagKeyPress}
              placeholder="# 태그 추가"
              placeholderTextColor={Colors.text.disabled}
              returnKeyType="done"
              style={{
                fontSize: Typography.size.sm,
                color: Colors.text.primary,
                padding: 0,
              }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 사진 섹션 */}
      <View>
        <Text
          style={{
            fontSize: Typography.size.sm,
            color: Colors.text.secondary,
            marginBottom: Spacing.sm,
          }}
        >
          사진
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {photos.map((photo) => (
              <View key={`server-${photo.id}`}>
                <Image
                  source={{ uri: photo.photoUrl }}
                  style={{ width: 80, height: 80, borderRadius: Spacing.borderRadius.md }}
                />
                <TouchableOpacity
                  onPress={() => onDeletePhoto?.(photo.id)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: Colors.status.error,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather name="x" size={12} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            {/* 신규 모드 — 아직 서버 업로드 전인 로컬 uri 들. 저장 시 일괄 업로드. */}
            {pendingPhotoUris.map((uri) => (
              <View key={`pending-${uri}`}>
                <Image
                  source={{ uri }}
                  style={{ width: 80, height: 80, borderRadius: Spacing.borderRadius.md }}
                />
                <TouchableOpacity
                  onPress={() => onRemovePendingPhoto?.(uri)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: Colors.status.error,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather name="x" size={12} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}

            {/* 사진 추가 버튼 */}
            <View>
              <TouchableOpacity
                onPress={handleAddPhoto}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: Spacing.borderRadius.md,
                  borderWidth: 1.5,
                  borderColor: isPhotoLimitReached ? Colors.border : Colors.primary,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isPhotoLimitReached ? Colors.surface : Colors.primaryLight,
                  opacity: isPhotoLimitReached ? 0.5 : 1,
                }}
              >
                <Feather
                  name="plus"
                  size={24}
                  color={isPhotoLimitReached ? Colors.text.disabled : Colors.primary}
                />
              </TouchableOpacity>

              {showPremiumTooltip && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 90,
                    left: -40,
                    backgroundColor: Colors.text.primary,
                    borderRadius: Spacing.borderRadius.sm,
                    padding: Spacing.sm,
                    width: 160,
                  }}
                >
                  <Text style={{ fontSize: Typography.size.xs, color: Colors.white }}>
                    프리미엄 구독 시 무제한 사진 첨부
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* 저장 버튼 */}
      <Button
        variant="primary"
        onPress={() => onSave({ title: title.trim(), content, tags })}
        loading={isSaving}
        fullWidth
      >
        저장
      </Button>
    </ScrollView>
  );
}
