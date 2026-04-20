import { useState, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography } from '../../../constants';
import Button from '../../../shared/components/Button';
import type { DiaryPhoto } from '../api/diaryApi';
import { formatDate } from '../../../shared/utils/format';

interface DiaryEditorProps {
  date: string;
  initialContent?: string;
  initialTags?: string[];
  photos?: DiaryPhoto[];
  subscriptionType?: 'FREE' | 'PREMIUM';
  isSaving?: boolean;
  onSave: (data: { content: string; tags: string[] }) => void;
  onAddPhoto?: (uri: string) => void;
  onDeletePhoto?: (photoId: number) => void;
}

export default function DiaryEditor({
  date,
  initialContent = '',
  initialTags = [],
  photos = [],
  subscriptionType = 'FREE',
  isSaving = false,
  onSave,
  onAddPhoto,
  onDeletePhoto,
}: DiaryEditorProps) {
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

  const handleAddPhoto = async () => {
    if (subscriptionType === 'FREE' && photos.length >= 2) {
      setShowPremiumTooltip(true);
      setTimeout(() => setShowPremiumTooltip(false), 2500);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets?.[0]) {
      onAddPhoto?.(result.assets[0].uri);
    }
  };

  const isPhotoLimitReached = subscriptionType === 'FREE' && photos.length >= 2;

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
              <View key={photo.id}>
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
                  <Text style={{ fontSize: 12, color: Colors.white, lineHeight: 14 }}>×</Text>
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
                <Text
                  style={{
                    fontSize: 24,
                    color: isPhotoLimitReached ? Colors.text.disabled : Colors.primary,
                  }}
                >
                  +
                </Text>
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
        label="저장"
        onPress={() => onSave({ content, tags })}
        loading={isSaving}
        fullWidth
      />
    </ScrollView>
  );
}
