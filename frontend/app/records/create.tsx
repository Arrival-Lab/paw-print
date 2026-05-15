import React from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRecord, useCreateRecord, useUpdateRecord } from '../../features/record/hooks/useRecords';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';
import type { RecordRequest } from '../../features/record/api/recordApi';

const schema = z.object({
  visitedAt: z.string().min(1, '진료일을 입력하세요'),
  hospitalName: z.string().optional(),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function Field({
  label, control, name, placeholder, multiline, error,
}: {
  label: string;
  control: any;
  name: keyof FormValues;
  placeholder?: string;
  multiline?: boolean;
  error?: string;
}) {
  const Colors = useColors();
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value as string}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={Colors.text.tertiary}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            textAlignVertical={multiline ? 'top' : 'center'}
            style={{
              borderWidth: 1,
              borderColor: error ? Colors.status.error : Colors.border,
              borderRadius: Spacing.borderRadius.md,
              paddingHorizontal: Spacing.md,
              paddingVertical: 12,
              fontSize: Typography.size.md,
              color: Colors.text.primary,
              backgroundColor: Colors.white,
              minHeight: multiline ? 88 : undefined,
            }}
          />
        )}
      />
      {error ? (
        <Text style={{ ...Typography.preset.caption, color: Colors.status.error, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}

export default function RecordFormScreen() {
  const Colors = useColors();
  const params = useLocalSearchParams<{ id?: string; petId: string }>();
  const petId = Number(params.petId);
  const recordId = params.id ? Number(params.id) : undefined;
  const isEdit = !!recordId;

  const { data: existing } = useRecord(petId, recordId ?? 0);
  const ocrStr = useLocalSearchParams<{ ocr?: string }>().ocr;
  const ocr = ocrStr ? JSON.parse(ocrStr) : null;

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      visitedAt: existing?.visitedAt ?? ocr?.visitedAt ?? new Date().toISOString().slice(0, 10),
      hospitalName: existing?.hospitalName ?? ocr?.hospitalName ?? '',
      symptoms: existing?.symptoms ?? ocr?.symptoms ?? '',
      diagnosis: existing?.diagnosis ?? ocr?.diagnosis ?? '',
      treatment: existing?.treatment ?? ocr?.treatment ?? '',
      prescription: existing?.prescription ?? ocr?.prescription ?? '',
      notes: existing?.notes ?? '',
    },
  });

  const { mutate: create, isPending: creating } = useCreateRecord(petId);
  const { mutate: update, isPending: updating } = useUpdateRecord(petId, recordId ?? 0);
  const loading = creating || updating;

  const onSubmit = (data: FormValues) => {
    const payload: RecordRequest = {
      visitedAt: data.visitedAt,
      hospitalName: data.hospitalName || undefined,
      symptoms: data.symptoms || undefined,
      diagnosis: data.diagnosis || undefined,
      treatment: data.treatment || undefined,
      prescription: data.prescription || undefined,
      notes: data.notes || undefined,
    };
    if (isEdit) {
      update(payload, { onSuccess: () => router.back() });
    } else {
      create(payload, {
        onSuccess: (record) => router.replace({ pathname: '/records/[id]', params: { id: record.id, petId } }),
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title={isEdit ? '진료기록 수정' : '진료기록 작성'}
        back
        actions={[{ icon: 'check', label: '저장', onPress: handleSubmit(onSubmit) }]}
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxxl }} keyboardShouldPersistTaps="handled">
        <Field label="진료일 *" control={control} name="visitedAt" placeholder="YYYY-MM-DD" error={errors.visitedAt?.message} />
        <Field label="병원명" control={control} name="hospitalName" placeholder="병원 이름" />
        <Field label="증상" control={control} name="symptoms" placeholder="증상을 입력하세요" multiline />
        <Field label="진단" control={control} name="diagnosis" placeholder="진단 내용" multiline />
        <Field label="치료" control={control} name="treatment" placeholder="치료 내용" multiline />
        <Field label="처방" control={control} name="prescription" placeholder="처방 내용" multiline />
        <Field label="메모" control={control} name="notes" placeholder="기타 메모" multiline />
        <View style={{ height: Spacing.md }} />
        <Button fullWidth size="lg" loading={loading} onPress={handleSubmit(onSubmit)}>
          {isEdit ? '수정 완료' : '저장'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
