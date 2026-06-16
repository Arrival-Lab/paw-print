import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TextInput, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import { useLeaveConfirm } from '../../shared/hooks/useLeaveConfirm';
import PetContextBadge from '../../features/pet/components/PetContextBadge';
import Button from '../../shared/components/Button';
import DateInput from '../../shared/components/DateInput';
import HospitalAutocomplete from '../../features/record/components/HospitalAutocomplete';
import { useCreateAppointment } from '../../features/appointment/hooks/useAppointments';

/**
 * 병원 예약 추가 화면. 단순 폼.
 * 진입: 홈 FAB QuickActionSheet 의 "병원 예약" 또는 다이어리 캘린더 빈 날짜에서.
 */
export default function NewAppointmentScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
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

  // 자유 입력 필드 중 하나라도 채워졌으면 작성 중으로 간주 (날짜·시간은 기본값이라 제외).
  const isDirty = !!(hospitalName.trim() || reason.trim() || notes.trim());
  const { allowLeave } = useLeaveConfirm(isDirty);

  const handleSave = () => {
    if (!date) return Alert.alert(t('action.confirm'), t('appointment.selectDate'));
    if (!/^\d{2}:\d{2}$/.test(time)) return Alert.alert(t('action.confirm'), t('appointment.invalidTimeFormat'));
    const [hh, mm] = time.split(':').map(Number);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return Alert.alert(t('action.confirm'), t('appointment.invalidTime'));

    const appointmentAt = `${date}T${time}:00`;

    create(
      {
        appointmentAt,
        hospitalName: hospitalName || undefined,
        reason: reason || undefined,
        notes: notes || undefined,
        reminderEnabled,
      },
      { onSuccess: () => { allowLeave(); router.back(); } },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title={t('appointment.addTitle')}
        back
        titleSlot={petId ? <PetContextBadge petId={petId} locked /> : undefined}
        actions={[{ icon: 'check', label: t('action.save'), onPress: handleSave }]}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: Spacing.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View>
          <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
            {t('appointment.dateLabel')}
          </Text>
          <DateInput value={date} onChange={setDate} title={t('appointment.date')} />
        </View>

        <View>
          <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
            {t('appointment.timeLabel')}
          </Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder={t('appointment.timePlaceholder')}
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
            {t('appointment.hospital')}
          </Text>
          <HospitalAutocomplete
            petId={petId}
            value={hospitalName}
            onChange={setHospitalName}
            placeholder={t('record.hospitalPlaceholder')}
          />
        </View>
        <Field label={t('appointment.reasonLabel')} value={reason} onChangeText={setReason} placeholder={t('appointment.reasonPlaceholder')} />
        <Field label={t('appointment.memo')} value={notes} onChangeText={setNotes} placeholder={t('appointment.memoPlaceholder')} multiline />

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
            <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>{t('appointment.reminder')}</Text>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
              {t('appointment.reminderDesc')}
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
          {t('action.save')}
        </Button>
      </ScrollView>
      </KeyboardAvoidingView>
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
