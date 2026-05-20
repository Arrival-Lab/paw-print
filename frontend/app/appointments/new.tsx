import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';
import DateInput from '../../shared/components/DateInput';
import HospitalAutocomplete from '../../shared/components/HospitalAutocomplete';
import { useCreateAppointment } from '../../features/appointment/hooks/useAppointments';

/**
 * 병원 예약 추가 화면. 단순 폼.
 * 진입: 홈 FAB QuickActionSheet 의 "병원 예약" 또는 다이어리 캘린더 빈 날짜에서.
 */
export default function NewAppointmentScreen() {
  const Colors = useColors();
  const params = useLocalSearchParams<{ petId: string; date?: string }>();
  const petId = Number(params.petId);

  // 기본값: 내일 10:00, 또는 params.date 가 있으면 그날 09:00.
  const defaultDate = (() => {
    if (params.date) return params.date;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const defaultTime = params.date ? '09:00' : '10:00';

  const [date, setDate] = useState<string>(defaultDate);
  const [time, setTime] = useState<string>(defaultTime);
  const [hospitalName, setHospitalName] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const { mutate: create, isPending } = useCreateAppointment(petId);

  const handleSave = () => {
    if (!date) return Alert.alert('확인', '날짜를 선택해주세요.');
    if (!/^\d{2}:\d{2}$/.test(time)) return Alert.alert('확인', '시간 형식이 올바르지 않아요. HH:mm 으로 입력해주세요.');
    const [hh, mm] = time.split(':').map(Number);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return Alert.alert('확인', '올바른 시간을 입력해주세요.');

    const appointmentAt = `${date}T${time}:00`;

    create(
      {
        appointmentAt,
        hospitalName: hospitalName || undefined,
        reason: reason || undefined,
        notes: notes || undefined,
        reminderEnabled,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title="병원 예약 추가"
        back
        petBadge={petId}
        actions={[{ icon: 'check', label: '저장', onPress: handleSave }]}
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
            예약 날짜 *
          </Text>
          <DateInput value={date} onChange={setDate} title="예약 날짜" />
        </View>

        <View>
          <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
            예약 시간 *
          </Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="HH:mm (예: 14:30)"
            placeholderTextColor={Colors.text.tertiary}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            style={{
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: Spacing.borderRadius.md,
              paddingHorizontal: Spacing.md,
              paddingVertical: 12,
              fontSize: Typography.size.md,
              color: Colors.text.primary,
              backgroundColor: Colors.white,
            }}
          />
        </View>

        <View>
          <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
            병원
          </Text>
          <HospitalAutocomplete
            petId={petId}
            value={hospitalName}
            onChange={setHospitalName}
            placeholder="병원 이름"
          />
        </View>
        <Field label="방문 목적" value={reason} onChangeText={setReason} placeholder="예: 정기검진, 예방접종, 상담" />
        <Field label="메모" value={notes} onChangeText={setNotes} placeholder="준비물·문의사항 등" multiline />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: Spacing.md,
            borderRadius: Spacing.borderRadius.md,
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>예약 알림</Text>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
              하루 전·당일 푸시
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={{ height: Spacing.md }} />
        <Button fullWidth size="lg" loading={isPending} onPress={handleSave}>
          저장
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const Colors = useColors();
  return (
    <View>
      <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: Spacing.borderRadius.md,
          paddingHorizontal: Spacing.md,
          paddingVertical: 12,
          fontSize: Typography.size.md,
          color: Colors.text.primary,
          backgroundColor: Colors.white,
          minHeight: multiline ? 88 : undefined,
        }}
      />
    </View>
  );
}
