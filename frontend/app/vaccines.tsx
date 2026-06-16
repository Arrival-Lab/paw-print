import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Modal, TextInput, Switch, Alert, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PetSelector from '../features/pet/components/PetSelector';
import { VaccineCard } from '../features/vaccine/components/VaccineCard';
import {
  useVaccines, useCreateVaccine, useDeleteVaccine, useUpdateVaccine,
} from '../features/vaccine/hooks/useVaccines';
import { useAuthStore } from '../features/auth/store/authStore';
import { useUiStore } from '../shared/store/uiStore';
import { Spacing, Typography, Config } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import DateInput from '../shared/components/DateInput';
import ScreenHeader from '../shared/components/ScreenHeader';
import { confirmLeaveIfDirty } from '../shared/utils/confirmLeave';
import Fab from '../shared/components/Fab';
import Button from '../shared/components/Button';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import type { VaccineRequest } from '../features/vaccine/api/vaccineApi';

const schema = z.object({
  vaccineName: z.string().min(1, 'vaccine.nameRequired'),
  vaccinatedAt: z.string().min(1, 'vaccine.dateRequired'),
  nextVaccineAt: z.string().optional(),
  notes: z.string().optional(),
  alertEnabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function DateField({ label, control, name, title, hasError }: any) {
  const Colors = useColors();
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <DateInput value={value} onChange={onChange} title={title ?? label} hasError={hasError} />
        )}
      />
    </View>
  );
}

function Field({ label, control, name, placeholder, error }: any) {
  const Colors = useColors();
  const { t } = useTranslation();
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={Colors.text.tertiary}
            style={{
              borderWidth: 1,
              borderColor: error ? Colors.status.error : Colors.border,
              borderRadius: Spacing.borderRadius.md,
              paddingHorizontal: Spacing.md,
              paddingVertical: 12,
              fontSize: Typography.size.md,
              color: Colors.text.primary,
              backgroundColor: Colors.white,
            }}
          />
        )}
      />
      {error && (
        <Text style={{ ...Typography.preset.caption, color: Colors.status.error, marginTop: 4 }}>
          {t(error.message)}
        </Text>
      )}
    </View>
  );
}

export default function VaccinesScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const { data: vaccines = [], isLoading } = useVaccines(selectedPetId ?? 0);
  const { mutate: create, isPending: creating } = useCreateVaccine(selectedPetId ?? 0);
  const { mutate: remove } = useDeleteVaccine(selectedPetId ?? 0);
  const { mutate: update } = useUpdateVaccine(selectedPetId ?? 0);

  const alertEnabledCount = vaccines.filter((v) => v.alertEnabled).length;
  const isFree = user?.subscriptionType === 'FREE';
  const canEnableAlert = !isFree || alertEnabledCount < Config.freeMaxVaccineAlerts;

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vaccineName: '',
      vaccinatedAt: new Date().toISOString().slice(0, 10),
      nextVaccineAt: '',
      notes: '',
      alertEnabled: false,
    },
  });

  const requestCloseForm = () => confirmLeaveIfDirty(isDirty, () => { setShowForm(false); reset(); });

  const handleCreate = (data: FormValues) => {
    const payload: VaccineRequest = {
      vaccineName: data.vaccineName,
      vaccinatedAt: data.vaccinatedAt,
      nextVaccineAt: data.nextVaccineAt || undefined,
      notes: data.notes || undefined,
      alertEnabled: data.alertEnabled,
    };
    create(payload, { onSuccess: () => { setShowForm(false); reset(); } });
  };

  const handleToggleAlert = (vaccineId: number, enabled: boolean) => {
    if (enabled && !canEnableAlert) {
      showPremiumModal(t('vaccine.alertLimitFree', { max: Config.freeMaxVaccineAlerts }));
      return;
    }
    update({ vaccineId, data: { vaccineName: '', vaccinatedAt: '', alertEnabled: enabled } });
  };

  const handleDelete = (vaccineId: number) => {
    Alert.alert(t('action.delete'), t('record.deleteConfirm'), [
      { text: t('action.cancel'), style: 'cancel' },
      { text: t('action.delete'), style: 'destructive', onPress: () => remove(vaccineId) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title={t('vaccine.manageTitle')} back />

      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <EmptyState icon="heart" title={t('appointment.selectPet')} tone="muted" />
      ) : isLoading ? (
        <LoadingSpinner label={t('common.loading')} />
      ) : vaccines.length === 0 ? (
        <EmptyState
          icon="shield"
          title={t('vaccine.emptyTitle')}
          description={t('vaccine.emptyDesc')}
          action={{ label: t('vaccine.register'), onPress: () => setShowForm(true) }}
        />
      ) : (
        <FlatList
          data={vaccines}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxxl }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => (
            <VaccineCard
              vaccine={item}
              canEnableAlert={canEnableAlert}
              onToggleAlert={handleToggleAlert}
              onDelete={handleDelete}
            />
          )}
        />
      )}

      {selectedPetId ? <Fab onPress={() => setShowForm(true)} icon="plus" accessibilityLabel={t('vaccine.addA11y')} /> : null}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={requestCloseForm}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader
            title={t('vaccine.register')}
            back={requestCloseForm}
            actions={[{ icon: 'check', label: t('action.save'), onPress: handleSubmit(handleCreate) }]}
          />
          <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg }} keyboardShouldPersistTaps="handled">
            <Field label={t('vaccine.nameLabel')} control={control} name="vaccineName" placeholder={t('vaccine.namePlaceholder')} error={errors.vaccineName} />
            <DateField label={t('vaccine.vaccinatedLabel')} control={control} name="vaccinatedAt" title={t('vaccine.vaccinated')} hasError={!!errors.vaccinatedAt} />
            <DateField label={t('vaccine.nextLabel')} control={control} name="nextVaccineAt" title={t('vaccine.nextLabel')} />
            <Field label={t('vaccine.memo')} control={control} name="notes" placeholder={t('vaccine.memoPlaceholder')} />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: Spacing.md,
                padding: Spacing.md,
                backgroundColor: Colors.surface,
                borderRadius: Spacing.borderRadius.md,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>{t('vaccine.alertTitle')}</Text>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                  {t('vaccine.alertDescSimple')}
                </Text>
              </View>
              <Controller
                control={control}
                name="alertEnabled"
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

            <View style={{ height: Spacing.xl }} />
            <Button fullWidth size="lg" loading={creating} onPress={handleSubmit(handleCreate)}>
              {t('action.save')}
            </Button>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
