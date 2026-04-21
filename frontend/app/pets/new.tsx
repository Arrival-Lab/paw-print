import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCreatePet, useUpdatePet, usePet } from '../../features/pet/hooks/usePets';
import { petApi } from '../../features/pet/api/petApi';
import { Colors, Spacing, Typography } from '../../constants';
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
  return (
    <Text style={{ fontSize: Typography.size.sm, fontWeight: Typography.weight.medium,
      color: Colors.text.secondary, marginBottom: Spacing.sm }}>
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
        <TouchableOpacity
          key={o.value}
          onPress={() => onChange(o.value)}
          style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
            borderRadius: Spacing.borderRadius.full, borderWidth: 1,
            backgroundColor: value === o.value ? Colors.primary : Colors.white,
            borderColor: value === o.value ? Colors.primary : Colors.border }}>
          <Text style={{ fontSize: Typography.size.sm,
            color: value === o.value ? Colors.white : Colors.text.secondary }}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function PetFormScreen() {
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

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: existing?.name ?? '',
      species: existing?.species ?? 'DOG',
      breed: existing?.breed ?? '',
      birthDate: existing?.birthDate ?? '',
      gender: existing?.gender ?? 'UNKNOWN',
      isNeutered: existing?.isNeutered ?? false,
    },
  });

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
    <SafeAreaView className="flex-1 bg-background">
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.lg,
          fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          {isEdit ? '반려동물 수정' : '반려동물 등록'}
        </Text>
        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={loading} hitSlop={8}>
          {loading
            ? <ActivityIndicator color={Colors.primary} />
            : <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
                color: Colors.primary }}>저장</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
        {/* 프로필 사진 */}
        <TouchableOpacity
          onPress={handlePickPhoto}
          style={{ alignSelf: 'center', marginBottom: Spacing.xl }}>
          <View style={{ width: 88, height: 88, borderRadius: 44,
            backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
            {(photoUri || existing?.profileImage) ? (
              <Image
                source={{ uri: photoUri ?? existing?.profileImage ?? undefined }}
                style={{ width: 88, height: 88 }}
              />
            ) : (
              <Feather name="camera" size={28} color={Colors.text.disabled} />
            )}
          </View>
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26,
            borderRadius: 13, backgroundColor: Colors.primary,
            alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="plus" size={14} color={Colors.white} />
          </View>
        </TouchableOpacity>

        {/* 이름 */}
        <SectionLabel text="이름 *" />
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="이름을 입력하세요"
              placeholderTextColor={Colors.text.disabled}
              style={{ borderWidth: 1, borderColor: errors.name ? Colors.status.error : Colors.border,
                borderRadius: Spacing.borderRadius.md, paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm + 2, fontSize: Typography.size.md,
                color: Colors.text.primary, marginBottom: Spacing.lg }}
            />
          )}
        />
        {errors.name && (
          <Text style={{ color: Colors.status.error, fontSize: Typography.size.sm,
            marginTop: -Spacing.md, marginBottom: Spacing.md }}>
            {errors.name.message}
          </Text>
        )}

        {/* 종 */}
        <SectionLabel text="종류 *" />
        <Controller
          control={control}
          name="species"
          render={({ field: { value, onChange } }) => (
            <PillSelector options={SPECIES} value={value} onChange={onChange} />
          )}
        />

        {/* 품종 */}
        <SectionLabel text="품종" />
        <Controller
          control={control}
          name="breed"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="예: 말티즈"
              placeholderTextColor={Colors.text.disabled}
              style={{ borderWidth: 1, borderColor: Colors.border,
                borderRadius: Spacing.borderRadius.md, paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm + 2, fontSize: Typography.size.md,
                color: Colors.text.primary, marginBottom: Spacing.lg }}
            />
          )}
        />

        {/* 생년월일 */}
        <SectionLabel text="생년월일" />
        <Controller
          control={control}
          name="birthDate"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.text.disabled}
              style={{ borderWidth: 1, borderColor: Colors.border,
                borderRadius: Spacing.borderRadius.md, paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm + 2, fontSize: Typography.size.md,
                color: Colors.text.primary, marginBottom: Spacing.lg }}
            />
          )}
        />

        {/* 성별 */}
        <SectionLabel text="성별 *" />
        <Controller
          control={control}
          name="gender"
          render={({ field: { value, onChange } }) => (
            <PillSelector options={GENDERS} value={value} onChange={onChange} />
          )}
        />

        {/* 중성화 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: Spacing.xxxl }}>
          <Text style={{ fontSize: Typography.size.md, color: Colors.text.primary }}>중성화</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}
