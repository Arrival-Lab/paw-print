import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useRecord, useCreateRecord, useUpdateRecord } from '../../features/record/hooks/useRecords';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';
import DateInput from '../../shared/components/DateInput';
import type { RecordRequest, OcrResult } from '../../features/record/api/recordApi';

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

interface FieldProps {
  label: string;
  control: any;
  name: keyof FormValues;
  placeholder?: string;
  multiline?: boolean;
  error?: string;
  /** true 면 AI 가 채워준 필드라는 시각 큐 (노란 좌측 보더 + 캡션). 편집 시 자동 해제. */
  aiHint?: boolean;
  /** 외부에서 "편집됨" 알리는 콜백 — aiHint 해제용. */
  onUserEdit?: () => void;
}

function Field({ label, control, name, placeholder, multiline, error, aiHint, onUserEdit }: FieldProps) {
  const Colors = useColors();
  const borderColor = error
    ? Colors.status.error
    : aiHint
      ? Colors.status.warning
      : Colors.border;
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.xs }}>
        <Text style={{ ...Typography.preset.label, color: Colors.text.secondary }}>{label}</Text>
        {aiHint ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: Spacing.borderRadius.sm,
              backgroundColor: Colors.status.warningBg,
            }}
          >
            <Feather name="zap" size={9} color={Colors.status.warning} />
            <Text style={{ fontSize: Typography.size.xxs, color: Colors.status.warning, fontWeight: Typography.weight.bold }}>
              AI 입력 · 확인
            </Text>
          </View>
        ) : null}
      </View>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value as string}
            onChangeText={(t) => {
              onChange(t);
              if (aiHint && onUserEdit) onUserEdit();
            }}
            placeholder={placeholder}
            placeholderTextColor={Colors.text.tertiary}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            textAlignVertical={multiline ? 'top' : 'center'}
            style={{
              borderWidth: 1,
              borderColor,
              borderLeftWidth: aiHint ? 3 : 1,
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
  const params = useLocalSearchParams<{ id?: string; petId: string; ocr?: string }>();
  const petId = Number(params.petId);
  const recordId = params.id ? Number(params.id) : undefined;
  const isEdit = !!recordId;

  const { data: existing } = useRecord(petId, recordId ?? 0);
  const ocr: OcrResult | null = useMemo(() => (params.ocr ? JSON.parse(params.ocr) : null), [params.ocr]);

  // OCR 가 채워준 필드 추적 — 사용자가 손대면 해당 필드는 hint 해제.
  const initialAiFields = useMemo<Partial<Record<keyof FormValues, boolean>>>(() => {
    if (!ocr || isEdit) return {};
    return {
      hospitalName: !!ocr.hospitalName,
      visitedAt: !!ocr.visitedAt,
      symptoms: !!ocr.symptoms,
      diagnosis: !!ocr.diagnosis,
      treatment: !!ocr.treatment,
      prescription: !!ocr.prescription,
    };
  }, [ocr, isEdit]);
  const [aiFields, setAiFields] = useState(initialAiFields);
  const clearAi = (key: keyof FormValues) =>
    setAiFields((prev) => ({ ...prev, [key]: false }));

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

  const hasAiFields = Object.values(aiFields).some(Boolean);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title={isEdit ? '진료기록 수정' : '진료기록 작성'}
        back
        petBadge={petId}
        actions={[{ icon: 'check', label: '저장', onPress: handleSubmit(onSubmit) }]}
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxxl }} keyboardShouldPersistTaps="handled">
        {hasAiFields ? (
          <View
            style={{
              marginBottom: Spacing.lg,
              padding: Spacing.md,
              borderRadius: Spacing.borderRadius.lg,
              backgroundColor: Colors.status.warningBg,
              flexDirection: 'row',
              gap: Spacing.sm,
              alignItems: 'flex-start',
            }}
          >
            <Feather name="zap" size={14} color={Colors.status.warning} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...Typography.preset.bodyMedium, color: Colors.status.warning, fontWeight: Typography.weight.bold }}>
                AI가 사진에서 채워둔 내용이에요
              </Text>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                노란 표시가 있는 필드는 한 번 더 확인해주세요. 수정하면 표시가 사라져요.
              </Text>
            </View>
          </View>
        ) : null}
        <View style={{ marginBottom: Spacing.md }}>
          <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
            진료일 *
          </Text>
          <Controller
            control={control}
            name="visitedAt"
            render={({ field: { value, onChange } }) => (
              <DateInput
                value={value}
                onChange={(v) => {
                  onChange(v);
                  if (aiFields.visitedAt) clearAi('visitedAt');
                }}
                title="진료일"
                hasError={!!errors.visitedAt}
                maxDate={new Date().toISOString().split('T')[0]}
              />
            )}
          />
          {errors.visitedAt?.message ? (
            <Text style={{ ...Typography.preset.caption, color: Colors.status.error, marginTop: 4 }}>
              {String(errors.visitedAt.message)}
            </Text>
          ) : null}
        </View>
        <Field
          label="병원명" control={control} name="hospitalName" placeholder="병원 이름"
          aiHint={aiFields.hospitalName} onUserEdit={() => clearAi('hospitalName')}
        />
        <Field
          label="증상" control={control} name="symptoms" placeholder="증상을 입력하세요" multiline
          aiHint={aiFields.symptoms} onUserEdit={() => clearAi('symptoms')}
        />
        <Field
          label="진단" control={control} name="diagnosis" placeholder="진단 내용" multiline
          aiHint={aiFields.diagnosis} onUserEdit={() => clearAi('diagnosis')}
        />
        <Field
          label="치료" control={control} name="treatment" placeholder="치료 내용" multiline
          aiHint={aiFields.treatment} onUserEdit={() => clearAi('treatment')}
        />
        <Field
          label="처방" control={control} name="prescription" placeholder="처방 내용" multiline
          aiHint={aiFields.prescription} onUserEdit={() => clearAi('prescription')}
        />
        <Field label="메모" control={control} name="notes" placeholder="기타 메모" multiline />
        <View style={{ height: Spacing.md }} />
        <Button fullWidth size="lg" loading={loading} onPress={handleSubmit(onSubmit)}>
          {isEdit ? '수정 완료' : '저장'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
