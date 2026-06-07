import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ensureMediaLibraryPermission } from '../../shared/utils/permissions';
import { useCreatePet, useUpdatePet, usePet, useDeletePet } from '../../features/pet/hooks/usePets';
import { petApi } from '../../features/pet/api/petApi';
import { BREED_PLACEHOLDER } from '../../features/pet/constants/speciesHints';
import { PET_COLOR_PALETTE, petColorOf } from '../../features/pet/constants/petColors';
import { Spacing, Typography, Elevation } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';
import DateInput from '../../shared/components/DateInput';
import Chip from '../../shared/components/Chip';
import type { Pet } from '../../features/pet/api/petApi';

const SPECIES: { label: string; value: Pet['species'] }[] = [
  { label: '강아지', value: 'DOG' },
  { label: '고양이', value: 'CAT' },
  { label: '새', value: 'BIRD' },
  { label: '파충류', value: 'REPTILE' },
  { label: '소동물', value: 'SMALL_ANIMAL' },
  { label: '기타', value: 'OTHER' },
];

const GENDERS: { label: string; value: Pet['gender'] }[] = [
  { label: '수컷', value: 'MALE' },
  { label: '암컷', value: 'FEMALE' },
  { label: '모름', value: 'UNKNOWN' },
];

const schema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  species: z.enum(['DOG', 'CAT', 'BIRD', 'REPTILE', 'SMALL_ANIMAL', 'OTHER']),
  breed: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']),
  isNeutered: z.boolean(),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function SectionLabel({ text }: { text: string }) {
  const Colors = useColors();
  return (
    <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.sm }}>
      {text}
    </Text>
  );
}

function PillSelector<T extends string>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg }}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

