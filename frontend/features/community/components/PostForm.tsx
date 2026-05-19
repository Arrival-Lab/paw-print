import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Typography, Spacing, Config } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Button from '../../../shared/components/Button';
import { useAuthStore } from '../../auth/store/authStore';
import { useUiStore } from '../../../shared/store/uiStore';
import type { PostTag } from '../api/communityApi';

const schema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  content: z.string().min(1, '내용을 입력하세요'),
  tag: z.enum(['SYMPTOM_SHARE', 'HOSPITAL_REVIEW', 'INFO_SHARE']),
});

type FormValues = z.infer<typeof schema>;

const TAGS: { label: string; value: PostTag }[] = [
  { label: '#증상공유', value: 'SYMPTOM_SHARE' },
  { label: '#병원후기', value: 'HOSPITAL_REVIEW' },
  { label: '#정보공유', value: 'INFO_SHARE' },
];

interface Props {
  onSubmit: (data: FormValues, photoUris: string[]) => void;
  loading?: boolean;
}

export function PostForm({ onSubmit, loading }: Props) {
  const Colors = useColors();
  const isFree = useAuthStore((s) => s.user?.subscriptionType !== 'PREMIUM');
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tag: 'INFO_SHARE' },
  });

  const photoLimit = Config.freeMaxPhotosPerRecord;
  const limitReached = isFree && photoUris.length >= photoLimit;

  const handleAddPhoto = async () => {
    if (limitReached) {
      showPremiumModal(`무료 플랜은 사진을 ${photoLimit}장까지 첨부할 수 있어요.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '사진 첨부를 위해 갤러리 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (uri: string) => {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, gap: Spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 태그 */}
        <View>
          <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.sm }}>태그</Text>
          <Controller
            control={control}
            name="tag"
            render={({ field: { value, onChange } }) => (
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {TAGS.map((t) => {
                  const selected = value === t.value;
                  return (
                    <TouchableOpacity
                      key={t.value}
                      onPress={() => onChange(t.value)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.sm,
                        borderRadius: Spacing.borderRadius.full,
                        borderWidth: 1,
                        backgroundColor: selected ? Colors.primary : Colors.surfaceElevated,
                        borderColor: selected ? Colors.primary : Colors.border,
                      }}
                    >
                      <Text
                        style={{
                          ...Typography.preset.caption,
                          fontWeight: Typography.weight.semibold,
                          color: selected ? Colors.text.primary : Colors.text.secondary,
                        }}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
        </View>

        {/* 제목 */}
        <View>
          <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.sm }}>제목</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="제목을 입력하세요"
                placeholderTextColor={Colors.text.tertiary}
                maxLength={80}
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                style={{
                  ...Typography.preset.body,
                  color: Colors.text.primary,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: Spacing.borderRadius.md,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.md,
                }}
              />
            )}
          />
          {errors.title && (
            <Text style={{ ...Typography.preset.caption, color: Colors.status.error, marginTop: Spacing.xs }}>
              {errors.title.message}
            </Text>
          )}
        </View>

        {/* 내용 */}
        <View>
          <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.sm }}>내용</Text>
          <Controller
            control={control}
            name="content"
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="내용을 입력하세요"
                placeholderTextColor={Colors.text.tertiary}
                multiline
                textAlignVertical="top"
                style={{
                  ...Typography.preset.body,
                  color: Colors.text.primary,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: Spacing.borderRadius.md,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.md,
                  minHeight: 220,
                }}
              />
            )}
          />
          {errors.content && (
            <Text style={{ ...Typography.preset.caption, color: Colors.status.error, marginTop: Spacing.xs }}>
              {errors.content.message}
            </Text>
          )}
        </View>

        {/* 사진 */}
        <View>
          <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.sm }}>
            사진 {photoUris.length > 0 ? `(${photoUris.length}${isFree ? `/${photoLimit}` : ''})` : ''}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
            {photoUris.map((uri) => (
              <View key={uri}>
                <Image
                  source={{ uri }}
                  style={{ width: 88, height: 88, borderRadius: Spacing.borderRadius.md }}
                />
                <TouchableOpacity
                  onPress={() => handleRemovePhoto(uri)}
                  hitSlop={Spacing.hitSlop}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: Colors.status.error,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather name="x" size={12} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={handleAddPhoto}
              activeOpacity={0.7}
              style={{
                width: 88,
                height: 88,
                borderRadius: Spacing.borderRadius.md,
                borderWidth: 1.5,
                borderColor: limitReached ? Colors.border : Colors.primary,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: limitReached ? Colors.surface : Colors.primaryLight,
                opacity: limitReached ? 0.5 : 1,
              }}
            >
              <Feather
                name="plus"
                size={24}
                color={limitReached ? Colors.text.disabled : Colors.primary}
              />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 등록 */}
        <Button
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSubmit((data) => onSubmit(data, photoUris))}
          fullWidth
        >
          등록
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
