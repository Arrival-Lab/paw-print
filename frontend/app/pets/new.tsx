import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCreatePet, useUpdatePet, usePet } from '../../features/pet/hooks/usePets';
import { petApi } from '../../features/pet/api/petApi';
import { Spacing, Typography, Elevation } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';
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

export default function PetFormScreen() {
  const Colors = useColors();
  const { petId: petIdParam } = useLocalSearchParams<{ petId?: string }>();
  const petId = petIdParam ? Number(petIdParam) : undefined;
  const isEdit = !!petId;

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { data: existing } = usePet(petId ?? 0);
  const { mutate: create, isPending: creating } = useCreatePet();
  const { mutate: update, isPending: updating } = useUpdatePet(petId ?? 0);
  const loading = creating || updating;

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
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

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      species: 'DOG',
      breed: '',
      birthDate: '',
      gender: 'UNKNOWN',
      isNeutered: false,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        species: existing.species,
        breed: existing.breed ?? '',
        birthDate: existing.birthDate ?? '',
        gender: existing.gender,
        isNeutered: existing.isNeutered,
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
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxxl }} keyboardShouldPersistTaps="handled">
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
              placeholder="예: 말티즈"
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
        <Controller
          control={control}
          name="birthDate"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="YYYY-MM-DD"
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

        <SectionLabel text="성별 *" />
        <Controller
          control={control}
          name="gender"
          render={({ field: { value, onChange } }) => (
            <PillSelector options={GENDERS} value={value} onChange={onChange} />
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
      </ScrollView>
    </SafeAreaView>
  );
}