// 펫 식별 색 swatch 선택기 — 캘린더 마커·홈 요약에서 펫 구분에 쓰인다.
function ColorSelector({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const Colors = useColors();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg }}>
      {PET_COLOR_PALETTE.map((c) => {
        const selected = value === c;
        return (
          <TouchableOpacity
            key={c}
            onPress={() => onChange(c)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`색상 ${c}`}
            accessibilityState={{ selected }}
            hitSlop={Spacing.hitSlop}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: c,
              alignItems: 'center', justifyContent: 'center',
              // 선택된 swatch 만 ring + 체크. 미선택은 옅은 테두리로 흰 배경에서 경계 확보.
              borderWidth: selected ? 3 : 1,
              borderColor: selected ? Colors.text.primary : Colors.border,
            }}
          >
            {selected ? <Feather name="check" size={16} color={Colors.white} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function PetFormScreen() {
  const Colors = useColors();
  const { petId: petIdParam } = useLocalSearchParams<{ petId?: string }>();
  const petId = petIdParam ? Number(petIdParam) : undefined;
  const isEdit = !!petId;

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { data: existing } = usePet(petId ?? 0);
  const { mutate: create, isPending: creating } = useCreatePet();
  const { mutate: update, isPending: updating } = useUpdatePet(petId ?? 0);
  const { mutate: deletePet } = useDeletePet();
  const loading = creating || updating;

  const handleDelete = () => {
    if (!petId) return;
    const name = (existing as any)?.name ?? '이 반려동물';
    Alert.alert(
      `${name} 삭제`,
      `${name} 의 모든 진료기록·일정·다이어리·체중·케어 기록도 함께 삭제돼요.\n정말 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            router.replace('/(tabs)');
            deletePet(petId, {
              onError: (e: any) =>
                Alert.alert('삭제 실패', e?.response?.data?.message ?? '잠시 후 다시 시도해주세요.'),
            });
          },
        },
      ],
    );
  };

  const pickFromLibrary = async () => {
    if (!(await ensureMediaLibraryPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    if (isEdit && petId) {
      await petApi.uploadProfileImage(petId, uri).catch(() => {});
    }
  };

  const removePhoto = async () => {
    setPhotoUri(null);
    if (isEdit && petId) {
      await petApi.deleteProfileImage(petId).catch(() => {});
    }
  };

  const hasPhoto = !!(photoUri || existing?.profileImage);

  const handlePickPhoto = () => {
    if (!hasPhoto) {
      pickFromLibrary();
      return;
    }
    Alert.alert('프로필 사진', '', [
      { text: '사진 변경', onPress: pickFromLibrary },
      { text: '사진 삭제', style: 'destructive', onPress: removePhoto },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      species: 'DOG',
      breed: '',
      birthDate: '',
      gender: 'UNKNOWN',
      isNeutered: false,
      color: PET_COLOR_PALETTE[0],
    },
  });
  const watchedSpecies = watch('species');

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        species: existing.species,
        breed: existing.breed ?? '',
        birthDate: existing.birthDate ?? '',
        gender: existing.gender,
        isNeutered: existing.isNeutered,
        // 색 미지정(레거시) 펫은 id 기반 폴백색을 미리 선택해 보여준다.
        color: existing.color ?? petColorOf(existing),
      });
    }
  }, [existing]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      name: data.name,
      species: data.species,
      breed: data.breed || undefined,
      birthDate: data.birthDate || undefined,
      gender: data.gender,
      isNeutered: data.isNeutered,
      color: data.color || undefined,
    };
    if (isEdit) {
      update(payload, { onSuccess: () => router.back() });
    } else {
      create(payload, {
        onSuccess: async (newPet: Pet) => {
          if (photoUri && newPet.id) {
            await petApi.uploadProfileImage(newPet.id, photoUri).catch(() => {});
          }
          router.back();
        },
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title={isEdit ? '반려동물 수정' : '반려동물 등록'}
        back
        actions={[{ icon: 'check', label: '저장', onPress: handleSubmit(onSubmit) }]}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxxl }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={handlePickPhoto} style={{ alignSelf: 'center', marginBottom: Spacing.xl }}>
          <View
            style={{
              width: 96, height: 96, borderRadius: 48,
              backgroundColor: Colors.primaryLight,
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              ...Elevation.card,
            }}
          >
            {(photoUri || existing?.profileImage) ? (
              <Image source={{ uri: photoUri ?? existing?.profileImage ?? undefined }} style={{ width: 96, height: 96 }} />
            ) : (
              <Feather name="camera" size={32} color={Colors.primary} />
            )}
          </View>
          <View
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: Colors.primary,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: Colors.white,
            }}
          >
            <Feather name="plus" size={14} color={Colors.white} />
          </View>
        </Pressable>

        <SectionLabel text="이름 *" />
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="이름을 입력하세요"
              placeholderTextColor={Colors.text.tertiary}
              style={{
                borderWidth: 1,
                borderColor: errors.name ? Colors.status.error : Colors.border,
                borderRadius: Spacing.borderRadius.md,
                paddingHorizontal: Spacing.md,
                paddingVertical: 12,
                fontSize: Typography.size.md,
                color: Colors.text.primary,
                marginBottom: Spacing.lg,
                backgroundColor: Colors.white,
              }}
            />
          )}
        />
        {errors.name && (
          <Text style={{ ...Typography.preset.caption, color: Colors.status.error, marginTop: -Spacing.md, marginBottom: Spacing.md }}>
            {errors.name.message}
          </Text>
        )}

        <SectionLabel text="종류 *" />
        <Controller
          control={control}
          name="species"
          render={({ field: { value, onChange } }) => (
            <PillSelector options={SPECIES} value={value} onChange={onChange} />
          )}
        />

        <SectionLabel text="품종" />
        <Controller
          control={control}
          name="breed"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder={BREED_PLACEHOLDER[watchedSpecies]}
              placeholderTextColor={Colors.text.tertiary}
              style={{
                borderWidth: 1, borderColor: Colors.border,
                borderRadius: Spacing.borderRadius.md,
                paddingHorizontal: Spacing.md, paddingVertical: 12,
                fontSize: Typography.size.md, color: Colors.text.primary,
                marginBottom: Spacing.lg, backgroundColor: Colors.white,
              }}
            />
          )}
        />

        <SectionLabel text="생년월일" />
        <View style={{ marginBottom: Spacing.lg }}>
          <Controller
            control={control}
            name="birthDate"
            render={({ field: { value, onChange } }) => (
              <DateInput
                value={value}
                onChange={onChange}
                title="생년월일"
                maxDate={new Date().toISOString().split('T')[0]}
              />
            )}
          />
        </View>

        <SectionLabel text="성별 *" />
        <Controller
          control={control}
          name="gender"
          render={({ field: { value, onChange } }) => (
            <PillSelector options={GENDERS} value={value} onChange={onChange} />
          )}
        />

        <SectionLabel text="색상" />
        <Controller
          control={control}
          name="color"
          render={({ field: { value, onChange } }) => (
            <ColorSelector value={value} onChange={onChange} />
          )}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: Spacing.xxl,
            padding: Spacing.md,
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.md,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>중성화</Text>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
              수술 완료 여부
            </Text>
          </View>
          <Controller
            control={control}
            name="isNeutered"
            render={({ field: { value, onChange } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            )}
          />
        </View>

        <Button fullWidth size="lg" loading={loading} onPress={handleSubmit(onSubmit)}>
          {isEdit ? '수정 완료' : '등록하기'}
        </Button>

        {/* 수정 모드 + 공유받지 않은 펫만 삭제 가능 (백엔드 owner-only). */}
        {isEdit && !(existing as any)?.isShared ? (
          <View style={{ marginTop: Spacing.xl }}>
            <Button fullWidth size="lg" variant="danger" onPress={handleDelete}>
              반려동물 삭제
            </Button>
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.tertiary,
                textAlign: 'center',
                marginTop: Spacing.sm,
              }}
            >
              모든 진료기록·일정·다이어리·체중·케어 기록도 함께 삭제돼요.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
