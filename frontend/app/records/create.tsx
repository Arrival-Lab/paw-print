import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useRecord, useCreateRecord, useUpdateRecord } from '../../features/record/hooks/useRecords';
import { useAppointments } from '../../features/appointment/hooks/useAppointments';
import { useCreateCareItem } from '../../features/care/hooks/useCare';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import PetContextBadge from '../../features/pet/components/PetContextBadge';
import Button from '../../shared/components/Button';
import DateInput from '../../shared/components/DateInput';
import HospitalAutocomplete from '../../features/record/components/HospitalAutocomplete';
import type { RecordRequest, OcrResult } from '../../features/record/api/recordApi';
import type { Appointment } from '../../features/appointment/api/appointmentApi';

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
  const params = useLocalSearchParams<{
    id?: string;
    petId: string;
    ocr?: string;
    prefillVisitedAt?: string;
    prefillHospital?: string;
    prefillSymptoms?: string;
    /** 진료일정에서 시작된 진료기록 작성 — 저장 시 양방향 링크. */
    appointmentId?: string;
  }>();
  const petId = Number(params.petId);
  const recordId = params.id ? Number(params.id) : undefined;
  const isEdit = !!recordId;
  const appointmentId = params.appointmentId ? Number(params.appointmentId) : undefined;

  const { data: existing } = useRecord(petId, recordId ?? 0);
  const ocr: OcrResult | null = useMemo(() => (params.ocr ? JSON.parse(params.ocr) : null), [params.ocr]);
  // 진료일정 → 진료기록 변환 시 prefill (지난 예약 카드 탭). OCR 보다 우선순위 낮음.
  const appointmentPrefill = useMemo(() => ({
    visitedAt: params.prefillVisitedAt || null,
    hospitalName: params.prefillHospital || null,
    symptoms: params.prefillSymptoms || null,
  }), [params.prefillVisitedAt, params.prefillHospital, params.prefillSymptoms]);

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

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      visitedAt: existing?.visitedAt ?? ocr?.visitedAt ?? appointmentPrefill.visitedAt ?? new Date().toISOString().slice(0, 10),
      hospitalName: existing?.hospitalName ?? ocr?.hospitalName ?? appointmentPrefill.hospitalName ?? '',
      symptoms: existing?.symptoms ?? ocr?.symptoms ?? appointmentPrefill.symptoms ?? '',
      diagnosis: existing?.diagnosis ?? ocr?.diagnosis ?? '',
      treatment: existing?.treatment ?? ocr?.treatment ?? '',
      prescription: existing?.prescription ?? ocr?.prescription ?? '',
      notes: existing?.notes ?? '',
    },
  });

  // 진료일정 ↔ 진료기록 양방향 링크
  // - 신규: dropdown 으로 과거 일정 선택 가능. nav param appointmentId 가 들어오면 초기 선택.
  // - 수정: 백엔드가 appointmentId 변경을 무시 (MedicalRecordService.update). UI 도 read-only chip 으로 노출.
  const { data: appointments } = useAppointments(petId);
  const pastAppointments = useMemo<Appointment[]>(() => {
    const now = Date.now();
    return ((appointments as unknown as Appointment[] | undefined) ?? [])
      .filter((a) => new Date(a.appointmentAt).getTime() < now)
      .filter((a) => a.linkedRecordId == null)
      .sort((a, b) => b.appointmentAt.localeCompare(a.appointmentAt))
      .slice(0, 10);
  }, [appointments]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | undefined>(appointmentId);
  const [appointmentPickerOpen, setAppointmentPickerOpen] = useState(false);

  // 수정 모드에서 기존 연결 일정 보여주려면 lookup 필요. appointments 리스트엔 미래만 있는 게 아니라 전체이므로 그대로 사용.
  const linkedAppointment = useMemo<Appointment | undefined>(() => {
    const targetId = isEdit ? existing?.appointmentId ?? undefined : selectedAppointmentId;
    if (!targetId) return undefined;
    return ((appointments as unknown as Appointment[] | undefined) ?? []).find((a) => a.id === targetId);
  }, [appointments, isEdit, existing?.appointmentId, selectedAppointmentId]);

  const handleSelectAppointment = (appt: Appointment | null) => {
    setAppointmentPickerOpen(false);
    if (!appt) {
      setSelectedAppointmentId(undefined);
      return;
    }
    setSelectedAppointmentId(appt.id);
    // 일정 선택 시 form prefill — 사용자가 후속 수정 가능.
    setValue('visitedAt', appt.appointmentAt.slice(0, 10), { shouldDirty: true });
    if (appt.hospitalName) setValue('hospitalName', appt.hospitalName, { shouldDirty: true });
    if (appt.reason) setValue('symptoms', appt.reason, { shouldDirty: true });
  };

  const { mutate: create, isPending: creating } = useCreateRecord(petId);
  const { mutate: update, isPending: updating } = useUpdateRecord(petId, recordId ?? 0);
  const { mutate: createCareItem } = useCreateCareItem(petId);
  const loading = creating || updating;

  // 처방약 텍스트 정제 — 50자 넘으면 잘라서 케어 항목 이름으로 사용.
  const buildCareName = (prescription: string): string => {
    const cleaned = prescription.trim().split('\n')[0].trim();
    return cleaned.length > 50 ? `${cleaned.slice(0, 50)}…` : cleaned;
  };

  const promptCareLink = (prescription: string, onDone: () => void) => {
    const name = buildCareName(prescription);
    Alert.alert(
      '일상 케어에 추가할까요?',
      `이 처방약을 매일 챙기는 항목으로 등록하면 '기록 > 일상'에서 체크할 수 있어요.\n\n· ${name}`,
      [
        { text: '나중에', style: 'cancel', onPress: onDone },
        {
          text: '추가',
          onPress: () => {
            createCareItem(
              { name, itemType: 'MEDICATION', targetCount: 1 },
              { onSettled: onDone },
            );
          },
        },
      ],
    );
  };

  const onSubmit = (data: FormValues) => {
    const payload: RecordRequest = {
      visitedAt: data.visitedAt,
      hospitalName: data.hospitalName || undefined,
      symptoms: data.symptoms || undefined,
      diagnosis: data.diagnosis || undefined,
      treatment: data.treatment || undefined,
      prescription: data.prescription || undefined,
      notes: data.notes || undefined,
      // 신규 작성 시 selectedAppointmentId 로 양방향 링크. 수정 시엔 백엔드가 어차피 무시(record.update 가 appointmentId 미포함).
      ...(selectedAppointmentId && !isEdit ? { appointmentId: selectedAppointmentId } : {}),
    };
    if (isEdit) {
      update(payload, { onSuccess: () => router.back() });
    } else {
      create(payload, {
        onSuccess: (record) => {
          const navigate = () =>
            router.replace({ pathname: '/records/[id]', params: { id: (record as any).id, petId } });
          if (data.prescription?.trim()) {
            promptCareLink(data.prescription.trim(), navigate);
          } else {
            navigate();
          }
        },
      });
    }
  };

  const hasAiFields = Object.values(aiFields).some(Boolean);
  // OCR 응답엔 있지만 값이 null 인 필드 — 사용자에게 "사진에서 못 찾았어요" 안내용.
  const missingOcrFieldLabels = useMemo<string[]>(() => {
    if (!ocr || isEdit) return [];
    const FIELD_LABELS: Record<keyof OcrResult, string> = {
      hospitalName: '병원명',
      visitedAt: '방문일',
      symptoms: '증상',
      diagnosis: '진단명',
      treatment: '처치',
      prescription: '처방약',
    };
    return (Object.keys(FIELD_LABELS) as (keyof OcrResult)[])
      .filter((k) => !ocr[k])
      .map((k) => FIELD_LABELS[k]);
  }, [ocr, isEdit]);
  const showOcrBanner = !isEdit && !!ocr;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title={isEdit ? '진료기록 수정' : '진료기록 작성'}
        back
        titleSlot={petId ? <PetContextBadge petId={petId} locked /> : undefined}
        actions={[{ icon: 'check', label: '저장', onPress: handleSubmit(onSubmit) }]}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxxl }} keyboardShouldPersistTaps="handled">
        {showOcrBanner ? (
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
                {hasAiFields ? 'AI가 사진에서 채워둔 내용이에요' : '사진에서 정보를 찾지 못했어요'}
              </Text>
              {hasAiFields ? (
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                  노란 표시가 있는 필드는 한 번 더 확인해주세요. 수정하면 표시가 사라져요.
                </Text>
              ) : null}
              {missingOcrFieldLabels.length > 0 ? (
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                  {hasAiFields ? '못 찾은 항목: ' : '직접 입력해주세요 — '}
                  {missingOcrFieldLabels.join(', ')}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
        {/* 진료 일정 연결 — 신규: dropdown / 수정: read-only chip */}
        {!isEdit ? (
          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
              진료 일정 연결
            </Text>
            <TouchableOpacity
              onPress={() => setAppointmentPickerOpen((v) => !v)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: Spacing.borderRadius.md,
                paddingHorizontal: Spacing.md,
                paddingVertical: 12,
                backgroundColor: Colors.white,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontSize: Typography.size.md,
                  color: linkedAppointment ? Colors.text.primary : Colors.text.tertiary,
                }}
              >
                {linkedAppointment
                  ? `${linkedAppointment.hospitalName ?? '병원 미입력'} · ${linkedAppointment.appointmentAt.slice(0, 10)}`
                  : '지난 예약 중에서 선택 (선택 사항)'}
              </Text>
              <Feather
                name={appointmentPickerOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
            {appointmentPickerOpen ? (
              <View
                style={{
                  marginTop: Spacing.xs,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: Spacing.borderRadius.md,
                  backgroundColor: Colors.white,
                  overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  onPress={() => handleSelectAppointment(null)}
                  style={{
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 12,
                    borderBottomWidth: pastAppointments.length > 0 ? 1 : 0,
                    borderBottomColor: Colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: Typography.size.md,
                      color: selectedAppointmentId == null ? Colors.primaryDark : Colors.text.primary,
                      fontWeight: selectedAppointmentId == null ? Typography.weight.semibold : Typography.weight.regular,
                    }}
                  >
                    연결 없음
                  </Text>
                </TouchableOpacity>
                {pastAppointments.length === 0 ? (
                  <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 12 }}>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                      아직 지난 예약이 없어요
                    </Text>
                  </View>
                ) : (
                  pastAppointments.map((appt, idx) => {
                    const isSelected = selectedAppointmentId === appt.id;
                    return (
                      <TouchableOpacity
                        key={appt.id}
                        onPress={() => handleSelectAppointment(appt)}
                        style={{
                          paddingHorizontal: Spacing.md,
                          paddingVertical: 12,
                          borderBottomWidth: idx === pastAppointments.length - 1 ? 0 : 1,
                          borderBottomColor: Colors.border,
                          backgroundColor: isSelected ? Colors.primaryLight : 'transparent',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: Spacing.sm,
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1,
                            fontSize: Typography.size.md,
                            color: isSelected ? Colors.primaryDark : Colors.text.primary,
                            fontWeight: isSelected ? Typography.weight.semibold : Typography.weight.regular,
                          }}
                        >
                          {appt.hospitalName ?? '병원 미입력'}
                        </Text>
                        <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>
                          {appt.appointmentAt.slice(0, 10)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : null}
            {linkedAppointment ? (
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 4 }}>
                선택한 예약의 병원·날짜·사유가 아래 필드에 자동으로 채워졌어요.
              </Text>
            ) : null}
          </View>
        ) : existing?.appointmentId && linkedAppointment ? (
          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
              연결된 진료 일정
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
                paddingHorizontal: Spacing.md,
                paddingVertical: 10,
                borderRadius: Spacing.borderRadius.md,
                backgroundColor: Colors.primaryLight,
              }}
            >
              <Feather name="link" size={14} color={Colors.primaryDark} />
              <Text style={{ fontSize: Typography.size.sm, color: Colors.primaryDark, flex: 1 }} numberOfLines={1}>
                {linkedAppointment.hospitalName ?? '병원 미입력'} · {linkedAppointment.appointmentAt.slice(0, 10)}
              </Text>
            </View>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 4 }}>
              일정 연결은 신규 작성 시에만 변경할 수 있어요.
            </Text>
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
        {/* 병원명 — 이전 입력 기반 autocomplete. AI 채움 hint 도 함께 표시. */}
        <View style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.xs }}>
            <Text style={{ ...Typography.preset.label, color: Colors.text.secondary }}>병원명</Text>
            {aiFields.hospitalName ? (
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
            name="hospitalName"
            render={({ field: { value, onChange } }) => (
              <HospitalAutocomplete
                petId={petId}
                value={(value as string) ?? ''}
                onChange={(v) => {
                  onChange(v);
                  if (aiFields.hospitalName) clearAi('hospitalName');
                }}
                placeholder="병원 이름"
              />
            )}
          />
        </View>
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
